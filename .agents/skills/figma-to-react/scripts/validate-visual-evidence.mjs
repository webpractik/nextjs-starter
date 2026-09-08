import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { inspectGitBaseline } from './lib/git-baseline.mjs';
import { compareRgbaPng, decodeRgbaPng, inspectPng } from './lib/png-rgba.mjs';
import {
  validateCompatibilityMarkdown,
  validateFinalReportMarkdown,
  validatePreCodeMarkdown,
} from './lib/markdown-records.mjs';
import { loadJsonDocument, validateSchema } from './lib/schema-validator.mjs';
import { closeEnough, validateVisualAnalysis } from './lib/visual-analysis.mjs';
import { validateTaskContract } from './validate-task-contract.mjs';

const captureContractSchema = await loadJsonDocument(
  new URL('../schemas/capture-contract.schema.json', import.meta.url),
);
const evidenceEventSchema = await loadJsonDocument(
  new URL('../schemas/evidence-event.schema.json', import.meta.url),
);
const designContextManifestSchema = await loadJsonDocument(
  new URL('../schemas/design-context-manifest.schema.json', import.meta.url),
);
const sourceManifestSchema = await loadJsonDocument(
  new URL('../schemas/source-manifest.schema.json', import.meta.url),
);
const conformanceSchema = await loadJsonDocument(
  new URL('../schemas/comparator-conformance.schema.json', import.meta.url),
);
const implementationManifestSchema = await loadJsonDocument(
  new URL('../schemas/implementation-manifest.schema.json', import.meta.url),
);
const verificationRecordSchema = await loadJsonDocument(
  new URL('../schemas/verification-record.schema.json', import.meta.url),
);
const browserEvidenceSchema = await loadJsonDocument(
  new URL('../schemas/browser-evidence.schema.json', import.meta.url),
);
const visualApprovalSchema = await loadJsonDocument(
  new URL('../schemas/visual-approval.schema.json', import.meta.url),
);
const failureRecordSchema = await loadJsonDocument(
  new URL('../schemas/failure-record.schema.json', import.meta.url),
);
const rawSchema = await loadJsonDocument(
  new URL('../schemas/visual-compare-raw.schema.json', import.meta.url),
);
const resultSchema = await loadJsonDocument(
  new URL('../schemas/visual-result.schema.json', import.meta.url),
);

const bundleFiles = [
  'actual.png',
  'reference.png',
  'diff.png',
  'overlay.png',
  'raw.json',
  'analysis.md',
  'result.json',
];
const checksumPattern = /^sha256:[a-f0-9]{64}$/u;
const legacyArtifactRoot = ['artifacts', 'figma'].join('/');
const maximumJsonBytes = 4 * 1024 * 1024;
const maximumArtifactBytes = 64 * 1024 * 1024;
const forbiddenImplementationRoots = [
  'artifacts/visual',
  'tests/visual/references/figma',
  'node_modules',
  '.git',
];
const designContextResponseFormats = new Map([
  ['get_design_context', { format: 'text', extension: 'txt' }],
  ['get_metadata', { format: 'xml', extension: 'xml' }],
  ['get_screenshot', { format: 'png', extension: 'png' }],
  ['get_variable_defs', { format: 'json', extension: 'json' }],
  ['download_assets', { format: 'json', extension: 'json' }],
  ['get_code_connect_map', { format: 'json', extension: 'json' }],
]);
const unsupportedRuntimeAssetExtensions = new Set([
  'apng',
  'avif',
  'bmp',
  'cur',
  'gif',
  'heic',
  'heif',
  'ico',
  'jfif',
  'jpeg',
  'jpg',
  'jxl',
  'pjp',
  'pjpeg',
  'pdf',
  'svgz',
  'tif',
  'tiff',
  'webp',
]);
const textImplementationExtensions = new Set([
  'css',
  'html',
  'htm',
  'js',
  'json',
  'jsonc',
  'jsx',
  'less',
  'mdx',
  'mjs',
  'cjs',
  'sass',
  'scss',
  'svelte',
  'ts',
  'tsx',
  'vue',
  'yaml',
  'yml',
]);

class VisualInputError extends Error {
  constructor(id, message) {
    super(message);
    this.name = 'VisualInputError';
    this.id = id;
  }
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function compareUtf8Text(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function startsWithBytes(buffer, bytes) {
  return Buffer.isBuffer(buffer) &&
    buffer.length >= bytes.length &&
    bytes.every((byte, index) => buffer[index] === byte);
}

function sniffImagePayload(buffer) {
  if (!Buffer.isBuffer(buffer)) return undefined;
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' ||
      buffer.subarray(0, 6).toString('ascii') === 'GIF89a') return 'gif';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (buffer.subarray(0, 2).toString('ascii') === 'BM') return 'bmp';
  if (startsWithBytes(buffer, [0x00, 0x00, 0x01, 0x00])) return 'ico';
  if (startsWithBytes(buffer, [0x00, 0x00, 0x02, 0x00])) return 'cur';
  if (startsWithBytes(buffer, [0x49, 0x49, 0x2a, 0x00]) ||
      startsWithBytes(buffer, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  if (startsWithBytes(buffer, [0xff, 0x0a]) ||
      startsWithBytes(buffer, [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a])) {
    return 'jxl';
  }
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brands = buffer.subarray(8, Math.min(buffer.length, 32)).toString('ascii');
    if (/(?:avif|avis|heic|heix|hevc|hevx|mif1|msf1)/u.test(brands)) return 'isobmff-image';
  }
  try {
    const prefix = new TextDecoder('utf-8', { fatal: true })
      .decode(buffer)
      .replace(/^\uFEFF/u, '')
      .trimStart();
    if (/^(?:<\?xml\b[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/iu.test(prefix)) {
      return 'svg';
    }
  } catch {
    // Binary payloads are handled by their signatures above.
  }
  return undefined;
}

function validateImplementationPayloadSafety(implementationBuffers, diagnostics) {
  const forbiddenPatterns = [
    ['implementation.embedded-image', /data\s*:\s*image\//iu, 'Embedded data-image payloads are forbidden.'],
    ['implementation.inline-svg', /<svg(?:\s|>)/iu, 'Inline SVG is forbidden; use a verified local SVG file.'],
    [
      'implementation.evidence-reference',
      /(?:artifacts\/visual|tests\/visual\/references\/figma|artifacts\/figma)(?:\/|["'`])/iu,
      'Application files must not load task evidence or visual-reference files at runtime.',
    ],
    [
      'implementation.external-resource',
      /\burl\s*\(\s*["']?\s*(?:https?:)?\/\//iu,
      'Literal external runtime resource URLs are forbidden; materialize a verified local asset.',
    ],
    [
      'implementation.external-resource',
      /\b(?:src|srcSet|poster)\s*=\s*(?:"[^"\r\n]*(?:https?:)?\/\/|'[^'\r\n]*(?:https?:)?\/\/|`[^`\r\n]*(?:https?:)?\/\/|\{\s*(?:"[^"\r\n]*(?:https?:)?\/\/|'[^'\r\n]*(?:https?:)?\/\/|`[^`\r\n]*(?:https?:)?\/\/)|(?:https?:)?\/\/[^\s>]+)/iu,
      'Literal external runtime resource URLs are forbidden; materialize a verified local asset.',
    ],
    [
      'implementation.external-resource',
      /<link\b[^>]*\bhref\s*=\s*(?:"[^"\r\n]*(?:https?:)?\/\/|'[^'\r\n]*(?:https?:)?\/\/|(?:https?:)?\/\/[^\s>]+)/iu,
      'Literal external runtime resource URLs are forbidden; materialize a verified local asset.',
    ],
    [
      'implementation.external-resource',
      /(?:@import\s+(?:url\s*\(\s*)?["']?\s*(?:https?:)?\/\/|\bimage-set\s*\([^)]*["']\s*(?:https?:)?\/\/|(?:figma|mcp):\/\/)/iu,
      'Literal external runtime resource URLs are forbidden; materialize a verified local asset.',
    ],
  ];
  for (const [filePath, buffer] of implementationBuffers) {
    const extension = /\.([^.]+)$/u.exec(filePath)?.[1]?.toLowerCase();
    const payloadKind = sniffImagePayload(buffer);
    if (payloadKind && extension !== payloadKind) {
      addDiagnostic(
        diagnostics,
        'implementation.disguised-image',
        filePath,
        `Image payload ${payloadKind} must not be disguised as .${extension ?? '(no extension)'}.`,
      );
    }
    if (!textImplementationExtensions.has(extension)) continue;
    let source;
    try {
      source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      addDiagnostic(
        diagnostics,
        'implementation.text-encoding',
        filePath,
        'A changed source-like file must contain valid UTF-8.',
      );
      continue;
    }
    for (const [id, pattern, message] of forbiddenPatterns) {
      if (pattern.test(source)) addDiagnostic(diagnostics, id, filePath, message);
    }
  }
}

function addDiagnostic(diagnostics, id, diagnosticPath, message) {
  if (
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.id === id &&
        diagnostic.path === diagnosticPath &&
        diagnostic.message === message,
    )
  ) {
    diagnostics.push({ id, path: diagnosticPath, message });
  }
}

function environmentFingerprint(environment) {
  if (!isObject(environment)) return undefined;
  const fontHashes = [...(environment.fontHashes ?? [])]
    .map(({ family, style, weight, hash }) => ({ family, style, weight, hash }))
    .sort((left, right) =>
      compareUtf8Text(
        `${left.family}\0${left.style}\0${left.weight}\0${left.hash}`,
        `${right.family}\0${right.style}\0${right.weight}\0${right.hash}`,
      ),
    );
  return JSON.stringify({
    browser: environment.browser,
    os: environment.os,
    container: environment.container,
    headless: environment.headless,
    fontHashes,
  });
}

function captureLogicalDimensions(captureCase) {
  if (captureCase?.captureRegion?.kind === 'viewport') {
    return isObject(captureCase.viewport)
      ? { width: captureCase.viewport.width, height: captureCase.viewport.height }
      : undefined;
  }
  return isObject(captureCase?.captureRegion?.logicalDimensions)
    ? captureCase.captureRegion.logicalDimensions
    : undefined;
}

function roundedPixelDimension(value, policy) {
  if (!Number.isFinite(value)) return undefined;
  if (policy === 'floor') return Math.floor(value);
  if (policy === 'ceil') return Math.ceil(value);
  if (policy === 'round') return Math.round(value);
  return undefined;
}

function absoluteUrlMatchesRoute(value, origin, route) {
  if (
    typeof value !== 'string' ||
    typeof origin !== 'string' ||
    typeof route !== 'string'
  ) {
    return false;
  }
  try {
    const expected = new URL(route, `${origin}/`).href;
    return value === expected && new URL(value).origin === origin;
  } catch {
    return false;
  }
}

function normalizeNodeId(value) {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d+)(?::|-)(\d+)$/u.exec(value);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

function checksum(buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
}

function implementationArtifactRoot(taskId, implementationHash) {
  if (!checksumPattern.test(implementationHash ?? '')) return undefined;
  return `artifacts/visual/${taskId}/implementations/${implementationHash.slice('sha256:'.length)}`;
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function hasSymlinkComponent(root, candidate) {
  if (!isContained(root, candidate)) return false;
  const relative = path.relative(root, candidate);
  if (relative.length === 0) return false;

  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function containedPath(projectRoot, relativePath, diagnosticPath, diagnostics) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) return undefined;
  if (path.isAbsolute(relativePath)) {
    addDiagnostic(
      diagnostics,
      'path.absolute',
      diagnosticPath,
      'Artifact path must be project-relative.',
    );
    return undefined;
  }

  const resolved = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    addDiagnostic(
      diagnostics,
      'path.escape',
      diagnosticPath,
      'Artifact path must remain inside projectRoot.',
    );
    return undefined;
  }
  return resolved;
}

async function rejectSymlink(projectRoot, filePath, diagnosticPath, diagnostics) {
  if (!filePath) return;
  if (await hasSymlinkComponent(projectRoot, filePath)) {
    addDiagnostic(
      diagnostics,
      'path.symlink',
      diagnosticPath,
      'Artifact paths must not contain symbolic links.',
    );
    return true;
  }
  return false;
}

async function readArtifact(projectRoot, relativePath, diagnosticPath, diagnostics) {
  const candidate = containedPath(projectRoot, relativePath, diagnosticPath, diagnostics);
  if (!candidate) return undefined;
  if (await rejectSymlink(projectRoot, candidate, diagnosticPath, diagnostics)) return undefined;
  try {
    const stats = await lstat(candidate);
    if (!stats.isFile()) {
      addDiagnostic(
        diagnostics,
        'artifact.not-regular',
        diagnosticPath,
        'Artifact must be a regular file.',
      );
      return undefined;
    }
    if (stats.size > maximumArtifactBytes) {
      addDiagnostic(
        diagnostics,
        'artifact.too-large',
        diagnosticPath,
        'Artifact exceeds the 64 MiB safety limit.',
      );
      return undefined;
    }
    const canonical = await realpath(candidate);
    if (!isContained(projectRoot, canonical)) {
      addDiagnostic(
        diagnostics,
        'path.escape',
        diagnosticPath,
        'Artifact path resolves outside projectRoot.',
      );
      return undefined;
    }
    return await readFile(candidate);
  } catch {
    addDiagnostic(
      diagnostics,
      'artifact.missing',
      diagnosticPath,
      'Required artifact is missing or unreadable.',
    );
    return undefined;
  }
}

async function readArtifactDirectory(projectRoot, relativePath, diagnosticPath, diagnostics) {
  const candidate = containedPath(projectRoot, relativePath, diagnosticPath, diagnostics);
  if (!candidate) return undefined;
  if (await rejectSymlink(projectRoot, candidate, diagnosticPath, diagnostics)) return undefined;
  try {
    const stats = await lstat(candidate);
    if (!stats.isDirectory()) {
      addDiagnostic(
        diagnostics,
        'artifact.not-directory',
        diagnosticPath,
        'Artifact directory must be a real directory.',
      );
      return undefined;
    }
    const canonical = await realpath(candidate);
    if (!isContained(projectRoot, canonical)) {
      addDiagnostic(
        diagnostics,
        'path.escape',
        diagnosticPath,
        'Artifact directory resolves outside projectRoot.',
      );
      return undefined;
    }
    return await readdir(candidate, { withFileTypes: true });
  } catch {
    return undefined;
  }
}

function pngDimensions(buffer) {
  if (!Buffer.isBuffer(buffer)) return undefined;
  try {
    const { width, height } = decodeRgbaPng(buffer);
    return { width, height };
  } catch {
    return undefined;
  }
}

function isSafeSvg(buffer) {
  if (!Buffer.isBuffer(buffer)) return false;
  try {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    if (
      !/^(?:\uFEFF)?\s*(?:<\?xml\b[^>]*>\s*)?(?:<!--[^]*?-->\s*)*<svg(?:\s|>)/u.test(
        source,
      ) ||
      !/<\/svg\s*>\s*$/iu.test(source) ||
      /<!DOCTYPE\b|<!ENTITY\b|<\?xml-stylesheet\b/iu.test(source) ||
      /<\?(?!xml\b)|&#(?:x[0-9a-f]+|[0-9]+);|\\|\/\*|\*\//iu.test(source) ||
      /&(?!(?:amp|lt|gt|quot|apos);)/iu.test(source) ||
      /<\/?(?:[A-Za-z_][\w.-]*:)?(?:script|foreignObject|iframe|object|embed|image|audio|video|canvas|style|animate|animateMotion|animateTransform|set)(?:\s|\/?>)/iu.test(
        source,
      ) ||
      /\s(?:on[A-Za-z][\w.-]*|style|xml:base)\s*=/iu.test(source) ||
      /@import\b/iu.test(source)
    ) {
      return false;
    }
    const hrefPattern = /\b(?:href|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu;
    for (const match of source.matchAll(hrefPattern)) {
      const value = match[1] ?? match[2] ?? match[3] ?? '';
      if (!/^#[A-Za-z_][A-Za-z0-9_.:-]*$/u.test(value)) return false;
    }
    for (const match of source.matchAll(/url\(\s*([^)]*?)\s*\)/giu)) {
      const value = match[1].replace(/^(['"])(.*)\1$/u, '$2');
      if (!/^#[A-Za-z_][A-Za-z0-9_.:-]*$/u.test(value)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function isSafeAssetReceipt(receipt, requestId) {
  if (
    !isObject(receipt) ||
    receipt.schemaVersion !== 1 ||
    receipt.requestId !== requestId ||
    !Array.isArray(receipt.assets) ||
    receipt.assets.length === 0 ||
    Object.keys(receipt).sort().join('\0') !== ['assets', 'requestId', 'schemaVersion'].join('\0')
  ) {
    return false;
  }
  const expectedKeys = [
    'background',
    'byteLength',
    'checksum',
    'format',
    'nodeId',
    'scale',
  ].join('\0');
  const backgroundPattern = /^(?:transparent|#[a-f0-9]{6}(?:[a-f0-9]{2})?)$/iu;
  const seenAssets = new Set();
  for (const asset of receipt.assets) {
    if (
      !isObject(asset) ||
      Object.keys(asset).sort().join('\0') !== expectedKeys ||
      normalizeNodeId(asset.nodeId) === undefined ||
      !['png', 'svg'].includes(asset.format) ||
      !(asset.scale === null || (Number.isFinite(asset.scale) && asset.scale > 0)) ||
      !(asset.background === null ||
        (typeof asset.background === 'string' &&
          backgroundPattern.test(asset.background))) ||
      !Number.isSafeInteger(asset.byteLength) ||
      asset.byteLength < 1 ||
      !checksumPattern.test(asset.checksum)
    ) {
      return false;
    }
    const identity = JSON.stringify([
      normalizeNodeId(asset.nodeId),
      asset.format,
      asset.scale,
      asset.background,
    ]);
    if (seenAssets.has(identity)) return false;
    seenAssets.add(identity);
  }
  return true;
}

function canonicalAssetReceiptBuffer(receipt) {
  const canonical = {
    schemaVersion: receipt.schemaVersion,
    requestId: receipt.requestId,
    assets: receipt.assets.map((asset) => ({
      nodeId: asset.nodeId,
      format: asset.format,
      scale: asset.scale,
      background: asset.background,
      byteLength: asset.byteLength,
      checksum: asset.checksum,
    })),
  };
  return Buffer.from(`${JSON.stringify(canonical)}\n`, 'utf8');
}

function receiptAssetMatchesSource(asset, source, sourceBuffer) {
  return (
    normalizeNodeId(asset.nodeId) === normalizeNodeId(source.nodeId) &&
    asset.format === source.mediaKind &&
    asset.scale === source.origin.exportSettings.scale &&
    asset.background === source.origin.exportSettings.background &&
    asset.checksum === source.checksum &&
    asset.byteLength === sourceBuffer?.length
  );
}

function assetReceiptMatches(receipt, source, requestId, sourceBuffer) {
  if (!isSafeAssetReceipt(receipt, requestId)) return false;
  const matches = receipt.assets.filter((asset) =>
    receiptAssetMatchesSource(asset, source, sourceBuffer));
  return matches.length === 1;
}

function sameDimensions(left, right) {
  return left?.width === right?.width && left?.height === right?.height;
}

function sameMetrics(left, right) {
  return (
    isObject(left) &&
    isObject(right) &&
    left.differentPixels === right.differentPixels &&
    left.totalPixels === right.totalPixels &&
    left.differenceRatio === right.differenceRatio
  );
}

async function pathExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch {
    return false;
  }
}

function parseJsonBuffer(buffer, id, diagnosticPath, diagnostics) {
  if (!buffer) return undefined;
  if (buffer.length > maximumJsonBytes) {
    addDiagnostic(
      diagnostics,
      `${id}.too-large`,
      diagnosticPath,
      'JSON artifact exceeds the 4 MiB safety limit.',
    );
    return undefined;
  }
  try {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return JSON.parse(source);
  } catch {
    addDiagnostic(diagnostics, id, diagnosticPath, 'JSON artifact is malformed or is not valid UTF-8.');
    return undefined;
  }
}

function validateTextArtifact(buffer, format, diagnosticPath, diagnostics) {
  if (!buffer) return;
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    addDiagnostic(
      diagnostics,
      'design-context.encoding',
      diagnosticPath,
      `Stored Figma ${format} responses must contain valid UTF-8.`,
    );
    return;
  }
  if (source.trim().length === 0) {
    addDiagnostic(
      diagnostics,
      'design-context.empty',
      diagnosticPath,
      `Stored Figma ${format} responses must not be empty.`,
    );
  }
}

function addMappedSchemaDiagnostics(document, schema, id, diagnostics, rootPath = '$') {
  const found = validateSchema(document, schema, { path: rootPath });
  for (const diagnostic of found) {
    addDiagnostic(
      diagnostics,
      id,
      diagnostic.path,
      `Schema validation failed (${diagnostic.id}): ${diagnostic.message}`,
    );
  }
  return found.length === 0;
}

async function loadProjectJson(projectRoot, relativePath) {
  const candidate = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new VisualInputError('input.path', 'Input path escapes projectRoot.');
  }
  try {
    if (await hasSymlinkComponent(projectRoot, candidate)) {
      throw new VisualInputError('input.path', 'JSON input path must not contain symbolic links.');
    }
    const stats = await lstat(candidate);
    if (!stats.isFile()) {
      throw new VisualInputError('input.path', 'JSON input must be a regular non-symlink file.');
    }
    if (stats.size > maximumJsonBytes) {
      throw new VisualInputError('input.too-large', 'JSON input exceeds the 4 MiB safety limit.');
    }
    const canonical = await realpath(candidate);
    if (!isContained(projectRoot, canonical)) {
      throw new VisualInputError('input.path', 'JSON input resolves outside projectRoot.');
    }
    return await loadJsonDocument(candidate);
  } catch (error) {
    if (error instanceof VisualInputError) throw error;
    throw new VisualInputError(
      error instanceof SyntaxError ? 'input.json' : 'input.unreadable',
      'Cannot load visual evidence input.',
    );
  }
}

async function validateCanonicalContractRecords(projectRoot, task, capture, diagnostics) {
  const records = [
    {
      id: 'task.canonical',
      path: `artifacts/visual/${task.taskId}/task-contract.json`,
      expected: task,
      label: 'Task',
    },
    {
      id: 'capture.canonical',
      path: `artifacts/visual/${task.taskId}/capture-contract.json`,
      expected: capture,
      label: 'Capture',
    },
  ];

  for (const record of records) {
    let canonical;
    try {
      canonical = await loadProjectJson(projectRoot, record.path);
    } catch {
      addDiagnostic(
        diagnostics,
        record.id,
        record.path,
        `${record.label} contract must exist at its canonical task path.`,
      );
      continue;
    }
    if (!isDeepStrictEqual(canonical, record.expected)) {
      addDiagnostic(
        diagnostics,
        record.id,
        record.path,
        `${record.label} contract must match the validated CLI input.`,
      );
    }
  }
}

async function loadCanonicalRecord(projectRoot, relativePath, schema, id, diagnostics) {
  let document;
  try {
    document = await loadProjectJson(projectRoot, relativePath);
  } catch {
    addDiagnostic(diagnostics, `${id}.missing`, relativePath, 'Required canonical record is missing or unreadable.');
    return undefined;
  }
  const valid = addMappedSchemaDiagnostics(document, schema, `${id}.schema`, diagnostics);
  return valid ? document : undefined;
}

async function validateDesignContextManifest(projectRoot, task, diagnostics) {
  const relativePath = `artifacts/visual/${task.taskId}/design-context-manifest.json`;
  const manifest = await loadCanonicalRecord(
    projectRoot,
    relativePath,
    designContextManifestSchema,
    'design-context',
    diagnostics,
  );
  if (!manifest) return undefined;

  const identityChecks = [
    ['taskId', manifest.taskId, task.taskId],
    ['fileKey', manifest.fileKey, task.source.fileKey],
    ['fileVersion', manifest.fileVersion, task.source.fileVersion],
    ['rootNodeId', normalizeNodeId(manifest.rootNodeId), normalizeNodeId(task.source.nodeId)],
  ];
  for (const [field, actual, expected] of identityChecks) {
    if (actual !== expected) {
      addDiagnostic(
        diagnostics,
        'design-context.identity',
        `$.${field}`,
        `Design context ${field} must match the task contract.`,
      );
    }
  }

  const requestIds = new Set();
  const requestKeys = new Set();
  let hasRootContext = false;
  for (const [index, request] of manifest.requests.entries()) {
    const prefix = `$.requests[${index}]`;
    const normalizedNodeId = normalizeNodeId(request.nodeId);
    const requestKey = `${request.operation}\0${manifest.fileKey}\0${normalizedNodeId}`;
    if (requestIds.has(request.requestId)) {
      addDiagnostic(
        diagnostics,
        'design-context.duplicate',
        `${prefix}.requestId`,
        'Design context request IDs must be unique.',
      );
    }
    requestIds.add(request.requestId);
    if (requestKeys.has(requestKey)) {
      addDiagnostic(
        diagnostics,
        'design-context.duplicate',
        prefix,
        'The same Figma operation, fileKey, and nodeId may be recorded only once.',
      );
    }
    requestKeys.add(requestKey);
    if (
      request.operation === 'get_design_context' &&
      normalizedNodeId === normalizeNodeId(task.source.nodeId)
    ) {
      hasRootContext = true;
    }
    const response = designContextResponseFormats.get(request.operation);
    if (response && request.responseFormat !== response.format) {
      addDiagnostic(
        diagnostics,
        'design-context.format',
        `${prefix}.responseFormat`,
        `${request.operation} responses must use responseFormat ${response.format}.`,
      );
    }
    const extension = response?.extension ?? request.responseFormat;
    const expectedPath =
      `artifacts/visual/${task.taskId}/design-context/${request.requestId}.${extension}`;
    if (request.path !== expectedPath) {
      addDiagnostic(
        diagnostics,
        'design-context.path',
        `${prefix}.path`,
        `Design context path must be ${expectedPath}.`,
      );
    }
    const artifact = await readArtifact(projectRoot, request.path, `${prefix}.path`, diagnostics);
    if (artifact && checksum(artifact) !== request.checksum) {
      addDiagnostic(
        diagnostics,
        'design-context.hash',
        `${prefix}.checksum`,
        'Design context checksum must match the stored response.',
      );
    }
    if (artifact && request.responseFormat === 'png') {
      try {
        inspectPng(artifact);
      } catch {
        addDiagnostic(
          diagnostics,
          'design-context.image',
          `${prefix}.path`,
          'Stored Figma screenshots must be valid non-interlaced PNG files.',
        );
      }
    } else if (artifact && request.responseFormat === 'json') {
      const jsonResponse = parseJsonBuffer(
        artifact,
        'design-context.json',
        `${prefix}.path`,
        diagnostics,
      );
      if (
        request.operation === 'download_assets' &&
        (!isSafeAssetReceipt(jsonResponse, request.requestId) ||
          !artifact.equals(canonicalAssetReceiptBuffer(jsonResponse)))
      ) {
        addDiagnostic(
          diagnostics,
          'design-context.asset-receipt',
          `${prefix}.path`,
          'download_assets evidence must be one canonical URL-free JSON line with valid local asset metadata.',
        );
      }
    } else if (artifact && ['text', 'xml'].includes(request.responseFormat)) {
      validateTextArtifact(artifact, request.responseFormat, `${prefix}.path`, diagnostics);
    }
  }
  if (!hasRootContext) {
    addDiagnostic(
      diagnostics,
      'design-context.root',
      '$.requests',
      'The manifest must preserve the first get_design_context response for the exact root node.',
    );
  }
  return manifest;
}

function implementationRootHash(files, taskContractHash) {
  const source = [`task\0${taskContractHash}\n`, ...[...files]
    .sort((left, right) => compareUtf8Text(left.path, right.path))
    .map(
      ({ path: filePath, kind, mode, hash }) =>
        `${filePath}\0${kind}\0${mode ?? 'null'}\0${hash ?? 'null'}\n`,
    )]
    .join('');
  return checksum(Buffer.from(source, 'utf8'));
}

function isSamePathOrDescendant(candidate, root) {
  return candidate === root || candidate.startsWith(`${root}/`);
}

function validateImplementationManifestSemantics(
  manifest,
  task,
  diagnostics,
  { idPrefix = 'implementation', diagnosticRoot = '$', expectedTaskContractHash } = {},
) {
  const diagnosticId = (suffix) =>
    idPrefix === 'implementation' ? `implementation.${suffix}` : idPrefix;
  const diagnosticPath = (suffix) =>
    diagnosticRoot === '$' ? `$${suffix}` : `${diagnosticRoot}${suffix}`;

  if (manifest.taskId !== task.taskId) {
    addDiagnostic(
      diagnostics,
      diagnosticId('task'),
      diagnosticPath('.taskId'),
      'Implementation manifest taskId must match the task contract.',
    );
  }
  if (
    typeof expectedTaskContractHash === 'string' &&
    manifest.taskContractHash !== expectedTaskContractHash
  ) {
    addDiagnostic(
      diagnostics,
      diagnosticId('task-hash'),
      diagnosticPath('.taskContractHash'),
      'Implementation manifest must hash the exact canonical task contract.',
    );
  }

  const sortedPaths = manifest.files
    .map(({ path: filePath }) => filePath)
    .sort(compareUtf8Text);
  const seenPaths = new Set();
  const allowedRoots = Array.isArray(task.target.allowedImplementationRoots)
    ? task.target.allowedImplementationRoots
    : [];
  const approvedDependencyPaths = new Set(
    (task.provisioning?.dependencies ?? [])
      .filter(({ status }) => status === 'approved-to-install')
      .flatMap(({ packageJsonPath, lockfilePath }) => [packageJsonPath, lockfilePath]),
  );
  let includesFeatureModule = false;
  let includesFixture = false;
  for (const [index, file] of manifest.files.entries()) {
    const filePath = diagnosticPath(`.files[${index}]`);
    if (seenPaths.has(file.path)) {
      addDiagnostic(
        diagnostics,
        diagnosticId('duplicate'),
        `${filePath}.path`,
        'Implementation manifest paths must be unique.',
      );
    }
    seenPaths.add(file.path);
    if (forbiddenImplementationRoots.some((root) => isSamePathOrDescendant(file.path, root))) {
      addDiagnostic(
        diagnostics,
        diagnosticId('forbidden-path'),
        `${filePath}.path`,
        'Implementation manifests must not include evidence, test mirrors, dependencies, or Git internals.',
      );
    }
    if (
      !allowedRoots.some((root) => isSamePathOrDescendant(file.path, root)) &&
      file.path !== task.data.fixture &&
      !approvedDependencyPaths.has(file.path)
    ) {
      addDiagnostic(
        diagnostics,
        diagnosticId('outside-authority'),
        `${filePath}.path`,
        'Implementation file is outside allowedImplementationRoots, the fixture, and approved dependency files.',
      );
    }
    if (file.kind === 'file' && isSamePathOrDescendant(file.path, task.target.featureModule)) {
      includesFeatureModule = true;
    }
    if (file.kind === 'file' && file.path === task.data.fixture) {
      includesFixture = true;
    }
    const hashValid = typeof file.hash === 'string' && checksumPattern.test(file.hash);
    if (
      (file.kind === 'file' && (!hashValid || !['100644', '100755'].includes(file.mode))) ||
      (file.kind === 'deleted' && (file.hash !== null || file.mode !== null))
    ) {
      addDiagnostic(
        diagnostics,
        diagnosticId('kind'),
        `${filePath}.hash`,
        'File entries require a Git mode and SHA-256 hash; deleted entries require null mode and hash.',
      );
    }
    if (file.path !== sortedPaths[index]) {
      addDiagnostic(
        diagnostics,
        diagnosticId('order'),
        `${filePath}.path`,
        'Implementation manifest files must be sorted by project-relative UTF-8 byte order.',
      );
    }
  }

  if (!includesFeatureModule) {
    addDiagnostic(
      diagnostics,
      diagnosticId('coverage'),
      diagnosticPath('.files'),
      'Implementation manifest must include the target feature module or one of its descendants.',
    );
  }
  if (!includesFixture) {
    addDiagnostic(
      diagnostics,
      diagnosticId('coverage'),
      diagnosticPath('.files'),
      'Implementation manifest must include the deterministic data fixture from the task contract.',
    );
  }

  const calculated = implementationRootHash(manifest.files, manifest.taskContractHash);
  if (manifest.rootHash !== calculated) {
    addDiagnostic(
      diagnostics,
      diagnosticId('root-hash'),
      diagnosticPath('.rootHash'),
      'rootHash must be SHA-256 of the task hash record and sorted file records.',
    );
  }
}

async function validateGitCompleteness(projectRoot, task, manifest, diagnostics) {
  const snapshot = await inspectGitBaseline({
    projectRoot,
    revision: task.baseline.revision,
    excludedRoots: [
      `artifacts/visual/${task.taskId}`,
      `tests/visual/references/figma/${task.taskId}`,
    ],
  });
  for (const issue of snapshot.issues) {
    addDiagnostic(
      diagnostics,
      `implementation.${issue.id}`,
      issue.path,
      issue.message,
    );
  }
  if (!Array.isArray(snapshot.entries)) return;

  const currentEntries = snapshot.entries;
  const currentEntriesByPath = new Map(currentEntries.map((entry) => [entry.path, entry]));
  for (const [index, baselineEntry] of task.baseline.preExistingChanges.entries()) {
    const diagnosticPath = `$.baseline.preExistingChanges[${index}]`;
    const current = currentEntriesByPath.get(baselineEntry.path);
    if (!isDeepStrictEqual(current, baselineEntry)) {
      addDiagnostic(
        diagnostics,
        'implementation.pre-existing-change',
        diagnosticPath,
        'A change that existed at G1 must still be present with the same kind and bytes.',
      );
    }
    currentEntriesByPath.delete(baselineEntry.path);
  }

  const expectedEntries = currentEntries.filter((entry) => currentEntriesByPath.has(entry.path));
  if (!isDeepStrictEqual(manifest.files, expectedEntries)) {
    addDiagnostic(
      diagnostics,
      'implementation.git-completeness',
      '$.files',
      'Implementation manifest must exactly match all Git changes since the baseline, excluding unchanged pre-existing changes and task evidence.',
    );
  }
}

async function validateImplementationManifest(projectRoot, task, diagnostics) {
  const relativePath = `artifacts/visual/${task.taskId}/implementation-manifest.json`;
  const manifest = await loadCanonicalRecord(
    projectRoot,
    relativePath,
    implementationManifestSchema,
    'implementation',
    diagnostics,
  );
  if (!manifest) return undefined;

  const taskContractBuffer = await readArtifact(
    projectRoot,
    `artifacts/visual/${task.taskId}/task-contract.json`,
    '$.taskContractHash',
    diagnostics,
  );
  const taskContractHash = taskContractBuffer ? checksum(taskContractBuffer) : undefined;
  validateImplementationManifestSemantics(manifest, task, diagnostics, {
    expectedTaskContractHash: taskContractHash,
  });

  const implementationBuffers = new Map();
  for (const [index, file] of manifest.files.entries()) {
    if (file.kind === 'deleted') {
      if (await pathExists(path.resolve(projectRoot, file.path))) {
        addDiagnostic(
          diagnostics,
          'implementation.deleted-file',
          `$.files[${index}].path`,
          'A deleted manifest entry must be absent from the current project.',
        );
      }
      continue;
    }
    const contents = await readArtifact(
      projectRoot,
      file.path,
      `$.files[${index}].path`,
      diagnostics,
    );
    if (contents) implementationBuffers.set(file.path, contents);
    if (contents && checksum(contents) !== file.hash) {
      addDiagnostic(
        diagnostics,
        'implementation.file-hash',
        `$.files[${index}].hash`,
        'Implementation file hash must match the current project file.',
      );
    }
  }
  validateImplementationPayloadSafety(implementationBuffers, diagnostics);

  await validateGitCompleteness(projectRoot, task, manifest, diagnostics);

  const manifestFilesByPath = new Map(manifest.files.map((file) => [file.path, file]));
  for (const [index, dependency] of (task.provisioning?.dependencies ?? []).entries()) {
    const prefix = `$.provisioning.dependencies[${index}]`;
    const packageBuffer = implementationBuffers.get(dependency.packageJsonPath) ??
      await readArtifact(
        projectRoot,
        dependency.packageJsonPath,
        `${prefix}.packageJsonPath`,
        diagnostics,
      );
    const lockBuffer = implementationBuffers.get(dependency.lockfilePath) ??
      await readArtifact(
        projectRoot,
        dependency.lockfilePath,
        `${prefix}.lockfilePath`,
        diagnostics,
      );
    let declarations = [];
    try {
      const packageDocument = JSON.parse(packageBuffer.toString('utf8'));
      for (const group of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ]) {
        if (
          isObject(packageDocument[group]) &&
          hasOwn(packageDocument[group], dependency.packageName)
        ) {
          declarations.push(packageDocument[group][dependency.packageName]);
        }
      }
    } catch {
      declarations = [];
    }
    if (declarations.length !== 1 || declarations[0] !== dependency.specifier) {
      addDiagnostic(
        diagnostics,
        'implementation.dependency',
        `${prefix}.specifier`,
        `Dependency ${dependency.packageName} must occur exactly once in ${dependency.packageJsonPath} with specifier ${dependency.specifier}.`,
      );
    }
    if (!lockBuffer || lockBuffer.length === 0) {
      addDiagnostic(
        diagnostics,
        'implementation.dependency',
        `${prefix}.lockfilePath`,
        `Dependency ${dependency.packageName} requires the readable lock file ${dependency.lockfilePath}.`,
      );
    }
    if (dependency.status === 'approved-to-install') {
      for (const [field, requiredPath] of [
        ['packageJsonPath', dependency.packageJsonPath],
        ['lockfilePath', dependency.lockfilePath],
      ]) {
        if (manifestFilesByPath.get(requiredPath)?.kind !== 'file') {
          addDiagnostic(
            diagnostics,
            'implementation.dependency-change',
            `${prefix}.${field}`,
            `An approved installation must include changed file ${requiredPath} in the implementation manifest.`,
          );
        }
      }
    }
  }

  const snapshotRoot = implementationArtifactRoot(task.taskId, manifest.rootHash);
  if (snapshotRoot) {
    const snapshotPath = `${snapshotRoot}/implementation-manifest.json`;
    const snapshot = await loadCanonicalRecord(
      projectRoot,
      snapshotPath,
      implementationManifestSchema,
      'implementation-snapshot',
      diagnostics,
    );
    if (snapshot) {
      validateImplementationManifestSemantics(snapshot, task, diagnostics, {
        idPrefix: 'implementation-snapshot',
        diagnosticRoot: snapshotPath,
        expectedTaskContractHash: taskContractHash,
      });
      const [currentBytes, snapshotBytes] = await Promise.all([
        readArtifact(projectRoot, relativePath, relativePath, diagnostics),
        readArtifact(projectRoot, snapshotPath, snapshotPath, diagnostics),
      ]);
      if (currentBytes && snapshotBytes && !currentBytes.equals(snapshotBytes)) {
        addDiagnostic(
          diagnostics,
          'implementation.snapshot',
          snapshotPath,
          'Current implementation manifest must be byte-identical to its immutable versioned copy.',
        );
      }
    }
  }
  return { rootHash: manifest.rootHash, manifest };
}

async function validateHashedOutput(projectRoot, record, prefix, diagnostics) {
  const outputPath = record.evidencePath ?? record.outputPath;
  const outputHash = record.evidenceHash ?? record.outputHash;
  const contents = await readArtifact(projectRoot, outputPath, `${prefix}.path`, diagnostics);
  if (contents && checksum(contents) !== outputHash) {
    addDiagnostic(
      diagnostics,
      'verification.hash',
      `${prefix}.hash`,
      'Verification output hash must match the stored file.',
    );
  }
  if (contents) {
    let source;
    try {
      source = new TextDecoder('utf-8', { fatal: true }).decode(contents);
    } catch {
      addDiagnostic(
        diagnostics,
        'verification.encoding',
        `${prefix}.path`,
        'Verification output must contain valid UTF-8 text.',
      );
      return;
    }
    if (typeof record.command === 'string') {
      const headerEnd = contents.indexOf(0x0a);
      let header;
      try {
        header =
          headerEnd > 0
            ? JSON.parse(contents.subarray(0, headerEnd).toString('utf8'))
            : undefined;
      } catch {
        header = undefined;
      }
      const headerKeys = isObject(header) ? Object.keys(header).sort() : [];
      const expectedKeys = [
        'command',
        'exitCode',
        'schemaVersion',
        'stderrBytes',
        'stdoutBytes',
      ];
      const bodyBytes = headerEnd >= 0 ? contents.length - headerEnd - 1 : -1;
      if (
        !isObject(header) ||
        !isDeepStrictEqual(headerKeys, expectedKeys) ||
        header.schemaVersion !== 1 ||
        header.command !== record.command ||
        header.exitCode !== record.exitCode ||
        !Number.isInteger(header.stdoutBytes) ||
        header.stdoutBytes < 0 ||
        !Number.isInteger(header.stderrBytes) ||
        header.stderrBytes < 0 ||
        header.stdoutBytes + header.stderrBytes !== bodyBytes
      ) {
        addDiagnostic(
          diagnostics,
          'verification.transcript',
          `${prefix}.path`,
          'Command output must start with the canonical JSON transcript header and contain the declared stdout and stderr byte counts.',
        );
      }
    } else if (source.trim().length === 0) {
      addDiagnostic(
        diagnostics,
        'verification.empty',
        `${prefix}.path`,
        'Verification output must contain a non-empty result.',
      );
    }
  }
}

async function validateVerificationRecord(projectRoot, task, implementationHash, diagnostics) {
  const relativePath = `artifacts/visual/${task.taskId}/verification-record.json`;
  const record = await loadCanonicalRecord(
    projectRoot,
    relativePath,
    verificationRecordSchema,
    'verification',
    diagnostics,
  );
  if (!record) return undefined;
  if (record.taskId !== task.taskId || record.implementationHash !== implementationHash) {
    addDiagnostic(
      diagnostics,
      'verification.identity',
      '$',
      'Verification record must match the task and current implementation hash.',
    );
  }
  const expectedQuality = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
  if (record.qualityChecks.some((item, index) => item.id !== expectedQuality[index])) {
    addDiagnostic(
      diagnostics,
      'verification.quality-order',
      '$.qualityChecks',
      'Quality checks must contain Q1 through Q6 in order.',
    );
  }
  const versionRoot = implementationArtifactRoot(task.taskId, implementationHash);
  for (const [index, item] of record.qualityChecks.entries()) {
    const expectedPath = versionRoot
      ? `${versionRoot}/checks/${item.id.toLowerCase()}.md`
      : undefined;
    if (expectedPath && item.evidencePath !== expectedPath) {
      addDiagnostic(
        diagnostics,
        'verification.path',
        `$.qualityChecks[${index}].evidencePath`,
        `Quality evidence path must be ${expectedPath}.`,
      );
    }
    await validateHashedOutput(projectRoot, item, `$.qualityChecks[${index}]`, diagnostics);
  }
  for (const group of ['projectChecks', 'browserChecks']) {
    const expected = task.acceptance[group];
    const actual = record[group];
    if (
      actual.length !== expected.length ||
      actual.some((item, index) => item.id !== expected[index].id || item.command !== expected[index].command)
    ) {
      addDiagnostic(
        diagnostics,
        'verification.checks',
        `$.${group}`,
        `Verification ${group} must match the task contract in order.`,
      );
    }
    for (const [index, item] of actual.entries()) {
      const expectedPath = versionRoot
        ? `${versionRoot}/checks/${item.id}.txt`
        : undefined;
      if (expectedPath && item.outputPath !== expectedPath) {
        addDiagnostic(
          diagnostics,
          'verification.path',
          `$.${group}[${index}].outputPath`,
          `Executed check output path must be ${expectedPath}.`,
        );
      }
      await validateHashedOutput(projectRoot, item, `$.${group}[${index}]`, diagnostics);
    }
  }
  return record;
}

function addCaptureSchemaDiagnostics(capture, diagnostics) {
  const found = validateSchema(capture, captureContractSchema);
  for (const diagnostic of found) {
    addDiagnostic(
      diagnostics,
      'capture.schema',
      diagnostic.path,
      `Schema validation failed (${diagnostic.id}): ${diagnostic.message}`,
    );
  }
  return found.length === 0;
}

function validateCaptureIdentity(task, capture, diagnostics) {
  if (!Array.isArray(capture?.cases)) return;
  let expectedEnvironment;
  const caseIds = new Set();
  const reservedCaseIds = new Set([
    'design-context',
    'failures',
    'implementations',
    'origins',
    'sources',
  ]);
  const taskViewports = new Set(
    (task.viewports ?? []).map(({ width, height, dpr }) => JSON.stringify([width, height, dpr])),
  );
  const taskStates = new Map(
    (task.states ?? []).map(({ id, applicability }) => [id, applicability]),
  );
  const capturedMatrix = new Set();
  capture.cases.forEach((captureCase, index) => {
    if (!isObject(captureCase)) return;
    const prefix = `$.cases[${index}]`;
    const checks = [
      ['taskId', captureCase.taskId, task.taskId],
      ['fileKey', captureCase.fileKey, task.source?.fileKey],
      ['nodeId', normalizeNodeId(captureCase.nodeId), normalizeNodeId(task.source?.nodeId)],
      ['fileVersion', captureCase.fileVersion, task.source?.fileVersion],
      ['route', captureCase.route, task.target?.route],
      ['fixture', captureCase.fixture, task.data?.fixture],
    ];
    for (const [field, actual, expected] of checks) {
      if (actual !== undefined && expected !== undefined && actual !== expected) {
        addDiagnostic(
          diagnostics,
          'capture.task-mismatch',
          `${prefix}.${field}`,
          `Capture ${field} must match the task contract.`,
        );
      }
    }

    if (caseIds.has(captureCase.caseId)) {
      addDiagnostic(
        diagnostics,
        'capture.case-duplicate',
        `${prefix}.caseId`,
        'Capture case IDs must be unique within a task.',
      );
    } else {
      caseIds.add(captureCase.caseId);
    }
    if (reservedCaseIds.has(captureCase.caseId)) {
      addDiagnostic(
        diagnostics,
        'capture.case-reserved',
        `${prefix}.caseId`,
        'Capture case ID collides with a reserved task-evidence directory.',
      );
    }
    const viewportKey = isObject(captureCase.viewport)
      ? JSON.stringify([
          captureCase.viewport.width,
          captureCase.viewport.height,
          captureCase.viewport.dpr,
        ])
      : undefined;
    if (viewportKey !== undefined && !taskViewports.has(viewportKey)) {
      addDiagnostic(
        diagnostics,
        'capture.viewport',
        `${prefix}.viewport`,
        'Capture viewport must be declared by the final task contract.',
      );
    }
    if (typeof captureCase.state === 'string' && !taskStates.has(captureCase.state)) {
      addDiagnostic(
        diagnostics,
        'capture.state',
        `${prefix}.state`,
        'Capture state must be declared by the final task contract.',
      );
    } else if (
      typeof captureCase.state === 'string' &&
      taskStates.get(captureCase.state) !== 'required'
    ) {
      addDiagnostic(
        diagnostics,
        'capture.state',
        `${prefix}.state`,
        'Capture cases may reference only required task states.',
      );
    }
    if (viewportKey !== undefined && typeof captureCase.state === 'string') {
      capturedMatrix.add(`${viewportKey}\0${captureCase.state}`);
    }

    const captureRegion = captureCase.captureRegion;
    if (
      isObject(captureRegion) &&
      ((captureRegion.kind === 'selector' &&
        (typeof captureRegion.selector !== 'string' || captureRegion.selector.trim().length === 0)) ||
        (captureRegion.kind !== 'selector' && captureRegion.selector !== null))
    ) {
      addDiagnostic(
        diagnostics,
        'capture.region',
        `${prefix}.captureRegion.selector`,
        'Selector regions require a non-empty selector; other regions require selector: null.',
      );
    }

    const environment = environmentFingerprint(captureCase.environment);
    if (index === 0) {
      expectedEnvironment = environment;
    } else if (environment !== undefined && environment !== expectedEnvironment) {
      addDiagnostic(
        diagnostics,
        'capture.environment-mismatch',
        `${prefix}.environment`,
        'Capture cases must share one deterministic environment fingerprint.',
      );
    }

    const readinessEntries = Array.isArray(captureCase.readiness) ? captureCase.readiness : [];
    for (const [readinessIndex, readiness] of readinessEntries.entries()) {
      if (!isObject(readiness)) continue;
      const readinessPath = `${prefix}.readiness[${readinessIndex}]`;
      const selectorKind = new Set(['selector-visible', 'selector-hidden', 'text-present']).has(
        readiness.kind,
      );
      const expectedKind = readiness.kind === 'url-equals' || readiness.kind === 'text-present';
      if ((selectorKind && typeof readiness.selector !== 'string') || (!selectorKind && readiness.selector !== null)) {
        addDiagnostic(
          diagnostics,
          'capture.readiness',
          `${readinessPath}.selector`,
          'Readiness selector must be present only for selector and text checks.',
        );
      }
      if ((expectedKind && typeof readiness.expected !== 'string') || (!expectedKind && readiness.expected !== null)) {
        addDiagnostic(
          diagnostics,
          'capture.readiness',
          `${readinessPath}.expected`,
          'Readiness expected value must be present only for URL and text checks.',
        );
      }
    }

    for (const requiredKind of ['url-equals', 'fonts-ready', 'images-ready']) {
      const matches = readinessEntries.filter(({ kind }) => kind === requiredKind);
      if (matches.length !== 1) {
        addDiagnostic(
          diagnostics,
          'capture.readiness',
          `${prefix}.readiness`,
          `Capture readiness must contain exactly one ${requiredKind} check.`,
        );
      }
    }
    const urlCheck = readinessEntries.find(({ kind }) => kind === 'url-equals');
    if (
      urlCheck &&
      !absoluteUrlMatchesRoute(
        urlCheck.expected,
        task.target?.origin,
        captureCase.route,
      )
    ) {
      addDiagnostic(
        diagnostics,
        'capture.readiness',
        `${prefix}.readiness`,
        'url-equals must equal the canonical absolute URL formed from target.origin and the capture route.',
      );
    }

    const declaredSelectors = new Set([
      ...(captureCase.selectors?.primaryLayout ?? []),
      ...(captureCase.selectors?.dynamicText ?? []),
      ...(captureCase.selectors?.visibility ?? []),
    ]);
    for (const [readinessIndex, readiness] of readinessEntries.entries()) {
      if (
        ['selector-visible', 'selector-hidden', 'text-present'].includes(readiness.kind) &&
        !declaredSelectors.has(readiness.selector)
      ) {
        addDiagnostic(
          diagnostics,
          'capture.readiness',
          `${prefix}.readiness[${readinessIndex}].selector`,
          'Selector readiness checks must use a selector declared by the capture case.',
        );
      }
      if (
        readiness.kind === 'text-present' &&
        !(captureCase.selectors?.dynamicText ?? []).includes(readiness.selector)
      ) {
        addDiagnostic(
          diagnostics,
          'capture.readiness',
          `${prefix}.readiness[${readinessIndex}].selector`,
          'text-present must use a selector declared in selectors.dynamicText.',
        );
      }
    }
    if (captureCase.captureRegion?.kind === 'selector') {
      const regionReady = readinessEntries.some(
        ({ kind, selector }) =>
          kind === 'selector-visible' && selector === captureCase.captureRegion.selector,
      );
      if (!regionReady) {
        addDiagnostic(
          diagnostics,
          'capture.readiness',
          `${prefix}.readiness`,
          'Selector captures require selector-visible readiness for the exact capture-region selector.',
        );
      }
    } else if (
      !readinessEntries.some(
        ({ kind, selector }) =>
          kind === 'selector-visible' && declaredSelectors.has(selector),
      )
    ) {
      addDiagnostic(
        diagnostics,
        'capture.readiness',
        `${prefix}.readiness`,
        'Viewport and full-page captures require selector-visible readiness for a declared selector.',
      );
    }
  });

  if (!capture.cases.some((captureCase) => captureCase?.evidenceMode === 'visual-reference')) {
    addDiagnostic(
      diagnostics,
      'capture.mode-missing',
      '$.cases',
      'Strict capture requires at least one visual-reference case.',
    );
  }
  for (const [requirementKey, mode] of [
    ['behaviorOnly', 'behavior-only'],
    ['responsiveOnly', 'responsive-only'],
  ]) {
    const applicability = task.evidenceModes?.[requirementKey]?.applicability;
    const modeCount = capture.cases.filter(
      (captureCase) => captureCase?.evidenceMode === mode,
    ).length;
    if (applicability === 'required' && modeCount === 0) {
      addDiagnostic(
        diagnostics,
        'capture.mode-missing',
        '$.cases',
        `Task contract requires at least one ${mode} case.`,
      );
    }
    if (applicability === 'not-applicable' && modeCount > 0) {
      addDiagnostic(
        diagnostics,
        'capture.mode-unexpected',
        '$.cases',
        `Task contract marks ${mode} as not-applicable, so such cases are forbidden.`,
      );
    }
  }

  for (const [viewportIndex, { width, height, dpr }] of (task.viewports ?? []).entries()) {
    const viewportKey = JSON.stringify([width, height, dpr]);
    for (const [stateIndex, state] of (task.states ?? []).entries()) {
      if (state.applicability !== 'required') continue;
      if (!capturedMatrix.has(`${viewportKey}\0${state.id}`)) {
        addDiagnostic(
          diagnostics,
          'capture.matrix-missing',
          `$.viewports[${viewportIndex}]/$.states[${stateIndex}]`,
          'Every required viewport and state combination requires one capture case.',
        );
      }
    }
  }
}

function validateCaptureModesAndPaths(task, capture, projectRoot, diagnostics) {
  if (Array.isArray(capture?.cases)) {
    for (const [index, captureCase] of capture.cases.entries()) {
      if (!isObject(captureCase)) continue;
      const prefix = `$.cases[${index}]`;
      const visualMode = captureCase.evidenceMode === 'visual-reference';
      const viewportRegion = captureCase.captureRegion?.kind === 'viewport';
      const declaredLogicalDimensions = captureCase.captureRegion?.logicalDimensions;
      const pixelRounding = captureCase.captureRegion?.pixelRounding;
      if (visualMode && !isObject(captureCase.reference)) {
        addDiagnostic(
          diagnostics,
          'capture.reference-mode',
          `${prefix}.reference`,
          'Visual-reference cases require a reference object.',
        );
      }
      if (!visualMode && captureCase.reference !== null) {
        addDiagnostic(
          diagnostics,
          'capture.reference-mode',
          `${prefix}.reference`,
          'No-reference cases require reference: null.',
        );
      }
      if (!visualMode && (typeof captureCase.evidencePath !== 'string' || captureCase.evidencePath.length === 0)) {
        addDiagnostic(
          diagnostics,
          'capture.reference-mode',
          `${prefix}.evidencePath`,
          'No-reference cases require a local evidencePath.',
        );
      }
      if (visualMode && captureCase.evidencePath !== null) {
        addDiagnostic(
          diagnostics,
          'capture.reference-mode',
          `${prefix}.evidencePath`,
          'Visual-reference cases require evidencePath: null.',
        );
      }
      if (visualMode && viewportRegion && declaredLogicalDimensions !== null) {
        addDiagnostic(
          diagnostics,
          'capture.dimensions',
          `${prefix}.captureRegion.logicalDimensions`,
          'Viewport captures derive logical dimensions from viewport and require logicalDimensions: null.',
        );
      }
      if (visualMode && !viewportRegion && !isObject(declaredLogicalDimensions)) {
        addDiagnostic(
          diagnostics,
          'capture.dimensions',
          `${prefix}.captureRegion.logicalDimensions`,
          'Visual selector and full-page captures require explicit logicalDimensions.',
        );
      }
      if (!visualMode && declaredLogicalDimensions !== null) {
        addDiagnostic(
          diagnostics,
          'capture.dimensions',
          `${prefix}.captureRegion.logicalDimensions`,
          'Cases without a visual reference require logicalDimensions: null.',
        );
      }
      if (visualMode && !['floor', 'ceil', 'round'].includes(pixelRounding)) {
        addDiagnostic(
          diagnostics,
          'capture.dimensions',
          `${prefix}.captureRegion.pixelRounding`,
          'Visual-reference cases require an explicit pixel rounding rule.',
        );
      }
      if (!visualMode && pixelRounding !== null) {
        addDiagnostic(
          diagnostics,
          'capture.dimensions',
          `${prefix}.captureRegion.pixelRounding`,
          'Cases without a visual reference require pixelRounding: null.',
        );
      }
      if (visualMode && isObject(captureCase.reference)) {
        const logicalDimensions = captureLogicalDimensions(captureCase);
        const dpr = captureCase.viewport?.dpr;
        const expectedWidth = roundedPixelDimension(
          logicalDimensions?.width * dpr,
          pixelRounding,
        );
        const expectedHeight = roundedPixelDimension(
          logicalDimensions?.height * dpr,
          pixelRounding,
        );
        if (
          !Number.isInteger(expectedWidth) ||
          expectedWidth < 1 ||
          !Number.isInteger(expectedHeight) ||
          expectedHeight < 1 ||
          captureCase.reference.dimensions?.width !== expectedWidth ||
          captureCase.reference.dimensions?.height !== expectedHeight
        ) {
          addDiagnostic(
            diagnostics,
            'capture.dimensions',
            `${prefix}.reference.dimensions`,
            'Reference pixel dimensions must equal logical capture dimensions multiplied by DPR.',
          );
        }
      }

      if (isObject(captureCase.reference)) {
        const safeReferencePath = containedPath(
          projectRoot,
          captureCase.reference.path,
          `${prefix}.reference.path`,
          diagnostics,
        );
        const expectedReference = `artifacts/visual/${task.taskId}/${captureCase.caseId}/reference.png`;
        if (
          safeReferencePath &&
          visualMode &&
          captureCase.reference.path !== expectedReference
        ) {
          addDiagnostic(
            diagnostics,
            'reference.path',
            `${prefix}.reference.path`,
            `Reference path must be ${expectedReference}.`,
          );
        }
      }
      if (typeof captureCase.evidencePath === 'string') {
        const safeEvidencePath = containedPath(
          projectRoot,
          captureCase.evidencePath,
          `${prefix}.evidencePath`,
          diagnostics,
        );
        const expectedEvidence = `artifacts/visual/${task.taskId}/${captureCase.caseId}/evidence.json`;
        if (
          safeEvidencePath &&
          !visualMode &&
          captureCase.evidencePath !== expectedEvidence
        ) {
          addDiagnostic(
            diagnostics,
            'evidence.path',
            `${prefix}.evidencePath`,
            `Evidence path must be ${expectedEvidence}.`,
          );
        }
      }
    }
  }
}

async function loadSourceManifest(projectRoot, task) {
  if (typeof task?.taskId !== 'string') return;
  const manifestPath = `artifacts/visual/${task.taskId}/source-manifest.json`;
  return loadProjectJson(projectRoot, manifestPath);
}

async function validateSourceManifest(
  projectRoot,
  task,
  capture,
  manifest,
  designContextManifest,
  implementationManifest,
  diagnostics,
) {
  const shapeValid = addMappedSchemaDiagnostics(
    manifest,
    sourceManifestSchema,
    'source.schema',
    diagnostics,
  );
  if (!shapeValid) return;

  const identityChecks = [
    ['taskId', manifest.taskId, task.taskId],
    ['fileKey', manifest.fileKey, task.source.fileKey],
    ['fileVersion', manifest.fileVersion, task.source.fileVersion],
    ['rootNodeId', normalizeNodeId(manifest.rootNodeId), normalizeNodeId(task.source.nodeId)],
  ];
  for (const [field, actual, expected] of identityChecks) {
    if (actual !== expected) {
      addDiagnostic(
        diagnostics,
        'source.identity',
        `$.${field}`,
        `Source manifest ${field} must match the task contract.`,
      );
    }
  }

  const captureCases = new Map((capture.cases ?? []).map((item) => [item.caseId, item]));
  const designRequests = new Map(
    (designContextManifest?.requests ?? []).map((request) => [request.requestId, request]),
  );
  const implementationFiles = new Map(
    (implementationManifest?.files ?? []).map((file) => [file.path, file]),
  );
  const sourcesById = new Map();
  const sourceBuffersById = new Map();
  const runtimeSourcesByPath = new Map();
  for (const [index, source] of manifest.sources.entries()) {
    const prefix = `$.sources[${index}]`;
    if (sourcesById.has(source.sourceId)) {
      addDiagnostic(diagnostics, 'source.duplicate', `${prefix}.sourceId`, 'Source IDs must be unique.');
    } else {
      sourcesById.set(source.sourceId, source);
    }
    if (source.fileKey !== task.source.fileKey || source.fileVersion !== task.source.fileVersion) {
      addDiagnostic(
        diagnostics,
        'source.identity',
        `${prefix}.fileKey`,
        'Every source must identify the same Figma file and version as the task.',
      );
    }
    if (
      source.purpose === 'visual-reference' &&
      normalizeNodeId(source.nodeId) !== normalizeNodeId(task.source.nodeId)
    ) {
      addDiagnostic(
        diagnostics,
        'source.identity',
        `${prefix}.nodeId`,
        'Visual references must identify the task root node.',
      );
    }
    const captureCase = typeof source.caseId === 'string' ? captureCases.get(source.caseId) : undefined;
    if (
      (source.purpose === 'visual-reference' && !captureCase) ||
      (source.purpose === 'runtime-asset' && source.caseId !== null)
    ) {
      addDiagnostic(
        diagnostics,
        'source.purpose',
        `${prefix}.caseId`,
        'Visual references require a declared caseId; runtime assets require caseId: null.',
      );
    }

    const expectedSourcePath =
      `artifacts/visual/${task.taskId}/sources/${source.sourceId}.${source.mediaKind}`;
    if (source.path !== expectedSourcePath) {
      addDiagnostic(
        diagnostics,
        'source.path',
        `${prefix}.path`,
        `Source path must be ${expectedSourcePath}.`,
      );
    }
    const sourceBuffer = await readArtifact(projectRoot, source.path, `${prefix}.path`, diagnostics);
    if (sourceBuffer) sourceBuffersById.set(source.sourceId, sourceBuffer);
    if (sourceBuffer && checksum(sourceBuffer) !== source.checksum) {
      addDiagnostic(
        diagnostics,
        'source.checksum',
        `${prefix}.checksum`,
        'Source checksum must match the stored file.',
      );
    }
    if (source.mediaKind === 'png') {
      if (!sameDimensions(pngDimensions(sourceBuffer), source.pixelDimensions)) {
        addDiagnostic(
          diagnostics,
          'source.dimensions',
          `${prefix}.pixelDimensions`,
          'PNG sources must be valid 8-bit RGBA files with matching dimensions.',
        );
      }
    } else {
      if (source.pixelDimensions !== null) {
        addDiagnostic(
          diagnostics,
          'source.dimensions',
          `${prefix}.pixelDimensions`,
          'SVG sources require pixelDimensions: null.',
        );
      }
      if (sourceBuffer && !isSafeSvg(sourceBuffer)) {
        addDiagnostic(
          diagnostics,
          'source.media',
          `${prefix}.path`,
          'Source bytes must contain a safe supported SVG file.',
        );
      }
    }
    if (
      (source.mediaKind === 'png' || source.purpose === 'runtime-asset') &&
      source.derivations.length !== 0
    ) {
      addDiagnostic(
        diagnostics,
        'source.derivation-forbidden',
        `${prefix}.derivations`,
        'Derivations are allowed only when a visual reference is rendered from an SVG source.',
      );
    }

    const originPrefix = `${prefix}.origin`;
    const originBuffer = await readArtifact(
      projectRoot,
      source.origin.evidencePath,
      `${originPrefix}.evidencePath`,
      diagnostics,
    );
    if (originBuffer && checksum(originBuffer) !== source.origin.evidenceChecksum) {
      addDiagnostic(
        diagnostics,
        'source.origin-checksum',
        `${originPrefix}.evidenceChecksum`,
        'Origin evidence checksum must match the stored artifact.',
      );
    }
    if (source.origin.exportSettings.format !== source.mediaKind) {
      addDiagnostic(
        diagnostics,
        'source.origin-format',
        `${originPrefix}.exportSettings.format`,
        'Origin export format must match the source media kind.',
      );
    }

    if (source.origin.kind === 'connector-request') {
      const request = designRequests.get(source.origin.requestId);
      if (
        !request ||
        request.path !== source.origin.evidencePath ||
        request.checksum !== source.origin.evidenceChecksum ||
        normalizeNodeId(request.nodeId) !== normalizeNodeId(source.nodeId)
      ) {
        addDiagnostic(
          diagnostics,
          'source.origin-request',
          `${originPrefix}.requestId`,
          'Connector origin must identify one matching design-context request and its stored response.',
        );
      } else {
        const expectedOperation =
          source.purpose === 'visual-reference' && source.mediaKind === 'png'
            ? 'get_screenshot'
            : 'download_assets';
        if (request.operation !== expectedOperation) {
          addDiagnostic(
            diagnostics,
            'source.origin-operation',
            `${originPrefix}.requestId`,
            `Connector origin for ${source.purpose} must use ${expectedOperation}.`,
          );
        }
        if (request.operation === 'download_assets' && originBuffer) {
          const receipt = parseJsonBuffer(
            originBuffer,
            'download-assets-receipt.json',
            `${originPrefix}.evidencePath`,
            diagnostics,
          );
          if (
            !assetReceiptMatches(
              receipt,
              source,
              source.origin.requestId,
              sourceBuffer,
            )
          ) {
            addDiagnostic(
              diagnostics,
              'source.origin-receipt',
              `${originPrefix}.evidencePath`,
              'download_assets evidence must be a URL-free receipt matching this source, export settings, byte length, and checksum.',
            );
          }
        }
      }
      if (
        request?.operation === 'get_screenshot' &&
        sourceBuffer &&
        originBuffer &&
        !sourceBuffer.equals(originBuffer)
      ) {
        addDiagnostic(
          diagnostics,
          'source.origin-bytes',
          `${originPrefix}.evidencePath`,
          'A screenshot source must be byte-identical to its stored get_screenshot response.',
        );
      }
    } else {
      if (source.origin.requestId !== null) {
        addDiagnostic(
          diagnostics,
          'source.origin-request',
          `${originPrefix}.requestId`,
          'Editor and user exports require requestId: null.',
        );
      }
      const expectedManualOriginPath =
        `artifacts/visual/${task.taskId}/origins/${source.sourceId}.${source.mediaKind}`;
      if (source.origin.evidencePath !== expectedManualOriginPath) {
        addDiagnostic(
          diagnostics,
          'source.origin-path',
          `${originPrefix}.evidencePath`,
          `Manual export evidence must be stored at ${expectedManualOriginPath}.`,
        );
      }
      if (sourceBuffer && originBuffer && !sourceBuffer.equals(originBuffer)) {
        addDiagnostic(
          diagnostics,
          'source.origin-bytes',
          `${originPrefix}.evidencePath`,
          'The canonical source must be byte-identical to the preserved manual export.',
        );
      }
    }

    if (source.purpose === 'runtime-asset') {
      let runtimeBuffer;
      if (typeof source.runtimePath === 'string') {
        const extensionMatch = /\.([^.]+)$/u.exec(source.runtimePath);
        const runtimeMediaKind = extensionMatch?.[1]?.toLowerCase();
        if (!['png', 'svg'].includes(runtimeMediaKind) || runtimeMediaKind !== source.mediaKind) {
          addDiagnostic(
            diagnostics,
            'source.runtime-media',
            `${prefix}.runtimePath`,
            'Runtime asset path must end in .png or .svg and match mediaKind.',
          );
        }
        if (runtimeSourcesByPath.has(source.runtimePath)) {
          addDiagnostic(
            diagnostics,
            'source.runtime-duplicate',
            `${prefix}.runtimePath`,
            'Each runtime asset path must have exactly one source-manifest entry.',
          );
        } else {
          runtimeSourcesByPath.set(source.runtimePath, source);
        }
        runtimeBuffer = await readArtifact(
          projectRoot,
          source.runtimePath,
          `${prefix}.runtimePath`,
          diagnostics,
        );
      } else {
        addDiagnostic(
          diagnostics,
          'source.runtime-path',
          `${prefix}.runtimePath`,
          'Runtime assets require a project-relative runtimePath.',
        );
      }
      const implementationFile = implementationFiles.get(source.runtimePath);
      if (
        source.runtimeChecksum !== source.checksum ||
        !implementationFile ||
        implementationFile.hash !== source.runtimeChecksum
      ) {
        addDiagnostic(
          diagnostics,
          'source.runtime-manifest',
          `${prefix}.runtimeChecksum`,
          'Runtime asset path and checksum must match the implementation manifest and source checksum.',
        );
      }
      if (runtimeBuffer && sourceBuffer && !runtimeBuffer.equals(sourceBuffer)) {
        addDiagnostic(
          diagnostics,
          'source.runtime-bytes',
          `${prefix}.runtimePath`,
          'Runtime asset must be byte-identical to the preserved source.',
        );
      }
      if (runtimeBuffer && checksum(runtimeBuffer) !== source.runtimeChecksum) {
        addDiagnostic(
          diagnostics,
          'source.runtime-checksum',
          `${prefix}.runtimeChecksum`,
          'Runtime checksum must match the current project file.',
        );
      }
    } else if (source.runtimePath !== null || source.runtimeChecksum !== null) {
      addDiagnostic(
        diagnostics,
        'source.runtime-null',
        `${prefix}.runtimePath`,
        'Visual references require runtimePath and runtimeChecksum to be null.',
      );
    }

    for (const [derivationIndex, derivation] of source.derivations.entries()) {
      const derivationPrefix = `${prefix}.derivations[${derivationIndex}]`;
      if (derivation.inputChecksum !== source.checksum) {
        addDiagnostic(
          diagnostics,
          'source.derivation-input',
          `${derivationPrefix}.inputChecksum`,
          'Derivation input checksum must match its source.',
        );
      }
      const outputBuffer = await readArtifact(
        projectRoot,
        derivation.outputPath,
        `${derivationPrefix}.outputPath`,
        diagnostics,
      );
      if (outputBuffer && checksum(outputBuffer) !== derivation.outputChecksum) {
        addDiagnostic(
          diagnostics,
          'source.derivation-checksum',
          `${derivationPrefix}.outputChecksum`,
          'Derived PNG checksum must match the stored file.',
        );
      }
      if (!sameDimensions(pngDimensions(outputBuffer), derivation.pixelDimensions)) {
        addDiagnostic(
          diagnostics,
          'source.derivation-dimensions',
          `${derivationPrefix}.pixelDimensions`,
          'Derived output must be a valid 8-bit RGBA PNG with matching dimensions.',
        );
      }
    }
  }

  for (const request of designContextManifest?.requests ?? []) {
    if (request.operation !== 'download_assets') continue;
    const linkedSources = manifest.sources.filter(
      (source) =>
        source.origin.kind === 'connector-request' &&
        source.origin.requestId === request.requestId,
    );
    const receiptBuffer = await readArtifact(
      projectRoot,
      request.path,
      `$.requests.${request.requestId}.path`,
      diagnostics,
    );
    const receipt = parseJsonBuffer(
      receiptBuffer,
      'download-assets-receipt.json',
      `$.requests.${request.requestId}.path`,
      diagnostics,
    );
    if (!isSafeAssetReceipt(receipt, request.requestId)) continue;

    if (linkedSources.length !== receipt.assets.length) {
      addDiagnostic(
        diagnostics,
        'source.origin-receipt-coverage',
        `$.requests.${request.requestId}`,
        'Every download_assets receipt entry must map to exactly one source, with no unused request or duplicate source.',
      );
    }
    for (const asset of receipt.assets) {
      const matches = linkedSources.filter((source) =>
        receiptAssetMatchesSource(
          asset,
          source,
          sourceBuffersById.get(source.sourceId),
        ));
      if (matches.length !== 1) {
        addDiagnostic(
          diagnostics,
          'source.origin-receipt-coverage',
          `$.requests.${request.requestId}`,
          'Every download_assets receipt entry must map to exactly one source, with no unused request or duplicate source.',
        );
      }
    }
  }

  for (const implementationFile of implementationManifest?.files ?? []) {
    if (implementationFile.kind !== 'file') continue;
    const extension = /\.([^.]+)$/u.exec(implementationFile.path)?.[1]?.toLowerCase();
    if (unsupportedRuntimeAssetExtensions.has(extension)) {
      addDiagnostic(
        diagnostics,
        'source.runtime-format',
        '$.sources',
        `Changed image ${implementationFile.path} uses an unsupported runtime format; use PNG or SVG.`,
      );
    } else if (
      ['png', 'svg'].includes(extension) &&
      !runtimeSourcesByPath.has(implementationFile.path)
    ) {
      addDiagnostic(
        diagnostics,
        'source.runtime-coverage',
        '$.sources',
        `Changed image ${implementationFile.path} requires exactly one runtime-asset source entry.`,
      );
    }
  }

  for (const [index, captureCase] of (capture.cases ?? []).entries()) {
    if (captureCase.evidenceMode !== 'visual-reference' || !isObject(captureCase.reference)) continue;
    const prefix = `$.cases[${index}].reference`;
    const reference = captureCase.reference;
    const source = sourcesById.get(reference.sourceId);
    if (!source || source.purpose !== 'visual-reference' || source.caseId !== captureCase.caseId) {
      addDiagnostic(
        diagnostics,
        'reference.source',
        `${prefix}.sourceId`,
        'Reference sourceId must identify this visual-reference case.',
      );
      continue;
    }
    const expectedLogicalDimensions = captureLogicalDimensions(captureCase);
    if (!sameDimensions(source.logicalDimensions, expectedLogicalDimensions)) {
      addDiagnostic(
        diagnostics,
        'reference.logical-dimensions',
        `${prefix}.sourceId`,
        'Visual source logical dimensions must match the capture region.',
      );
    }
    const referenceBuffer = await readArtifact(projectRoot, reference.path, `${prefix}.path`, diagnostics);
    if (!referenceBuffer) continue;
    if (checksum(referenceBuffer) !== reference.checksum) {
      addDiagnostic(
        diagnostics,
        'reference.checksum',
        `${prefix}.checksum`,
        'Reference checksum must match reference.png.',
      );
    }
    if (!sameDimensions(pngDimensions(referenceBuffer), reference.dimensions)) {
      addDiagnostic(
        diagnostics,
        'reference.dimensions',
        `${prefix}.dimensions`,
        'Reference must be a valid 8-bit RGBA PNG with declared dimensions.',
      );
    }
    const sourceBuffer =
      source.mediaKind === 'png'
        ? await readArtifact(projectRoot, source.path, `${prefix}.sourceId`, diagnostics)
        : undefined;
    const directSource =
      sourceBuffer !== undefined && sourceBuffer.equals(referenceBuffer);
    const matchingDerivations = source.derivations.filter(
      (item) => item.outputPath === reference.path && item.outputChecksum === reference.checksum,
    );
    if (
      (source.mediaKind === 'png' && !directSource) ||
      (source.mediaKind === 'svg' && matchingDerivations.length !== 1)
    ) {
      addDiagnostic(
        diagnostics,
        'reference.provenance',
        `${prefix}.path`,
        'Reference must be byte-identical to its PNG source or match exactly one SVG derivation.',
      );
    }

    const mirrorPath = `tests/visual/references/figma/${task.taskId}/${captureCase.caseId}.png`;
    const mirrorBuffer = await readArtifact(projectRoot, mirrorPath, `${prefix}.checksum`, diagnostics);
    if (mirrorBuffer && !mirrorBuffer.equals(referenceBuffer)) {
      addDiagnostic(
        diagnostics,
        'reference.mirror-checksum',
        `${prefix}.checksum`,
        'Test mirror must be byte-identical to the case reference.',
      );
    }
  }
}

async function validateConformance(
  projectRoot,
  task,
  implementationHash,
  captureContractHash,
  diagnostics,
) {
  if (typeof task?.taskId !== 'string') return;
  const versionRoot = implementationArtifactRoot(task.taskId, implementationHash);
  if (!versionRoot) return;
  const conformancePath = `${versionRoot}/comparator-conformance.json`;
  const conformance = await loadCanonicalRecord(
    projectRoot,
    conformancePath,
    conformanceSchema,
    'conformance',
    diagnostics,
  );
  if (!conformance) return;
  if (
    conformance.taskId !== task.taskId ||
    conformance.implementationHash !== implementationHash
  ) {
    addDiagnostic(
      diagnostics,
      'conformance.identity',
      '$',
      'Comparator conformance must match the task and current implementation hash.',
    );
  }
  const fixtureRoot = `${versionRoot}/conformance`;
  const expectedPaths = {
    reference: `${fixtureRoot}/reference.png`,
    actual: `${fixtureRoot}/actual.png`,
    raw: `${fixtureRoot}/raw.json`,
    diff: `${fixtureRoot}/diff.png`,
    overlay: `${fixtureRoot}/overlay.png`,
  };
  for (const [field, expectedPath] of Object.entries(expectedPaths)) {
    if (conformance.fixtures[field] !== expectedPath) {
      addDiagnostic(
        diagnostics,
        'conformance.path',
        `$.fixtures.${field}`,
        `Comparator conformance path must be ${expectedPath}.`,
      );
    }
  }
  const canonicalMetrics = { differentPixels: 1, totalPixels: 4, differenceRatio: 25 };
  if (
    !sameMetrics(conformance.expected, canonicalMetrics) ||
    !sameMetrics(conformance.actual, canonicalMetrics)
  ) {
    addDiagnostic(
      diagnostics,
      'conformance.metrics',
      '$.actual',
      'Comparator conformance metrics must equal the canonical known result.',
    );
  }
  const buffers = new Map();
  for (const [field, fixturePath] of Object.entries(expectedPaths)) {
    buffers.set(field, await readArtifact(projectRoot, fixturePath, `$.fixtures.${field}`, diagnostics));
  }
  const referenceBuffer = buffers.get('reference');
  const actualBuffer = buffers.get('actual');
  let decodedReference;
  let decodedActual;
  try {
    if (referenceBuffer) decodedReference = decodeRgbaPng(referenceBuffer);
    if (actualBuffer) decodedActual = decodeRgbaPng(actualBuffer);
  } catch {
    addDiagnostic(
      diagnostics,
      'conformance.fixtures',
      '$.fixtures',
      'Conformance inputs must be valid 8-bit RGBA PNG files.',
    );
  }
  const black = [0, 0, 0, 255];
  const white = [255, 255, 255, 255];
  const pixelEquals = (data, index, expected) =>
    expected.every((value, channel) => data[index * 4 + channel] === value);
  const canonicalPair =
    decodedReference?.width === 2 &&
    decodedReference?.height === 2 &&
    decodedActual?.width === 2 &&
    decodedActual?.height === 2 &&
    [0, 1, 2, 3].every((index) => pixelEquals(decodedReference.data, index, black)) &&
    [0, 1, 2].every((index) => pixelEquals(decodedActual.data, index, black)) &&
    pixelEquals(decodedActual.data, 3, white);
  if (decodedReference && decodedActual && !canonicalPair) {
    addDiagnostic(
      diagnostics,
      'conformance.fixtures',
      '$.fixtures',
      'Conformance inputs must use the canonical three-black-and-one-white 2x2 pair.',
    );
  }
  let measured;
  try {
    if (referenceBuffer && actualBuffer) measured = compareRgbaPng(referenceBuffer, actualBuffer);
  } catch {
    // The fixture diagnostic above owns invalid or mismatched inputs.
  }
  if (measured && !sameMetrics(measured, canonicalMetrics)) {
    addDiagnostic(
      diagnostics,
      'conformance.metrics',
      '$.actual',
      'Independent pixel decoding must reproduce the canonical known result.',
    );
  }

  const raw = parseJsonBuffer(buffers.get('raw'), 'conformance.raw', '$.fixtures.raw', diagnostics);
  const rawValid = raw
    ? addMappedSchemaDiagnostics(raw, rawSchema, 'conformance.raw-schema', diagnostics)
    : false;
  const conformanceChecksumMismatch =
    rawValid &&
    [
      ['referenceChecksum', 'reference'],
      ['actualChecksum', 'actual'],
      ['diffChecksum', 'diff'],
      ['overlayChecksum', 'overlay'],
    ].some(
      ([field, artifact]) =>
        buffers.get(artifact) && raw[field] !== checksum(buffers.get(artifact)),
    );
  if (
    !rawValid ||
    raw.implementationHash !== implementationHash ||
    raw.captureContractHash !== captureContractHash ||
    raw.comparator !== 'rgba-exact-v1' ||
    raw.pixelThreshold !== 0 ||
    raw.antialiasPolicy !== 'count' ||
    raw.diff !== expectedPaths.diff ||
    raw.overlay !== expectedPaths.overlay ||
    !sameDimensions(raw.referenceDimensions, { width: 2, height: 2 }) ||
    !sameDimensions(raw.actualDimensions, { width: 2, height: 2 }) ||
    !sameMetrics(raw, canonicalMetrics) ||
    !sameMetrics(raw, conformance.actual) ||
    conformanceChecksumMismatch
  ) {
    addDiagnostic(
      diagnostics,
      'conformance.raw',
      '$.fixtures.raw',
      'Stored comparator output must match the canonical paths and independently measured metrics.',
    );
  }
  for (const field of ['diff', 'overlay']) {
    if (!sameDimensions(pngDimensions(buffers.get(field)), { width: 2, height: 2 })) {
      addDiagnostic(
        diagnostics,
        'conformance.image',
        `$.fixtures.${field}`,
        'Comparator diagnostic images must be valid 2x2 RGBA PNG files.',
      );
    }
  }
}

async function validateIterationBundle(
  projectRoot,
  task,
  captureCase,
  iterationName,
  isFinalIteration,
  implementationHash,
  captureContractHash,
  diagnostics,
) {
  const bundleRoot = `artifacts/visual/${task.taskId}/${captureCase.caseId}/iterations/${iterationName}`;
  try {
    const entries = await readArtifactDirectory(
      projectRoot,
      bundleRoot,
      bundleRoot,
      diagnostics,
    );
    if (!entries) throw new Error('missing bundle directory');
    for (const entry of entries.sort((left, right) => compareUtf8Text(left.name, right.name))) {
      if (!bundleFiles.includes(entry.name)) {
        addDiagnostic(
          diagnostics,
          'artifact.unexpected',
          `${bundleRoot}/${entry.name}`,
          'Iteration bundles may contain only the seven canonical artifacts.',
        );
      }
    }
  } catch {
    // The caller owns missing iteration-directory diagnostics.
  }
  const buffers = new Map();
  for (const fileName of bundleFiles) {
    buffers.set(
      fileName,
      await readArtifact(projectRoot, `${bundleRoot}/${fileName}`, `${bundleRoot}/${fileName}`, diagnostics),
    );
  }
  if (buffers.get('reference.png')) {
    const caseReference = await readArtifact(
      projectRoot,
      captureCase.reference.path,
      '$.reference.path',
      diagnostics,
    );
    if (caseReference && !caseReference.equals(buffers.get('reference.png'))) {
      addDiagnostic(
        diagnostics,
        'reference.bundle-checksum',
        '$.reference.checksum',
        'Bundle reference must be byte-identical to the case reference.',
      );
    }
  }

  const raw = parseJsonBuffer(buffers.get('raw.json'), 'raw.json', '$.raw', diagnostics);
  const result = parseJsonBuffer(buffers.get('result.json'), 'result.json', '$.result', diagnostics);
  const rawValid = raw ? addMappedSchemaDiagnostics(raw, rawSchema, 'raw.schema', diagnostics) : false;
  const resultValid = result
    ? addMappedSchemaDiagnostics(result, resultSchema, 'result.schema', diagnostics)
    : false;
  if (!rawValid || !resultValid) return;
  if (
    raw.implementationHash !== result.implementationHash ||
    (isFinalIteration && raw.implementationHash !== implementationHash) ||
    raw.captureContractHash !== captureContractHash ||
    result.captureContractHash !== captureContractHash
  ) {
    addDiagnostic(
      diagnostics,
      'iteration.identity',
      '$.captureContractHash',
      'Raw and result records must identify the same implementation and canonical capture contract; the final iteration must use the current implementation.',
    );
  }

  const rawArtifacts = [
    ['referenceChecksum', 'reference.png'],
    ['actualChecksum', 'actual.png'],
    ['diffChecksum', 'diff.png'],
    ['overlayChecksum', 'overlay.png'],
  ];
  for (const [field, fileName] of rawArtifacts) {
    const buffer = buffers.get(fileName);
    if (buffer && raw[field] !== checksum(buffer)) {
      addDiagnostic(
        diagnostics,
        'raw.checksum',
        `$.${field}`,
        `${field} must match the stored ${fileName} bytes.`,
      );
    }
  }

  const expectedIteration = Number.parseInt(iterationName, 10);
  const expectedPaths = {
    reference: `${bundleRoot}/reference.png`,
    actual: `${bundleRoot}/actual.png`,
    diff: `${bundleRoot}/diff.png`,
    overlay: `${bundleRoot}/overlay.png`,
    raw: `${bundleRoot}/raw.json`,
    analysis: `${bundleRoot}/analysis.md`,
  };
  for (const [field, expected] of Object.entries(expectedPaths)) {
    if (result[field] !== expected) {
      addDiagnostic(
        diagnostics,
        'result.path',
        `$.${field}`,
        `Result ${field} path must be canonical.`,
      );
    }
  }
  if (raw.diff !== expectedPaths.diff || raw.overlay !== expectedPaths.overlay) {
    addDiagnostic(diagnostics, 'raw.path', '$.diff', 'Raw artifact paths must be canonical.');
  }
  if (result.iteration !== expectedIteration) {
    addDiagnostic(
      diagnostics,
      'result.iteration',
      '$.iteration',
      'Result iteration must match its bundle directory.',
    );
  }
  const expectedViewport = `${captureCase.viewport.width}x${captureCase.viewport.height}`;
  if (result.viewport !== expectedViewport) {
    addDiagnostic(
      diagnostics,
      'result.viewport',
      '$.viewport',
      `Result viewport must be ${expectedViewport}.`,
    );
  }

  let analysisSource;
  if (buffers.get('analysis.md')) {
    try {
      analysisSource = new TextDecoder('utf-8', { fatal: true }).decode(
        buffers.get('analysis.md'),
      );
    } catch {
      addDiagnostic(
        diagnostics,
        'analysis.encoding',
        '$.analysis',
        'Analysis must contain valid UTF-8 text.',
      );
    }
  }
  const actualDimensions = pngDimensions(buffers.get('actual.png'));
  const referenceDimensions = pngDimensions(buffers.get('reference.png'));
  const expectedDimensions = captureCase.reference.dimensions;
  for (const [field, fileName] of [
    ['diff', 'diff.png'],
    ['overlay', 'overlay.png'],
  ]) {
    const buffer = buffers.get(fileName);
    if (buffer && !sameDimensions(pngDimensions(buffer), expectedDimensions)) {
      addDiagnostic(
        diagnostics,
        'raw.image-dimensions',
        `$.${field}`,
        'Diff and overlay PNG dimensions must match the comparison inputs.',
      );
    }
  }
  if (
    !sameDimensions(actualDimensions, raw.actualDimensions) ||
    !sameDimensions(referenceDimensions, raw.referenceDimensions) ||
    !sameDimensions(actualDimensions, expectedDimensions) ||
    !sameDimensions(referenceDimensions, expectedDimensions) ||
    raw.totalPixels !== expectedDimensions.width * expectedDimensions.height
  ) {
    addDiagnostic(
      diagnostics,
      'raw.dimensions',
      '$.actualDimensions',
      'Raw dimensions and total pixels must match PNGs and the capture contract.',
    );
  }
  let measured;
  try {
    if (buffers.get('reference.png') && buffers.get('actual.png')) {
      measured = compareRgbaPng(buffers.get('reference.png'), buffers.get('actual.png'));
    }
  } catch {
    addDiagnostic(
      diagnostics,
      'raw.image-invalid',
      '$.actualDimensions',
      'Comparison inputs must be valid same-sized 8-bit RGBA PNG files.',
    );
  }
  if (
    measured &&
    (raw.differentPixels !== measured.differentPixels ||
      raw.totalPixels !== measured.totalPixels ||
      !closeEnough(raw.differenceRatio, measured.differenceRatio))
  ) {
    addDiagnostic(
      diagnostics,
      'raw.pixel-metrics',
      '$.differentPixels',
      'Raw metrics must match independent RGBA pixel comparison.',
    );
  }
  validateVisualAnalysis({
    source: analysisSource,
    raw,
    result,
    diagnostics,
    isFinalIteration,
    measured,
  });
  const approval = result.approval;
  if (result.status === 'strict-visual-accepted') {
    const versionRoot = implementationArtifactRoot(task.taskId, result.implementationHash);
    const expectedApprovalPath = versionRoot
      ? `${versionRoot}/approvals/${captureCase.caseId}-${iterationName}.json`
      : undefined;
    if (!isObject(approval) || approval.path !== expectedApprovalPath) {
      addDiagnostic(
        diagnostics,
        'approval.path',
        '$.approval',
        'An accepted nonzero visual difference requires a canonical manual approval record.',
      );
    } else {
      const approvalBuffer = await readArtifact(
        projectRoot,
        approval.path,
        '$.approval.path',
        diagnostics,
      );
      if (approvalBuffer && checksum(approvalBuffer) !== approval.checksum) {
        addDiagnostic(
          diagnostics,
          'approval.checksum',
          '$.approval.checksum',
          'Approval checksum must match the stored record.',
        );
      }
      const approvalRecord = parseJsonBuffer(
        approvalBuffer,
        'visual-approval.json',
        '$.approval.path',
        diagnostics,
      );
      const approvalValid = approvalRecord
        ? addMappedSchemaDiagnostics(
            approvalRecord,
            visualApprovalSchema,
            'approval.schema',
            diagnostics,
            '$.approval.path',
          )
        : false;
      if (
        approvalValid &&
        (approvalRecord.taskId !== task.taskId ||
          approvalRecord.implementationHash !== result.implementationHash ||
          approvalRecord.captureContractHash !== captureContractHash ||
          approvalRecord.caseId !== captureCase.caseId ||
          approvalRecord.iteration !== expectedIteration ||
          !buffers.get('raw.json') ||
          approvalRecord.rawChecksum !== checksum(buffers.get('raw.json')) ||
          !buffers.get('analysis.md') ||
          approvalRecord.analysisChecksum !== checksum(buffers.get('analysis.md')))
      ) {
        addDiagnostic(
          diagnostics,
          'approval.identity',
          '$.approval.path',
          'Approval must identify this task, implementation, capture contract, iteration, raw result, and analysis.',
        );
      }
    }
  } else if (approval !== null) {
    addDiagnostic(
      diagnostics,
      'approval.unexpected',
      '$.approval',
      'Pixel-perfect and failed results require approval: null.',
    );
  }
  return result;
}

async function validateBrowserEvidenceArtifact(
  projectRoot,
  evidencePath,
  task,
  captureCase,
  expectedImplementationHash,
  captureContractHash,
  diagnosticPath,
  diagnostics,
) {
  const evidenceBuffer = await readArtifact(
    projectRoot,
    evidencePath,
    diagnosticPath,
    diagnostics,
  );
  const evidence = parseJsonBuffer(
    evidenceBuffer,
    'no-reference.json',
    diagnosticPath,
    diagnostics,
  );
  const evidenceValid = evidence
    ? addMappedSchemaDiagnostics(
        evidence,
        browserEvidenceSchema,
        'no-reference.schema',
        diagnostics,
        diagnosticPath,
      )
    : false;
  if (evidenceValid) {
    const identityValid =
      evidence.taskId === task.taskId &&
      evidence.caseId === captureCase.caseId &&
      evidence.fileKey === task.source.fileKey &&
      evidence.fileVersion === task.source.fileVersion &&
      normalizeNodeId(evidence.nodeId) === normalizeNodeId(task.source.nodeId) &&
      evidence.route === captureCase.route &&
      isDeepStrictEqual(evidence.viewport, captureCase.viewport) &&
      evidence.state === captureCase.state &&
      evidence.evidenceMode === captureCase.evidenceMode &&
      evidence.implementationHash === expectedImplementationHash &&
      evidence.captureContractHash === captureContractHash;
    if (!identityValid) {
      addDiagnostic(
        diagnostics,
        'no-reference.identity',
        diagnosticPath,
        'Browser evidence must match its capture case and implementation hash.',
      );
    }
    const assertionKinds = new Set(evidence.assertions.map(({ kind }) => kind));
    const requiredKinds =
      captureCase.evidenceMode === 'behavior-only'
        ? ['keyboard', 'focus', 'accessible-name', 'contrast']
        : ['overflow', 'reading-order', 'reflow', 'zoom'];
    const missingKinds = requiredKinds.filter((kind) => !assertionKinds.has(kind));
    if (missingKinds.length > 0) {
      addDiagnostic(
        diagnostics,
        'no-reference.assertions',
        diagnosticPath,
        `Browser evidence is missing required assertions: ${missingKinds.join(', ')}.`,
      );
    }
  }
  return evidenceBuffer;
}

async function validateBundles(
  projectRoot,
  task,
  capture,
  implementationHash,
  captureContractHash,
  diagnostics,
) {
  const finalResults = new Map();
  if (await pathExists(path.resolve(projectRoot, legacyArtifactRoot))) {
    addDiagnostic(
      diagnostics,
      'path.legacy',
      legacyArtifactRoot,
      'Legacy visual-evidence root is forbidden.',
    );
  }

  try {
    const mirrorEntries = await readArtifactDirectory(
      projectRoot,
      'tests/visual/references/figma',
      'tests/visual/references/figma',
      diagnostics,
    );
    if (!mirrorEntries) throw new Error('missing mirror root');
    mirrorEntries.sort((left, right) => compareUtf8Text(left.name, right.name));
    for (const entry of mirrorEntries) {
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        const relativePath = `tests/visual/references/figma/${entry.name}`;
        addDiagnostic(
          diagnostics,
          'reference.collision-path',
          relativePath,
          'Test references must be nested by task ID and case ID.',
        );
      }
    }
  } catch {
    // Canonical mirror completeness is checked per visual-reference case.
  }

  try {
    const visualRootEntries = await readArtifactDirectory(
      projectRoot,
      'artifacts/visual',
      'artifacts/visual',
      diagnostics,
    );
    if (!visualRootEntries) throw new Error('missing visual root');
    visualRootEntries.sort((left, right) => compareUtf8Text(left.name, right.name));
    for (const entry of visualRootEntries) {
      if (!entry.isDirectory()) {
        const relativePath = `artifacts/visual/${entry.name}`;
        addDiagnostic(
          diagnostics,
          'bundle.flat',
          relativePath,
          'Files directly under artifacts/visual are forbidden.',
        );
      }
    }
  } catch {
    // Task-specific artifact checks report missing evidence below.
  }

  if (!Array.isArray(capture?.cases)) return finalResults;
  for (const captureCase of capture.cases) {
    if (!isObject(captureCase) || typeof captureCase.caseId !== 'string') continue;
    const caseRoot = `artifacts/visual/${task.taskId}/${captureCase.caseId}`;
    let caseEntries = [];
    try {
      const foundCaseEntries = await readArtifactDirectory(
        projectRoot,
        caseRoot,
        caseRoot,
        diagnostics,
      );
      if (!foundCaseEntries) throw new Error('missing case root');
      caseEntries = foundCaseEntries;
      caseEntries.sort((left, right) => compareUtf8Text(left.name, right.name));
    } catch {
      // Required case artifacts report their own completeness diagnostics below.
    }
    if (captureCase.evidenceMode !== 'visual-reference') {
      await validateBrowserEvidenceArtifact(
        projectRoot,
        captureCase.evidencePath,
        task,
        captureCase,
        implementationHash,
        captureContractHash,
        '$.evidencePath',
        diagnostics,
      );
      for (const entry of caseEntries) {
        if (entry.name !== 'evidence.json') {
          const forbidden = `${caseRoot}/${entry.name}`;
          addDiagnostic(
            diagnostics,
            'no-reference.artifact',
            forbidden,
            'No-reference case roots may contain only evidence.json.',
          );
        }
      }
      const mirrorPath =
        `tests/visual/references/figma/${task.taskId}/${captureCase.caseId}.png`;
      if (await pathExists(path.resolve(projectRoot, mirrorPath))) {
        addDiagnostic(
          diagnostics,
          'no-reference.artifact',
          mirrorPath,
          'No-reference cases must not create a test mirror.',
        );
      }
      continue;
    }

    for (const entry of caseEntries) {
      if (!['reference.png', 'iterations'].includes(entry.name)) {
        addDiagnostic(
          diagnostics,
          'artifact.unexpected',
          `${caseRoot}/${entry.name}`,
          'Visual-reference case roots may contain only reference.png and iterations.',
        );
      }
    }

    const iterationsRoot = `${caseRoot}/iterations`;
    let entries;
    try {
      entries = await readArtifactDirectory(
        projectRoot,
        iterationsRoot,
        iterationsRoot,
        diagnostics,
      );
      if (!entries) throw new Error('missing iterations root');
      entries.sort((left, right) => compareUtf8Text(left.name, right.name));
    } catch {
      addDiagnostic(
        diagnostics,
        'iteration.missing',
        '$.iterations',
        'Visual-reference case requires at least one iteration.',
      );
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^\d{3}$/u.test(entry.name)) {
        addDiagnostic(
          diagnostics,
          'iteration.entry',
          `${caseRoot}/iterations/${entry.name}`,
          'Iteration roots may contain only three-digit directories.',
        );
      }
    }
    const names = entries
      .filter((entry) => entry.isDirectory() && /^\d{3}$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort(compareUtf8Text);
    const expectedNames = names.map((_, index) => String(index + 1).padStart(3, '0'));
    if (names.length === 0 || names.some((name, index) => name !== expectedNames[index])) {
      addDiagnostic(
        diagnostics,
        'iteration.sequence',
        '$.iterations',
        'Iteration directories must be contiguous from 001.',
      );
      continue;
    }
    for (const [index, iterationName] of names.entries()) {
      const result = await validateIterationBundle(
        projectRoot,
        task,
        captureCase,
        iterationName,
        index === names.length - 1,
        implementationHash,
        captureContractHash,
        diagnostics,
      );
      if (index === names.length - 1 && result) {
        finalResults.set(captureCase.caseId, result);
      }
    }
  }
  return finalResults;
}

async function validateLoggedImplementationSnapshot(
  projectRoot,
  task,
  eventImplementationHash,
  expectedTaskContractHash,
  diagnosticPath,
  diagnostics,
) {
  const versionRoot = implementationArtifactRoot(task.taskId, eventImplementationHash);
  if (!versionRoot) return;
  const snapshotPath = `${versionRoot}/implementation-manifest.json`;
  let snapshot;
  try {
    snapshot = await loadProjectJson(projectRoot, snapshotPath);
  } catch {
    addDiagnostic(
      diagnostics,
      'evidence.implementation-snapshot',
      diagnosticPath,
      'G4 must preserve a readable versioned implementation manifest.',
    );
    return;
  }
  if (
    !addMappedSchemaDiagnostics(
      snapshot,
      implementationManifestSchema,
      'evidence.implementation-snapshot',
      diagnostics,
      diagnosticPath,
    )
  ) {
    return;
  }
  validateImplementationManifestSemantics(snapshot, task, diagnostics, {
    idPrefix: 'evidence.implementation-snapshot',
    diagnosticRoot: snapshotPath,
    expectedTaskContractHash,
  });
  if (snapshot.rootHash !== eventImplementationHash) {
    addDiagnostic(
      diagnostics,
      'evidence.implementation-snapshot',
      diagnosticPath,
      'Versioned implementation manifest must match its G4 event.',
    );
  }
}

async function validateMarkdownRecord(
  projectRoot,
  relativePath,
  id,
  minimumCharacters,
  requiredFragments,
  diagnostics,
) {
  const buffer = await readArtifact(projectRoot, relativePath, relativePath, diagnostics);
  if (!buffer) return;
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    addDiagnostic(diagnostics, id, relativePath, 'Markdown record must contain valid UTF-8.');
    return;
  }
  if (
    source.includes('\0') ||
    source.trim().length < minimumCharacters ||
    requiredFragments.some((fragment) => !source.includes(fragment))
  ) {
    addDiagnostic(
      diagnostics,
      id,
      relativePath,
      'Markdown record is incomplete or missing required contract projections.',
    );
  }
  return source;
}

function canonicalFailurePath(taskId, event) {
  const sequence = Number.isInteger(event?.sequence)
    ? String(event.sequence).padStart(4, '0')
    : 'invalid';
  const suffix = event?.eventType === 'failed-pre-diff'
    ? event.caseId
    : typeof event?.gateId === 'string'
      ? event.gateId.toLowerCase()
      : 'invalid';
  return `artifacts/visual/${taskId}/failures/${sequence}-${suffix}.json`;
}

async function validateFailureRecord(
  projectRoot,
  task,
  event,
  relativePath,
  diagnosticPath,
  diagnostics,
) {
  const record = await loadCanonicalRecord(
    projectRoot,
    relativePath,
    failureRecordSchema,
    'failure-record',
    diagnostics,
  );
  if (!record) return;
  const expectedCaseId = event.eventType === 'failed-pre-diff' ? event.caseId : null;
  if (
    record.sequence !== event.sequence ||
    record.taskId !== task.taskId ||
    record.gateId !== event.gateId ||
    record.caseId !== expectedCaseId ||
    record.implementationHash !== event.implementationHash
  ) {
    addDiagnostic(
      diagnostics,
      'failure-record.identity',
      diagnosticPath,
      'Failure record must identify its exact event, gate, case, and implementation.',
    );
  }
  if (
    typeof record.message === 'string' &&
    /(?:https?:\/\/|figma:\/\/|mcp:\/\/|(?:token|secret|password|cookie|authorization)\s*[:=])/iu.test(
      record.message,
    )
  ) {
    addDiagnostic(
      diagnostics,
      'failure-record.sensitive',
      diagnosticPath,
      'Failure messages must not contain URLs, credentials, cookies, or authorization data.',
    );
  }
}

async function collectClosedInventory(projectRoot, rootPath, diagnostics, required) {
  const files = [];
  const absoluteRoot = containedPath(projectRoot, rootPath, rootPath, diagnostics);
  if (!absoluteRoot) return files;
  try {
    if (await rejectSymlink(projectRoot, absoluteRoot, rootPath, diagnostics)) return files;
    const stats = await lstat(absoluteRoot);
    const canonical = await realpath(absoluteRoot);
    if (!stats.isDirectory() || !isContained(projectRoot, canonical)) {
      throw new Error('not a contained directory');
    }
  } catch {
    if (required) {
      addDiagnostic(
        diagnostics,
        'inventory.unreadable',
        rootPath,
        'Required artifact inventory root is missing, unreadable, or not a real directory.',
      );
    }
    return files;
  }
  const pending = [rootPath];
  let visited = 0;
  while (pending.length > 0) {
    const relativeDirectory = pending.pop();
    const absoluteDirectory = containedPath(
      projectRoot,
      relativeDirectory,
      relativeDirectory,
      diagnostics,
    );
    if (!absoluteDirectory) continue;
    let entries;
    try {
      entries = await readdir(absoluteDirectory, { withFileTypes: true });
    } catch {
      addDiagnostic(
        diagnostics,
        'inventory.unreadable',
        relativeDirectory,
        'Every directory inside an artifact inventory must be readable.',
      );
      continue;
    }
    entries.sort((left, right) => compareUtf8Text(left.name, right.name));
    for (const entry of entries) {
      visited += 1;
      if (visited > 10000) {
        addDiagnostic(
          diagnostics,
          'inventory.too-large',
          rootPath,
          'Artifact inventory exceeds 10000 entries.',
        );
        return files;
      }
      const relativePath = `${relativeDirectory}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        addDiagnostic(
          diagnostics,
          'inventory.symlink',
          relativePath,
          'Artifact inventory must not contain symbolic links.',
        );
      } else if (entry.isDirectory()) {
        pending.push(relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      } else {
        addDiagnostic(
          diagnostics,
          'inventory.special-file',
          relativePath,
          'Artifact inventory may contain only regular files and directories.',
        );
      }
    }
  }
  return files.sort(compareUtf8Text);
}

async function validateClosedArtifactInventory(
  projectRoot,
  taskId,
  allowedArtifactPaths,
  diagnostics,
) {
  for (const rootPath of [
    `artifacts/visual/${taskId}`,
    `tests/visual/references/figma/${taskId}`,
  ]) {
    const required = [...allowedArtifactPaths].some(
      (allowedPath) =>
        typeof allowedPath === 'string' &&
        (allowedPath === rootPath || allowedPath.startsWith(`${rootPath}/`)),
    );
    const actual = await collectClosedInventory(
      projectRoot,
      rootPath,
      diagnostics,
      required,
    );
    for (const actualPath of actual) {
      if (!allowedArtifactPaths.has(actualPath)) {
        addDiagnostic(
          diagnostics,
          'inventory.unexpected-file',
          actualPath,
          'Task evidence roots may contain only files declared by canonical records and events.',
        );
      }
    }
  }
}

async function validateEvidenceLog(
  projectRoot,
  task,
  capture,
  implementationHash,
  diagnostics,
  {
    preflightG8 = false,
    verificationRecord,
    finalResults,
    captureContractHash,
    designContextManifest,
    sourceManifest,
    implementationManifest,
    recordHashes,
    taskContractHash,
    allowedArtifactPaths = new Set(),
  } = {},
) {
  const relativePath = `artifacts/visual/${task.taskId}/evidence-log.jsonl`;
  const buffer = await readArtifact(projectRoot, relativePath, '$.evidenceLog', diagnostics);
  if (!buffer) return;
  if (buffer.length > maximumJsonBytes) {
    addDiagnostic(
      diagnostics,
      'evidence.too-large',
      '$.evidenceLog',
      'Evidence log exceeds the 4 MiB safety limit.',
    );
    return;
  }
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    addDiagnostic(
      diagnostics,
      'evidence.encoding',
      '$.evidenceLog',
      'Evidence log must contain valid UTF-8.',
    );
    return;
  }
  const normalizedSource = source.replace(/\r\n?/gu, '\n');
  if (
    source !== normalizedSource ||
    !source.endsWith('\n') ||
    source.slice(0, -1).trimEnd() !== source.slice(0, -1)
  ) {
    addDiagnostic(
      diagnostics,
      preflightG8 ? 'evidence.preflight-format' : 'evidence.format',
      '$.evidenceLog',
      'Evidence log requires LF line endings and exactly one line feed after the last physical event.',
    );
  }
  const lines = normalizedSource.endsWith('\n')
    ? normalizedSource.slice(0, -1).split('\n')
    : normalizedSource.split('\n');
  let g8Candidate;
  let g8CandidateIndex;
  if (preflightG8) {
    const taskRoot = `artifacts/visual/${task.taskId}`;
    const candidatePaths = [
      `${taskRoot}/verification-record.json`,
      `${taskRoot}/final-report.md`,
    ];
    const candidateIndex = lines.length;
    g8CandidateIndex = candidateIndex;
    const artifactHashes = [];
    for (const [index, artifactPath] of candidatePaths.entries()) {
      const artifactBuffer = await readArtifact(
        projectRoot,
        artifactPath,
        `$[${candidateIndex}].artifactHashes[${index}].path`,
        diagnostics,
      );
      artifactHashes.push({
        path: artifactPath,
        hash: artifactBuffer ? checksum(artifactBuffer) : `sha256:${'0'.repeat(64)}`,
      });
    }
    g8Candidate = {
      schemaVersion: 2,
      sequence: candidateIndex + 1,
      taskId: task.taskId,
      gateId: 'G8',
      eventType: 'gate-passed',
      artifactHashes,
      implementationHash,
      qualityGates: [],
      checkIds: [],
    };
    lines.push(JSON.stringify(g8Candidate));
  }
  const events = [];
  let latestImplementationHash = null;
  const gateOrder = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
  let nextGateIndex = 0;
  let openFailure;
  const openPreDiffFailures = new Set();
  const visualCaseIds = new Set(
    (capture.cases ?? [])
      .filter(({ evidenceMode }) => evidenceMode === 'visual-reference')
      .map(({ caseId }) => caseId),
  );
  const validatedConformanceHashes = new Set(
    checksumPattern.test(implementationHash ?? '') ? [implementationHash] : [],
  );
  const requiredArtifactsForGate = (gateId, eventImplementationHash) => {
    const taskRoot = `artifacts/visual/${task.taskId}`;
    if (gateId === 'G0') return [`${taskRoot}/compatibility.md`];
    if (gateId === 'G1') return [`${taskRoot}/task-contract.json`];
    if (gateId === 'G2') {
      return [`${taskRoot}/design-context-manifest.json`, `${taskRoot}/source-manifest.json`];
    }
    if (gateId === 'G3') {
      return [`${taskRoot}/capture-contract.json`, `${taskRoot}/pre-code-evidence.md`];
    }
    if (gateId === 'G8') {
      return [`${taskRoot}/verification-record.json`, `${taskRoot}/final-report.md`];
    }

    const versionRoot = implementationArtifactRoot(task.taskId, eventImplementationHash);
    if (!versionRoot) return [];
    if (gateId === 'G4') return [`${versionRoot}/implementation-manifest.json`];
    if (gateId === 'G5') {
      return ['q1', 'q2', 'q3', 'q4'].map((id) => `${versionRoot}/checks/${id}.md`);
    }
    if (gateId === 'G6') {
      return task.acceptance.projectChecks.map(({ id }) => `${versionRoot}/checks/${id}.txt`);
    }
    if (gateId === 'G7') {
      return [
        `${versionRoot}/checks/q5.md`,
        `${versionRoot}/checks/q6.md`,
        ...task.acceptance.browserChecks.map(({ id }) => `${versionRoot}/checks/${id}.txt`),
        ...(capture.cases ?? [])
          .filter(({ evidenceMode }) => evidenceMode !== 'visual-reference')
          .map(({ caseId }) => `${versionRoot}/cases/${caseId}/evidence.json`),
        ...(capture.cases ?? []).some(({ evidenceMode }) => evidenceMode === 'visual-reference')
          ? [
              `${versionRoot}/comparator-conformance.json`,
              `${versionRoot}/conformance/reference.png`,
              `${versionRoot}/conformance/actual.png`,
              `${versionRoot}/conformance/raw.json`,
              `${versionRoot}/conformance/diff.png`,
              `${versionRoot}/conformance/overlay.png`,
            ]
          : [],
      ];
    }
    return [];
  };
  const sameOrderedValues = (actual, expected) =>
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index]);
  const requireExactArtifactPaths = (event, eventPath, expectedPaths) => {
    for (const expectedPath of expectedPaths) allowedArtifactPaths.add(expectedPath);
    const actualPaths = (Array.isArray(event.artifactHashes) ? event.artifactHashes : [])
      .map((artifact) => artifact?.path);
    if (!sameOrderedValues(actualPaths, expectedPaths)) {
      addDiagnostic(
        diagnostics,
        'evidence.artifact-set',
        `${eventPath}.artifactHashes`,
        'artifactHashes must contain exactly the canonical paths in their required order.',
      );
    }
  };
  for (const [index, line] of lines.entries()) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      addDiagnostic(diagnostics, 'evidence.json', `$[${index}]`, 'Evidence event is malformed JSON.');
      events.push(undefined);
      continue;
    }
    if (line !== JSON.stringify(event)) {
      addDiagnostic(
        diagnostics,
        'evidence.format',
        `$[${index}]`,
        'Each evidence event must be one canonical compact JSON line.',
      );
    }
    events.push(event);
    addMappedSchemaDiagnostics(
      event,
      evidenceEventSchema,
      'evidence.schema',
      diagnostics,
      `$[${index}]`,
    );
    if (!isObject(event)) continue;
    if (event.sequence !== index + 1) {
      addDiagnostic(
        diagnostics,
        'evidence.sequence',
        `$[${index}].sequence`,
        'Evidence sequence must be contiguous from 1.',
      );
    }
    if (event.taskId !== task.taskId) {
      addDiagnostic(
        diagnostics,
        'evidence.task',
        `$[${index}].taskId`,
        'Evidence taskId must match the task contract.',
      );
    }
    const artifactHashes = Array.isArray(event.artifactHashes) ? event.artifactHashes : [];
    const artifactPaths = new Set();
    const artifactBuffers = new Map();
    for (const [hashIndex, artifact] of artifactHashes.entries()) {
      if (!isObject(artifact)) continue;
      if (artifactPaths.has(artifact.path)) {
        addDiagnostic(
          diagnostics,
          'evidence.artifact-duplicate',
          `$[${index}].artifactHashes[${hashIndex}].path`,
          'An event may hash each artifact path only once.',
        );
      }
      artifactPaths.add(artifact.path);
      const artifactBuffer = await readArtifact(
        projectRoot,
        artifact.path,
        `$[${index}].artifactHashes[${hashIndex}].path`,
        diagnostics,
      );
      if (artifactBuffer) artifactBuffers.set(artifact.path, artifactBuffer);
      if (artifactBuffer && artifact.hash !== checksum(artifactBuffer)) {
        addDiagnostic(
          diagnostics,
          'evidence.hash',
          `$[${index}].artifactHashes[${hashIndex}].hash`,
          'Evidence hash must match its artifact.',
        );
      }
    }
    const gateIndex = gateOrder.indexOf(event.gateId);
    const eventPath = `$[${index}]`;
    const gateEvent = event.eventType === 'gate-passed' || event.eventType === 'gate-failed';
    const preImplementationEvent = gateEvent && gateIndex >= 0 && gateIndex < 4;
    const initialImplementationFailure =
      event.eventType === 'gate-failed' &&
      event.gateId === 'G4' &&
      latestImplementationHash === null;
    const validImplementationHash =
      typeof event.implementationHash === 'string' &&
      checksumPattern.test(event.implementationHash);
    if (preImplementationEvent || initialImplementationFailure) {
      if (event.implementationHash !== null) {
        addDiagnostic(
          diagnostics,
          'evidence.implementation-hash',
          `${eventPath}.implementationHash`,
          'G0 through G3 events and the initial G4 failure require implementationHash: null.',
        );
      }
    } else if (!validImplementationHash) {
      addDiagnostic(
        diagnostics,
        'evidence.implementation-hash',
        `${eventPath}.implementationHash`,
        'G4 and later events require a SHA-256 implementation hash.',
      );
    }

    const caseFields = ['caseId', 'iteration', 'evidencePath'];
    if (gateEvent || event.eventType === 'implementation-changed') {
      if (caseFields.some((field) => hasOwn(event, field))) {
        addDiagnostic(
          diagnostics,
          'evidence.event-fields',
          eventPath,
          'Gate and implementation events must not contain case fields.',
        );
      }
    }
    if (event.eventType === 'gate-passed') {
      const requiredPaths = requiredArtifactsForGate(
        event.gateId,
        event.implementationHash,
      );
      requireExactArtifactPaths(event, eventPath, requiredPaths);
      if (
        gateIndex !== nextGateIndex ||
        (openFailure && openFailure !== event.gateId) ||
        (event.gateId === 'G7' && openPreDiffFailures.size > 0)
      ) {
        addDiagnostic(
          diagnostics,
          index === g8CandidateIndex ? 'evidence.preflight-state' : 'evidence.gate-order',
          `${eventPath}.gateId`,
          index === g8CandidateIndex
            ? 'G8 preflight requires the physical evidence log to leave exactly G8 open.'
            : event.gateId === 'G7' && openPreDiffFailures.size > 0
              ? `G7 cannot pass while pre-diff failures remain open for: ${[...openPreDiffFailures].join(', ')}.`
            : `gate-passed must close ${gateOrder[nextGateIndex] ?? 'no further gate'} next.`,
        );
      } else {
        for (const requiredPath of requiredPaths) {
          if (!artifactPaths.has(requiredPath)) {
            addDiagnostic(
              diagnostics,
              'evidence.gate-artifact',
              `${eventPath}.artifactHashes`,
              `${event.gateId} must hash ${requiredPath}.`,
            );
          } else if (
            requiredPath.includes('/checks/') &&
            artifactBuffers.get(requiredPath)?.toString('utf8').trim().length === 0
          ) {
            addDiagnostic(
              diagnostics,
              'evidence.empty-artifact',
              `${eventPath}.artifactHashes`,
              `Recorded check output is empty: ${requiredPath}.`,
            );
          }
        }
        if (event.gateId === 'G0') {
          const compatibilityPath = `artifacts/visual/${task.taskId}/compatibility.md`;
          const compatibilitySource = await validateMarkdownRecord(
            projectRoot,
            compatibilityPath,
            'compatibility.content',
            200,
            [task.taskId, 'STOP'],
            diagnostics,
          );
          validateCompatibilityMarkdown({
            source: compatibilitySource,
            task,
            diagnostics,
            path: compatibilityPath,
          });
        }
        if (event.gateId === 'G3') {
          const preCodePath = `artifacts/visual/${task.taskId}/pre-code-evidence.md`;
          const preCodeSource = await validateMarkdownRecord(
            projectRoot,
            preCodePath,
            'pre-code.content',
            500,
            [
              task.taskId,
              'task-contract.json',
              'capture-contract.json',
              'design-context-manifest.json',
              'source-manifest.json',
              'fileKey',
              'nodeId',
            ],
            diagnostics,
          );
          validatePreCodeMarkdown({
            source: preCodeSource,
            task,
            capture,
            diagnostics,
            path: preCodePath,
          });
        }
        if (event.gateId === 'G8') {
          const finalReportPath = `artifacts/visual/${task.taskId}/final-report.md`;
          const finalReportSource = await validateMarkdownRecord(
            projectRoot,
            finalReportPath,
            'final-report.content',
            500,
            [
              task.taskId,
              'verification-record.json',
              'implementationHash',
              implementationHash,
              ...task.acceptance.qualityGates,
              ...task.viewports.map(({ id }) => id),
              ...task.states.map(({ id }) => id),
            ],
            diagnostics,
          );
          validateFinalReportMarkdown({
            source: finalReportSource,
            task,
            capture,
            implementationHash,
            captureContractHash,
            designContextManifest,
            sourceManifest,
            implementationManifest,
            verificationRecord,
            recordHashes,
            environmentFingerprint: environmentFingerprint(capture.cases?.[0]?.environment),
            evidenceEvents: events.slice(0, index),
            currentSequence: event.sequence,
            finalResults,
            diagnostics,
            path: finalReportPath,
          });
        }
        const expectedQuality =
          event.gateId === 'G5'
            ? ['Q1', 'Q2', 'Q3', 'Q4']
            : event.gateId === 'G7'
              ? ['Q5', 'Q6']
              : [];
        const expectedChecks =
          event.gateId === 'G6'
            ? task.acceptance.projectChecks.map(({ id }) => id)
            : event.gateId === 'G7'
              ? task.acceptance.browserChecks.map(({ id }) => id)
              : [];
        if (!sameOrderedValues(event.qualityGates, expectedQuality)) {
          addDiagnostic(
            diagnostics,
            'evidence.quality-gates',
            `${eventPath}.qualityGates`,
            `${event.gateId} qualityGates do not match the required ordered checks.`,
          );
        }
        if (!sameOrderedValues(event.checkIds, expectedChecks)) {
          addDiagnostic(
            diagnostics,
            'evidence.check-ids',
            `${eventPath}.checkIds`,
            `${event.gateId} checkIds do not match the task contract.`,
          );
        }
        if (event.gateId === 'G4' && validImplementationHash) {
          await validateLoggedImplementationSnapshot(
            projectRoot,
            task,
            event.implementationHash,
            taskContractHash,
            `${eventPath}.artifactHashes`,
            diagnostics,
          );
        }
        if (event.gateId === 'G7' && validImplementationHash) {
          const versionRoot = implementationArtifactRoot(task.taskId, event.implementationHash);
          for (const captureCase of (capture.cases ?? []).filter(
            ({ evidenceMode }) => evidenceMode !== 'visual-reference',
          )) {
            const snapshotPath = `${versionRoot}/cases/${captureCase.caseId}/evidence.json`;
            const snapshotBuffer = await validateBrowserEvidenceArtifact(
              projectRoot,
              snapshotPath,
              task,
              captureCase,
              event.implementationHash,
              captureContractHash,
              `${eventPath}.artifactHashes`,
              diagnostics,
            );
            if (event.implementationHash === implementationHash) {
              const currentBuffer = await readArtifact(
                projectRoot,
                captureCase.evidencePath,
                '$.evidencePath',
                diagnostics,
              );
              if (snapshotBuffer && currentBuffer && !snapshotBuffer.equals(currentBuffer)) {
                addDiagnostic(
                  diagnostics,
                  'no-reference.snapshot',
                  snapshotPath,
                  'Current browser evidence must match its immutable versioned copy.',
                );
              }
            }
          }
          if (
            (capture.cases ?? []).some(
              ({ evidenceMode }) => evidenceMode === 'visual-reference',
            ) &&
            !validatedConformanceHashes.has(event.implementationHash)
          ) {
            await validateConformance(
              projectRoot,
              task,
              event.implementationHash,
              captureContractHash,
              diagnostics,
            );
            validatedConformanceHashes.add(event.implementationHash);
          }
        }
        nextGateIndex += 1;
        openFailure = undefined;
      }
    } else if (event.eventType === 'gate-failed') {
      const failurePath = canonicalFailurePath(task.taskId, event);
      requireExactArtifactPaths(event, eventPath, [failurePath]);
      await validateFailureRecord(
        projectRoot,
        task,
        event,
        failurePath,
        `${eventPath}.artifactHashes`,
        diagnostics,
      );
      if (gateIndex !== nextGateIndex) {
        addDiagnostic(
          diagnostics,
          'evidence.gate-order',
          `${eventPath}.gateId`,
          'gate-failed must identify the next open gate.',
        );
      } else {
        openFailure = event.gateId;
      }
      if (!sameOrderedValues(event.qualityGates, []) || !sameOrderedValues(event.checkIds, [])) {
        addDiagnostic(
          diagnostics,
          'evidence.event-fields',
          eventPath,
          'gate-failed requires empty qualityGates and checkIds.',
        );
      }
    } else if (event.eventType === 'implementation-changed') {
      const changedRoot = implementationArtifactRoot(task.taskId, event.implementationHash);
      const changedSnapshotPath = changedRoot
        ? `${changedRoot}/implementation-manifest.json`
        : undefined;
      requireExactArtifactPaths(
        event,
        eventPath,
        changedSnapshotPath ? [changedSnapshotPath] : [],
      );
      if (
        event.gateId !== 'G4' ||
        nextGateIndex < 5 ||
        nextGateIndex >= gateOrder.length ||
        latestImplementationHash === null
      ) {
        addDiagnostic(
          diagnostics,
          'evidence.gate-order',
          `${eventPath}.gateId`,
          'implementation-changed is allowed after a successful G4 and before G8, then returns the process to G4.',
        );
      } else {
        nextGateIndex = 4;
        openFailure = undefined;
        openPreDiffFailures.clear();
      }
      if (!sameOrderedValues(event.qualityGates, []) || !sameOrderedValues(event.checkIds, [])) {
        addDiagnostic(
          diagnostics,
          'evidence.event-fields',
          eventPath,
          'implementation-changed requires empty qualityGates and checkIds.',
        );
      }
      if (validImplementationHash) {
        const versionRoot = implementationArtifactRoot(task.taskId, event.implementationHash);
        const snapshotPath = `${versionRoot}/implementation-manifest.json`;
        if (!artifactPaths.has(snapshotPath)) {
          addDiagnostic(
            diagnostics,
            'evidence.gate-artifact',
            `${eventPath}.artifactHashes`,
            `implementation-changed must hash ${snapshotPath}.`,
          );
        }
        await validateLoggedImplementationSnapshot(
          projectRoot,
          task,
          event.implementationHash,
          taskContractHash,
          `${eventPath}.artifactHashes`,
          diagnostics,
        );
      }
    } else if (event.eventType === 'iteration-completed') {
      if (event.gateId !== 'G7' || nextGateIndex !== 7) {
        addDiagnostic(
          diagnostics,
          'evidence.gate-order',
          `${eventPath}.gateId`,
          'iteration-completed is allowed only while G7 is open.',
        );
      }
      if (
        typeof event.caseId !== 'string' ||
        !visualCaseIds.has(event.caseId) ||
        !Number.isInteger(event.iteration) ||
        typeof event.evidencePath !== 'string' ||
        !sameOrderedValues(event.qualityGates, []) ||
        !sameOrderedValues(event.checkIds, [])
      ) {
        addDiagnostic(
          diagnostics,
          'evidence.event-fields',
          eventPath,
          'iteration-completed requires a visual-reference caseId, iteration, evidencePath, and empty qualityGates and checkIds.',
        );
      }
      if (visualCaseIds.has(event.caseId)) openPreDiffFailures.delete(event.caseId);
    } else if (event.eventType === 'failed-pre-diff') {
      const failurePath = canonicalFailurePath(task.taskId, event);
      requireExactArtifactPaths(event, eventPath, [failurePath]);
      if (event.gateId !== 'G7' || nextGateIndex !== 7) {
        addDiagnostic(
          diagnostics,
          'evidence.gate-order',
          `${eventPath}.gateId`,
          'failed-pre-diff is allowed only while G7 is open.',
        );
      }
      if (
        typeof event.caseId !== 'string' ||
        !visualCaseIds.has(event.caseId) ||
        hasOwn(event, 'iteration') ||
        event.evidencePath !== failurePath ||
        !sameOrderedValues(event.qualityGates, []) ||
        !sameOrderedValues(event.checkIds, [])
      ) {
        addDiagnostic(
          diagnostics,
          'evidence.event-fields',
          eventPath,
          'failed-pre-diff requires a visual-reference caseId, a hashed evidencePath, no iteration, and empty qualityGates and checkIds.',
        );
      }
      await validateFailureRecord(
        projectRoot,
        task,
        event,
        failurePath,
        `${eventPath}.evidencePath`,
        diagnostics,
      );
      if (visualCaseIds.has(event.caseId)) openPreDiffFailures.add(event.caseId);
    }
    if (event.eventType === 'implementation-changed' && validImplementationHash) {
      if (event.implementationHash === latestImplementationHash) {
        addDiagnostic(
          diagnostics,
          'evidence.implementation-hash',
          `$[${index}].implementationHash`,
          'implementation-changed must record a new implementation hash.',
        );
      } else {
        latestImplementationHash = event.implementationHash;
      }
    } else if (event.eventType === 'gate-passed' && event.gateId === 'G4') {
      if (validImplementationHash && latestImplementationHash === null) {
        latestImplementationHash = event.implementationHash;
      } else if (
        validImplementationHash &&
        event.implementationHash !== latestImplementationHash
      ) {
        addDiagnostic(
          diagnostics,
          'evidence.implementation-hash',
          `${eventPath}.implementationHash`,
          'G4 must use the implementation hash introduced by the current implementation.',
        );
      }
    } else if (
      !preImplementationEvent &&
      validImplementationHash &&
      latestImplementationHash !== null &&
      event.implementationHash !== latestImplementationHash
    ) {
      addDiagnostic(
        diagnostics,
        'evidence.implementation-hash',
        `$[${index}].implementationHash`,
        'Only implementation-changed may alter the current implementation hash.',
      );
    }
  }
  if (
    nextGateIndex !== gateOrder.length ||
    openFailure !== undefined ||
    openPreDiffFailures.size > 0
  ) {
    addDiagnostic(
      diagnostics,
      'evidence.incomplete',
      '$',
      `Evidence log must finish with successful G0 through G8; next gate is ${gateOrder[nextGateIndex] ?? 'none'}.`,
    );
  }
  if (implementationHash !== undefined && latestImplementationHash !== implementationHash) {
    addDiagnostic(
      diagnostics,
      'evidence.current-implementation',
      '$',
      'The latest evidence event must use the current implementation manifest rootHash.',
    );
  }

  const visualCases = new Map(
    (capture.cases ?? [])
      .filter((captureCase) => captureCase.evidenceMode === 'visual-reference')
      .map((captureCase) => [captureCase.caseId, captureCase]),
  );
  const completedIterations = new Set();
  const invalidEventCases = new Set();
  const highestCompletedIterationByCase = new Map();
  const latestCompletedHashByCase = new Map();
  for (const [index, event] of events.entries()) {
    if (!isObject(event) || event.eventType !== 'iteration-completed') continue;
    const captureCase = visualCases.get(event.caseId);
    const iterationName = Number.isInteger(event.iteration)
      ? String(event.iteration).padStart(3, '0')
      : undefined;
    const iterationPath = captureCase
      ? path.resolve(
          projectRoot,
          `artifacts/visual/${task.taskId}/${event.caseId}/iterations/${iterationName}`,
        )
      : undefined;
    if (!captureCase || !iterationPath || !(await pathExists(iterationPath))) {
      if (typeof event.caseId === 'string') invalidEventCases.add(event.caseId);
      addDiagnostic(
        diagnostics,
        'evidence.iteration-link',
        `$[${index}].iteration`,
        'Iteration event must link to an existing visual-reference bundle.',
      );
    } else {
      const key = `${event.caseId}\0${iterationName}`;
      if (completedIterations.has(key)) {
        addDiagnostic(
          diagnostics,
          'evidence.iteration-link',
          `$[${index}].iteration`,
          'Each iteration bundle must have exactly one completion event.',
        );
      }
      completedIterations.add(key);
      const priorIteration = highestCompletedIterationByCase.get(event.caseId) ?? 0;
      if (event.iteration <= priorIteration) {
        addDiagnostic(
          diagnostics,
          'evidence.iteration-order',
          `$[${index}].iteration`,
          'Iteration completion events for each case must increase strictly.',
        );
      }
      if (event.iteration > priorIteration) {
        highestCompletedIterationByCase.set(event.caseId, event.iteration);
        latestCompletedHashByCase.set(event.caseId, event.implementationHash);
      }
      const expectedEvidencePath =
        `artifacts/visual/${task.taskId}/${event.caseId}/iterations/${iterationName}/result.json`;
      if (event.evidencePath !== expectedEvidencePath) {
        addDiagnostic(
          diagnostics,
          'evidence.iteration-link',
          `$[${index}].evidencePath`,
          'Iteration event evidencePath must identify its canonical result.json.',
        );
      }
      const expectedBundlePaths = bundleFiles.map(
        (fileName) =>
          `artifacts/visual/${task.taskId}/${event.caseId}/iterations/${iterationName}/${fileName}`,
      );
      const expectedIterationArtifactPaths = [...expectedBundlePaths];
      for (const expectedPath of expectedBundlePaths) {
        const matchingHashes = (
          Array.isArray(event.artifactHashes) ? event.artifactHashes : []
        ).filter((artifact) => artifact?.path === expectedPath);
        if (matchingHashes.length !== 1) {
          addDiagnostic(
            diagnostics,
            'evidence.iteration-hash',
            `$[${index}].artifactHashes`,
            `Iteration event must contain exactly one hash for ${expectedPath}.`,
          );
        }
      }
      try {
        const result = await loadProjectJson(projectRoot, expectedEvidencePath);
        if (result.implementationHash !== event.implementationHash) {
          addDiagnostic(
            diagnostics,
            'evidence.iteration-hash',
            `$[${index}].implementationHash`,
            'Iteration result and completion event must identify the same implementation.',
          );
        }
        if (result.status === 'strict-visual-accepted' && isObject(result.approval)) {
          expectedIterationArtifactPaths.push(result.approval.path);
          const approvalHashes = (
            Array.isArray(event.artifactHashes) ? event.artifactHashes : []
          ).filter(
            (artifact) =>
              artifact?.path === result.approval.path &&
              artifact?.hash === result.approval.checksum,
          );
          if (approvalHashes.length !== 1) {
            addDiagnostic(
              diagnostics,
              'evidence.iteration-approval',
              `$[${index}].artifactHashes`,
              'An accepted nonzero difference requires exactly one matching approval hash in its iteration event.',
            );
          }
        }
      } catch {
        // Bundle validation owns missing or malformed result diagnostics.
      }
      requireExactArtifactPaths(
        event,
        `$[${index}]`,
        expectedIterationArtifactPaths,
      );
    }
  }

  for (const [caseId] of visualCases) {
    if (invalidEventCases.has(caseId)) continue;
    const iterationsRoot = `artifacts/visual/${task.taskId}/${caseId}/iterations`;
    let entries;
    try {
      entries = await readArtifactDirectory(
        projectRoot,
        iterationsRoot,
        iterationsRoot,
        diagnostics,
      );
      if (!entries) throw new Error('missing iterations root');
    } catch {
      continue;
    }
    const names = entries
      .filter((entry) => entry.isDirectory() && /^\d{3}$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort(compareUtf8Text);
    if (
      names.some((name, index) => name !== String(index + 1).padStart(3, '0'))
    ) {
      continue;
    }
    for (const name of names) {
      if (!completedIterations.has(`${caseId}\0${name}`)) {
        addDiagnostic(
          diagnostics,
          'evidence.iteration-link',
          `artifacts/visual/${task.taskId}/${caseId}/iterations/${name}`,
          'Every iteration bundle must have exactly one completion event.',
        );
      }
    }
    if (
      implementationHash !== undefined &&
      latestCompletedHashByCase.get(caseId) !== implementationHash
    ) {
      addDiagnostic(
        diagnostics,
        'evidence.stale-iteration',
        `artifacts/visual/${task.taskId}/${caseId}`,
        'The latest completed iteration must use the current implementation hash.',
      );
    }
    const highestDirectoryIteration = Number.parseInt(names.at(-1), 10);
    if (highestCompletedIterationByCase.get(caseId) !== highestDirectoryIteration) {
      addDiagnostic(
        diagnostics,
        'evidence.stale-iteration',
        `artifacts/visual/${task.taskId}/${caseId}`,
        'The highest iteration directory must be the latest completed iteration event.',
      );
    }
  }
  return { g8Candidate, allowedArtifactPaths };
}

async function validateVisualEvidenceInternal(
  { taskPath, capturePath, projectRoot },
  { preflightG8 = false } = {},
) {
  if (
    typeof taskPath !== 'string' ||
    typeof capturePath !== 'string' ||
    typeof projectRoot !== 'string'
  ) {
    throw new VisualInputError('input.arguments', 'Task, capture, and project root are required.');
  }

  let canonicalRoot;
  try {
    canonicalRoot = await realpath(projectRoot);
  } catch {
    throw new VisualInputError('input.project-root', 'Project root is unreadable.');
  }

  const [task, capture] = await Promise.all([
    loadProjectJson(canonicalRoot, taskPath),
    loadProjectJson(canonicalRoot, capturePath),
  ]);
  const diagnostics = [...validateTaskContract(task)];
  const captureShapeValid = addCaptureSchemaDiagnostics(capture, diagnostics);
  if (diagnostics.length > 0 || !captureShapeValid) return { diagnostics };
  await validateCanonicalContractRecords(canonicalRoot, task, capture, diagnostics);
  if (diagnostics.length > 0) return { diagnostics };
  const captureContractBuffer = await readArtifact(
    canonicalRoot,
    `artifacts/visual/${task.taskId}/capture-contract.json`,
    '$.captureContract',
    diagnostics,
  );
  const captureContractHash = captureContractBuffer
    ? checksum(captureContractBuffer)
    : undefined;
  validateCaptureIdentity(task, capture, diagnostics);
  validateCaptureModesAndPaths(task, capture, canonicalRoot, diagnostics);
  if (diagnostics.length > 0) return { diagnostics };
  let sourceManifest;
  try {
    sourceManifest = await loadSourceManifest(canonicalRoot, task);
  } catch {
    addDiagnostic(
      diagnostics,
      'source.manifest-missing',
      '$',
      'Source manifest is missing or unreadable.',
    );
  }
  const designContextManifest = await validateDesignContextManifest(
    canonicalRoot,
    task,
    diagnostics,
  );
  const implementation = await validateImplementationManifest(
    canonicalRoot,
    task,
    diagnostics,
  );
  const implementationHash = implementation?.rootHash;
  if (sourceManifest) {
    await validateSourceManifest(
      canonicalRoot,
      task,
      capture,
      sourceManifest,
      designContextManifest,
      implementation?.manifest,
      diagnostics,
    );
  }
  const verificationRecord = await validateVerificationRecord(
    canonicalRoot,
    task,
    implementationHash,
    diagnostics,
  );
  const recordPaths = {
    taskContract: `artifacts/visual/${task.taskId}/task-contract.json`,
    designContext: `artifacts/visual/${task.taskId}/design-context-manifest.json`,
    sourceManifest: `artifacts/visual/${task.taskId}/source-manifest.json`,
    verificationRecord: `artifacts/visual/${task.taskId}/verification-record.json`,
  };
  const recordHashes = {};
  for (const [id, relativePath] of Object.entries(recordPaths)) {
    const recordBuffer = await readArtifact(
      canonicalRoot,
      relativePath,
      `$.recordHashes.${id}`,
      diagnostics,
    );
    if (recordBuffer) recordHashes[id] = checksum(recordBuffer);
  }
  if ((capture.cases ?? []).some(({ evidenceMode }) => evidenceMode === 'visual-reference')) {
    await validateConformance(
      canonicalRoot,
      task,
      implementationHash,
      captureContractHash,
      diagnostics,
    );
  }
  const finalResults = await validateBundles(
    canonicalRoot,
    task,
    capture,
    implementationHash,
    captureContractHash,
    diagnostics,
  );
  const taskRoot = `artifacts/visual/${task.taskId}`;
  const allowedArtifactPaths = new Set(
    [
      'compatibility.md',
      'task-contract.json',
      'design-context-manifest.json',
      'source-manifest.json',
      'capture-contract.json',
      'pre-code-evidence.md',
      'implementation-manifest.json',
      'verification-record.json',
      'final-report.md',
      'evidence-log.jsonl',
    ].map((fileName) => `${taskRoot}/${fileName}`),
  );
  for (const request of designContextManifest?.requests ?? []) {
    allowedArtifactPaths.add(request.path);
  }
  for (const source of sourceManifest?.sources ?? []) {
    allowedArtifactPaths.add(source.path);
    allowedArtifactPaths.add(source.origin?.evidencePath);
    for (const derivation of source.derivations ?? []) {
      allowedArtifactPaths.add(derivation.outputPath);
    }
  }
  for (const captureCase of capture.cases ?? []) {
    if (captureCase.evidenceMode === 'visual-reference') {
      allowedArtifactPaths.add(captureCase.reference?.path);
      allowedArtifactPaths.add(
        `tests/visual/references/figma/${task.taskId}/${captureCase.caseId}.png`,
      );
    } else {
      allowedArtifactPaths.add(captureCase.evidencePath);
    }
  }
  allowedArtifactPaths.delete(undefined);
  const evidenceValidation = await validateEvidenceLog(
    canonicalRoot,
    task,
    capture,
    implementationHash,
    diagnostics,
    {
      preflightG8,
      verificationRecord,
      finalResults,
      captureContractHash,
      designContextManifest,
      sourceManifest,
      implementationManifest: implementation?.manifest,
      recordHashes,
      taskContractHash: recordHashes.taskContract,
      allowedArtifactPaths,
    },
  );
  await validateClosedArtifactInventory(
    canonicalRoot,
    task.taskId,
    evidenceValidation?.allowedArtifactPaths ?? allowedArtifactPaths,
    diagnostics,
  );
  return { diagnostics, g8Candidate: evidenceValidation?.g8Candidate };
}

export async function validateVisualEvidence(inputs) {
  const { diagnostics } = await validateVisualEvidenceInternal(inputs);
  return diagnostics;
}

export async function validateG8Preflight(inputs) {
  return validateVisualEvidenceInternal(inputs, { preflightG8: true });
}

function oneLineDiagnostic({ id, path: diagnosticPath, message }) {
  return `${id} ${diagnosticPath} ${message}`.replace(/[\r\n\u2028\u2029]+/gu, ' ');
}

function writeInputError(stderr, id) {
  stderr.write(`${id}\n`);
  return 2;
}

function parseCliArguments(argv) {
  if (!Array.isArray(argv)) return undefined;
  const valueFlags = new Set(['--task', '--capture', '--project-root']);
  const values = new Map();
  let preflightG8 = false;
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--preflight-g8') {
      if (preflightG8) return undefined;
      preflightG8 = true;
      continue;
    }
    const value = argv[index + 1];
    if (
      !valueFlags.has(flag) ||
      values.has(flag) ||
      typeof value !== 'string' ||
      value.length === 0 ||
      value.startsWith('--')
    ) {
      return undefined;
    }
    values.set(flag, value);
    index += 1;
  }
  if (values.size !== valueFlags.size) return undefined;
  return {
    taskPath: values.get('--task'),
    capturePath: values.get('--capture'),
    projectRoot: values.get('--project-root'),
    preflightG8,
  };
}

export async function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const inputs = parseCliArguments(argv);
  if (!inputs) return writeInputError(stderr, 'input.arguments');

  let diagnostics;
  let g8Candidate;
  try {
    if (inputs.preflightG8) {
      ({ diagnostics, g8Candidate } = await validateG8Preflight(inputs));
    } else {
      diagnostics = await validateVisualEvidence(inputs);
    }
  } catch (error) {
    return writeInputError(
      stderr,
      error instanceof VisualInputError ? error.id : 'input.internal',
    );
  }
  if (diagnostics.length === 0) {
    if (inputs.preflightG8) stdout.write(`${JSON.stringify(g8Candidate)}\n`);
    return 0;
  }
  stdout.write(`${diagnostics.map(oneLineDiagnostic).join('\n')}\n`);
  return 1;
}

async function isDirectInvocation() {
  if (!process.argv[1]) return false;
  try {
    const [invokedPath, modulePath] = await Promise.all([
      realpath(path.resolve(process.argv[1])),
      realpath(fileURLToPath(import.meta.url)),
    ]);
    return invokedPath === modulePath;
  } catch {
    return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  }
}

if (await isDirectInvocation()) {
  process.exitCode = await runCli();
}

export { VisualInputError };
