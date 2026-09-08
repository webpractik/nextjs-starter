import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { loadJsonDocument, validateSchema } from '../lib/schema-validator.mjs';
import { validateTaskContract } from './validate-task-contract-v1.mjs';

const captureContractSchema = await loadJsonDocument(
  new URL('./schemas/capture-contract.schema.json', import.meta.url),
);
const evidenceEventSchema = await loadJsonDocument(
  new URL('./schemas/evidence-event.schema.json', import.meta.url),
);
const rawSchema = await loadJsonDocument(
  new URL('./schemas/visual-compare-raw.schema.json', import.meta.url),
);
const resultSchema = await loadJsonDocument(
  new URL('./schemas/visual-result.schema.json', import.meta.url),
);

const analysisCategories = [
  'geometry',
  'spacing',
  'typography',
  'colors',
  'borders and shadows',
  'assets',
  'responsive behavior',
  'missing or extra elements',
];
const protectedResidualCategories = new Set([
  'assets',
  'responsive behavior',
  'missing or extra elements',
]);
const bundleFiles = [
  'actual.png',
  'reference.png',
  'diff.png',
  'overlay.png',
  'raw.json',
  'analysis.md',
  'result.json',
];
const sourceManifestFields = new Set(['schemaVersion', 'taskId', 'sources']);
const sourceFields = new Set([
  'sourceId',
  'nodeId',
  'kind',
  'path',
  'checksum',
  'logicalDimensions',
  'pixelDimensions',
  'rasterization',
]);
const rasterizationFields = new Set([
  'name',
  'version',
  'arguments',
  'outputPath',
  'outputChecksum',
  'pixelDimensions',
]);
const conformanceFields = new Set([
  'schemaVersion',
  'profile',
  'pixelThreshold',
  'antialiasPolicy',
  'fixtures',
  'expected',
  'actual',
  'passed',
]);
const conformanceFixtureFields = new Set(['reference', 'actual']);
const conformanceMetricFields = new Set([
  'differentPixels',
  'totalPixels',
  'differenceRatio',
]);
const checksumPattern = /^sha256:[a-f0-9]{64}$/u;
const sourceIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const legacyArtifactRoot = ['artifacts', 'figma'].join('/');

class VisualInputError extends Error {
  constructor(id, message) {
    super(message);
    this.name = 'VisualInputError';
    this.id = id;
  }
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

function addUnknownFieldDiagnostics(value, fields, prefix, diagnostics) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!fields.has(key)) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        prefix === '$' ? `$.${key}` : `${prefix}.${key}`,
        'Source manifest contains an unknown field.',
      );
    }
  }
}

function validLogicalDimensions(value) {
  return (
    isObject(value) &&
    Object.keys(value).length === 2 &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    Number.isFinite(value.height) &&
    value.height > 0
  );
}

function validPixelDimensions(value) {
  return (
    isObject(value) &&
    Object.keys(value).length === 2 &&
    Number.isInteger(value.width) &&
    value.width > 0 &&
    Number.isInteger(value.height) &&
    value.height > 0
  );
}

function environmentFingerprint(environment) {
  if (!isObject(environment)) return undefined;
  const fontHashes = [...(environment.fontHashes ?? [])]
    .map(({ family, hash }) => ({ family, hash }))
    .sort((left, right) =>
      `${left.family}\0${left.hash}`.localeCompare(`${right.family}\0${right.hash}`),
    );
  return JSON.stringify({
    browser: environment.browser,
    os: environment.os,
    container: environment.container,
    headless: environment.headless,
    fontHashes,
  });
}

function normalizeNodeId(value) {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d+)(?::|-)(\d+)$/u.exec(value);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

function checksum(buffer) {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
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

function pngDimensions(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) return undefined;
  const signature = Buffer.from('89504e470d0a1a0a', 'hex');
  if (!buffer.subarray(0, 8).equals(signature)) return undefined;
  if (!buffer.subarray(12, 16).equals(Buffer.from('49484452', 'hex'))) return undefined;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return width > 0 && height > 0 ? { width, height } : undefined;
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

function closeEnough(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(right)) * 8;
  return Math.abs(left - right) <= tolerance;
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
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch {
    addDiagnostic(diagnostics, id, diagnosticPath, 'JSON artifact is malformed.');
    return undefined;
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
  const taskViewports = new Set(
    (task.viewports ?? []).map(({ width, height, dpr }) => JSON.stringify([width, height, dpr])),
  );
  const taskStates = new Set((task.states ?? []).map(({ id }) => id));
  const capturedViewports = new Set();
  const capturedStates = new Set();
  capture.cases.forEach((captureCase, index) => {
    if (!isObject(captureCase)) return;
    const prefix = `$.cases[${index}]`;
    const checks = [
      ['taskId', captureCase.taskId, task.taskId],
      ['nodeId', normalizeNodeId(captureCase.nodeId), normalizeNodeId(task.source?.nodeId)],
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
    if (
      viewportKey !== undefined &&
      ['visual-reference', 'responsive-only'].includes(captureCase.evidenceMode)
    ) {
      capturedViewports.add(viewportKey);
    }
    if (typeof captureCase.state === 'string' && !taskStates.has(captureCase.state)) {
      addDiagnostic(
        diagnostics,
        'capture.state',
        `${prefix}.state`,
        'Capture state must be declared by the final task contract.',
      );
    }
    if (
      typeof captureCase.state === 'string' &&
      ['visual-reference', 'behavior-only'].includes(captureCase.evidenceMode)
    ) {
      capturedStates.add(captureCase.state);
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
  });

  (task.viewports ?? []).forEach(({ width, height, dpr }, index) => {
    const viewportKey = JSON.stringify([width, height, dpr]);
    if (!capturedViewports.has(viewportKey)) {
      addDiagnostic(
        diagnostics,
        'capture.viewport-missing',
        `$.viewports[${index}]`,
        'Every final task viewport requires capture evidence.',
      );
    }
  });
  (task.states ?? []).forEach((state, index) => {
    if (state.applicability === 'required' && !capturedStates.has(state.id)) {
      addDiagnostic(
        diagnostics,
        'capture.state-missing',
        `$.states[${index}]`,
        'Every required task state requires capture evidence.',
      );
    }
  });
}

function validateCaptureModesAndPaths(task, capture, projectRoot, diagnostics) {
  if (Array.isArray(capture?.cases)) {
    for (const [index, captureCase] of capture.cases.entries()) {
      if (!isObject(captureCase)) continue;
      const prefix = `$.cases[${index}]`;
      const visualMode = captureCase.evidenceMode === 'visual-reference';
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
      if (visualMode && hasOwn(captureCase, 'evidencePath')) {
        addDiagnostic(
          diagnostics,
          'capture.reference-mode',
          `${prefix}.evidencePath`,
          'Visual-reference cases must not declare evidencePath.',
        );
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
      if (hasOwn(captureCase, 'evidencePath')) {
        const safeEvidencePath = containedPath(
          projectRoot,
          captureCase.evidencePath,
          `${prefix}.evidencePath`,
          diagnostics,
        );
        const expectedEvidence = `artifacts/visual/${task.taskId}/${captureCase.caseId}/evidence.md`;
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

async function validateSourceManifest(projectRoot, task, capture, manifest, diagnostics) {
  if (!isObject(manifest)) {
    addDiagnostic(diagnostics, 'source.manifest', '$', 'Source manifest must be an object.');
    return;
  }
  addUnknownFieldDiagnostics(manifest, sourceManifestFields, '$', diagnostics);
  if (manifest.schemaVersion !== 1) {
    addDiagnostic(
      diagnostics,
      'source.manifest',
      '$.schemaVersion',
      'Source manifest schemaVersion must equal 1.',
    );
  }
  if (manifest.taskId !== task.taskId) {
    addDiagnostic(
      diagnostics,
      'source.manifest',
      '$.taskId',
      'Source manifest taskId must match the task contract.',
    );
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    addDiagnostic(
      diagnostics,
      'source.manifest',
      '$.sources',
      'Source manifest requires a non-empty sources array.',
    );
    return;
  }

  const visualReferencesBySource = new Map();
  for (const captureCase of capture.cases ?? []) {
    if (captureCase?.evidenceMode !== 'visual-reference' || !isObject(captureCase.reference)) {
      continue;
    }
    const references = visualReferencesBySource.get(captureCase.reference.sourceId) ?? [];
    references.push({ captureCase, reference: captureCase.reference });
    visualReferencesBySource.set(captureCase.reference.sourceId, references);
  }

  const sourcesById = new Map();
  for (const [index, source] of manifest.sources.entries()) {
    const prefix = `$.sources[${index}]`;
    if (!isObject(source)) {
      addDiagnostic(diagnostics, 'source.manifest', prefix, 'Source entry must be an object.');
      continue;
    }
    addUnknownFieldDiagnostics(source, sourceFields, prefix, diagnostics);

    const sourceIdValid =
      typeof source.sourceId === 'string' && sourceIdPattern.test(source.sourceId);
    if (!sourceIdValid) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.sourceId`,
        'Source ID must be a collision-safe kebab-case identifier.',
      );
    } else if (sourcesById.has(source.sourceId)) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.sourceId`,
        'Source IDs must be unique.',
      );
    } else {
      sourcesById.set(source.sourceId, source);
    }

    if (
      normalizeNodeId(source.nodeId) === undefined ||
      normalizeNodeId(source.nodeId) !== normalizeNodeId(task.source?.nodeId)
    ) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.nodeId`,
        'Source nodeId must match the task identity anchor.',
      );
    }

    const kindValid = new Set(['png', 'svg', 'pdf']).has(source.kind);
    if (!kindValid) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.kind`,
        'Source kind must be png, svg, or pdf.',
      );
    }
    const expectedSourcePath =
      sourceIdValid && kindValid
        ? `artifacts/visual/${task.taskId}/sources/${source.sourceId}.${source.kind}`
        : undefined;
    if (expectedSourcePath && source.path !== expectedSourcePath) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.path`,
        `Source path must be ${expectedSourcePath}.`,
      );
    }
    if (!checksumPattern.test(source.checksum ?? '')) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.checksum`,
        'Source checksum must be a lowercase SHA-256 digest.',
      );
    }
    if (!validLogicalDimensions(source.logicalDimensions)) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.logicalDimensions`,
        'Logical dimensions must contain positive finite width and height.',
      );
    }

    const diagnosticPath = `${prefix}.path`;
    const sourceBuffer = await readArtifact(projectRoot, source.path, diagnosticPath, diagnostics);
    if (
      sourceBuffer &&
      checksumPattern.test(source.checksum ?? '') &&
      source.checksum !== checksum(sourceBuffer)
    ) {
      addDiagnostic(
        diagnostics,
        'source.checksum',
        `${prefix}.checksum`,
        'Source checksum must match the stored file.',
      );
    }

    if (source.kind === 'png') {
      if (!validPixelDimensions(source.pixelDimensions)) {
        addDiagnostic(
          diagnostics,
          'source.manifest',
          `${prefix}.pixelDimensions`,
          'PNG sources require positive integer pixel dimensions.',
        );
      }
      if (source.rasterization !== null) {
        addDiagnostic(
          diagnostics,
          'source.rasterization',
          `${prefix}.rasterization`,
          'PNG sources require rasterization: null.',
        );
      }
      if (
        sourceBuffer &&
        (!pngDimensions(sourceBuffer) ||
          !sameDimensions(pngDimensions(sourceBuffer), source.pixelDimensions))
      ) {
        addDiagnostic(
          diagnostics,
          'source.dimensions',
          `${prefix}.pixelDimensions`,
          'PNG dimensions must match source provenance.',
        );
      }
      continue;
    }

    if (source.kind !== 'svg' && source.kind !== 'pdf') continue;
    if (source.pixelDimensions !== null) {
      addDiagnostic(
        diagnostics,
        'source.manifest',
        `${prefix}.pixelDimensions`,
        'SVG/PDF source pixelDimensions must be null before rasterization.',
      );
    }
    if (!isObject(source.rasterization)) {
      addDiagnostic(
        diagnostics,
        'source.rasterization',
        `${prefix}.rasterization`,
        'SVG/PDF sources require pinned deterministic rasterization.',
      );
      continue;
    }

    const rasterization = source.rasterization;
    const rasterPrefix = `${prefix}.rasterization`;
    addUnknownFieldDiagnostics(rasterization, rasterizationFields, rasterPrefix, diagnostics);
    const pinned =
      typeof rasterization.name === 'string' &&
      rasterization.name.trim().length > 0 &&
      typeof rasterization.version === 'string' &&
      rasterization.version.trim().length > 0 &&
      Array.isArray(rasterization.arguments) &&
      rasterization.arguments.every((argument) => typeof argument === 'string') &&
      validPixelDimensions(rasterization.pixelDimensions) &&
      checksumPattern.test(rasterization.outputChecksum ?? '');
    if (!pinned) {
      addDiagnostic(
        diagnostics,
        'source.rasterization',
        rasterPrefix,
        'Rasterization must pin tool, version, arguments, checksum, and pixel dimensions.',
      );
    }

    const references = visualReferencesBySource.get(source.sourceId) ?? [];
    const outputReference = references.find(
      ({ reference }) => reference.path === rasterization.outputPath,
    );
    if (!outputReference) {
      addDiagnostic(
        diagnostics,
        'source.rasterization',
        `${rasterPrefix}.outputPath`,
        'Rasterizer output must be a canonical case reference for this source.',
      );
    } else if (
      !sameDimensions(rasterization.pixelDimensions, outputReference.reference.dimensions)
    ) {
      addDiagnostic(
        diagnostics,
        'source.rasterization',
        `${rasterPrefix}.pixelDimensions`,
        'Rasterizer dimensions must match the case reference.',
      );
    }

    if (typeof rasterization.outputPath === 'string') {
      const outputBuffer = await readArtifact(
        projectRoot,
        rasterization.outputPath,
        `${rasterPrefix}.outputPath`,
        diagnostics,
      );
      if (
        outputBuffer &&
        checksumPattern.test(rasterization.outputChecksum ?? '') &&
        checksum(outputBuffer) !== rasterization.outputChecksum
      ) {
        addDiagnostic(
          diagnostics,
          'source.rasterization-checksum',
          `${rasterPrefix}.outputChecksum`,
          'Rasterizer output checksum must match the derived PNG.',
        );
      }
      if (
        outputBuffer &&
        !sameDimensions(pngDimensions(outputBuffer), rasterization.pixelDimensions)
      ) {
        addDiagnostic(
          diagnostics,
          'source.rasterization',
          `${rasterPrefix}.pixelDimensions`,
          'Rasterizer pixel dimensions must match the derived PNG.',
        );
      }
    }
  }

  if (!Array.isArray(capture?.cases)) return;
  for (const [index, captureCase] of capture.cases.entries()) {
    if (captureCase?.evidenceMode !== 'visual-reference' || !isObject(captureCase.reference)) {
      continue;
    }
    const prefix = `$.cases[${index}].reference`;
    const reference = captureCase.reference;
    if (reference.path !== `artifacts/visual/${task.taskId}/${captureCase.caseId}/reference.png`) {
      continue;
    }
    const referenceBuffer = await readArtifact(
      projectRoot,
      reference.path,
      `${prefix}.path`,
      diagnostics,
    );
    if (!referenceBuffer) continue;
    const referenceChecksum = checksum(referenceBuffer);
    if (reference.checksum !== referenceChecksum) {
      addDiagnostic(
        diagnostics,
        'reference.checksum',
        `${prefix}.checksum`,
        'Reference checksum must match reference.png.',
      );
    }
    const dimensions = pngDimensions(referenceBuffer);
    if (
      !dimensions ||
      !sameDimensions(dimensions, reference.dimensions)
    ) {
      addDiagnostic(
        diagnostics,
        'reference.dimensions',
        `${prefix}.dimensions`,
        'Reference dimensions must match the stored PNG pixel dimensions.',
      );
    }
    const source = sourcesById.get(reference.sourceId);
    if (!source) {
      addDiagnostic(
        diagnostics,
        'reference.source',
        `${prefix}.sourceId`,
        'Reference sourceId must resolve through source-manifest.json.',
      );
    }
    if (source?.kind === 'png') {
      const sourceBuffer = await readArtifact(
        projectRoot,
        source.path,
        `$.sources[${manifest.sources.indexOf(source)}].path`,
        diagnostics,
      );
      if (sourceBuffer && !sourceBuffer.equals(referenceBuffer)) {
        addDiagnostic(
          diagnostics,
          'reference.source-mismatch',
          `${prefix}.path`,
          'PNG fallback source and case reference must be byte-identical.',
        );
      }
    }

    const mirrorPath = `tests/visual/references/figma/${task.taskId}/${captureCase.caseId}.png`;
    const mirrorBuffer = await readArtifact(
      projectRoot,
      mirrorPath,
      `${prefix}.checksum`,
      diagnostics,
    );
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

async function validateConformance(projectRoot, task, diagnostics) {
  if (typeof task?.taskId !== 'string') return;
  let conformance;
  try {
    conformance = await loadProjectJson(
      projectRoot,
      `artifacts/visual/${task.taskId}/comparator-conformance.json`,
    );
  } catch {
    addDiagnostic(
      diagnostics,
      'conformance.missing',
      '$',
      'Comparator conformance record is missing or unreadable.',
    );
    return;
  }
  const closedObjects = [
    [conformance, conformanceFields, '$'],
    [conformance?.fixtures, conformanceFixtureFields, '$.fixtures'],
    [conformance?.expected, conformanceMetricFields, '$.expected'],
    [conformance?.actual, conformanceMetricFields, '$.actual'],
  ];
  for (const [value, allowedFields, prefix] of closedObjects) {
    if (!isObject(value)) continue;
    for (const key of Object.keys(value)) {
      if (!allowedFields.has(key)) {
        addDiagnostic(
          diagnostics,
          'conformance.contract',
          `${prefix}.${key}`,
          'Comparator conformance contains an unknown field.',
        );
      }
    }
  }
  const expectedReference = `artifacts/visual/${task.taskId}/conformance/reference.png`;
  const expectedActual = `artifacts/visual/${task.taskId}/conformance/actual.png`;
  const constantsValid =
    conformance?.schemaVersion === 1 &&
    conformance?.profile === 'rgba-exact-v1' &&
    conformance?.pixelThreshold === 0 &&
    conformance?.antialiasPolicy === 'count' &&
    conformance?.passed === true &&
    conformance?.fixtures?.reference === expectedReference &&
    conformance?.fixtures?.actual === expectedActual;
  if (!constantsValid) {
    addDiagnostic(
      diagnostics,
      'conformance.contract',
      '$',
      'Comparator conformance metadata and fixture paths must be canonical.',
    );
  }
  const canonicalMetrics = { differentPixels: 1, totalPixels: 4, differenceRatio: 25 };
  if (
    !sameMetrics(conformance?.expected, canonicalMetrics) ||
    !sameMetrics(conformance?.actual, canonicalMetrics) ||
    !sameMetrics(conformance?.expected, conformance?.actual)
  ) {
    addDiagnostic(
      diagnostics,
      'conformance.metrics',
      '$.actual',
      'Comparator conformance metrics must equal the canonical known result.',
    );
  }
  const [referenceBuffer, actualBuffer] = await Promise.all([
    readArtifact(projectRoot, expectedReference, '$.fixtures.reference', diagnostics),
    readArtifact(projectRoot, expectedActual, '$.fixtures.actual', diagnostics),
  ]);
  if (referenceBuffer && actualBuffer) {
    const referenceDimensions = pngDimensions(referenceBuffer);
    const actualDimensions = pngDimensions(actualBuffer);
    if (
      !sameDimensions(referenceDimensions, { width: 2, height: 2 }) ||
      !sameDimensions(actualDimensions, { width: 2, height: 2 }) ||
      referenceBuffer.equals(actualBuffer)
    ) {
      addDiagnostic(
        diagnostics,
        'conformance.fixtures',
        '$.fixtures',
        'Conformance fixtures must be distinct canonical 2x2 PNG inputs.',
      );
    }
  }
}

function parseAnalysis(source, diagnostics) {
  const lines = source.replace(/\r\n?/gu, '\n').split('\n');
  const tableLines = lines.filter((line) => line.trim().startsWith('|'));
  const parseRow = (line) => line.split('|').slice(1, -1).map((cell) => cell.trim());
  if (tableLines.length < 2) {
    addDiagnostic(
      diagnostics,
      'analysis.categories',
      '$.analysis',
      'Analysis must contain the canonical table.',
    );
    return undefined;
  }
  const header = parseRow(tableLines[0]);
  const expectedHeader = ['Category', 'Status', 'Evidence', 'Diagnosis', 'Disposition'];
  if (header.length !== expectedHeader.length || header.some((cell, index) => cell !== expectedHeader[index])) {
    addDiagnostic(
      diagnostics,
      'analysis.categories',
      '$.analysis',
      'Analysis table header must use the canonical five columns.',
    );
    return undefined;
  }
  const separator = parseRow(tableLines[1]);
  if (
    separator.length !== expectedHeader.length ||
    separator.some((cell) => cell !== '---')
  ) {
    addDiagnostic(
      diagnostics,
      'analysis.categories',
      '$.analysis',
      'Analysis table separator must use the canonical five columns.',
    );
    return undefined;
  }
  const rows = tableLines.slice(2).map(parseRow);
  if (
    rows.length !== analysisCategories.length ||
    rows.some(
      (row, index) =>
        row.length !== expectedHeader.length || row[0] !== analysisCategories[index],
    )
  ) {
    addDiagnostic(
      diagnostics,
      'analysis.categories',
      '$.analysis',
      'Analysis must contain each category once in canonical order.',
    );
    return undefined;
  }
  for (const row of rows) {
    for (let column = 0; column < expectedHeader.length; column += 1) {
      if (typeof row[column] !== 'string' || row[column].length === 0) {
        addDiagnostic(
          diagnostics,
          'analysis.cell',
          `$.analysis.${row[0]}.${expectedHeader[column]}`,
          'Analysis cells must be non-empty.',
        );
      }
    }
    const status = row[1];
    if (!new Set(['match', 'mismatch', 'not-applicable']).has(status)) {
      addDiagnostic(
        diagnostics,
        'analysis.status',
        `$.analysis.${row[0]}.Status`,
        'Analysis status must be match, mismatch, or not-applicable.',
      );
    } else if (
      (status === 'match' && row[4] !== 'accepted — no action') ||
      (status === 'not-applicable' && row[4] !== 'not applicable — no action')
    ) {
      addDiagnostic(
        diagnostics,
        'analysis.disposition',
        `$.analysis.${row[0]}.Disposition`,
        'Terminal analysis dispositions must use the canonical text.',
      );
    }
  }
  return rows.map(([category, status, evidence, diagnosis, disposition]) => ({
    category,
    status,
    evidence,
    diagnosis,
    disposition,
  }));
}

function issueOrdinals(row) {
  const ordinals = [];
  const pattern = /Issue refs:\s*([0-9]+(?:\s*,\s*[0-9]+)*)/gu;
  for (const match of row.evidence.matchAll(pattern)) {
    ordinals.push(...match[1].split(',').map((value) => Number.parseInt(value.trim(), 10)));
  }
  return ordinals;
}

function validateAnalysisSemantics(rows, result, diagnostics) {
  if (!rows || !Array.isArray(result?.issues)) return false;
  const ordinals = [];
  let bijectionValid = true;
  for (const row of rows) {
    const rowOrdinals = issueOrdinals(row);
    if (/Issue refs:/u.test(`${row.diagnosis} ${row.disposition}`)) {
      bijectionValid = false;
    }
    if (row.status === 'mismatch') {
      if (rowOrdinals.length === 0) bijectionValid = false;
    } else if (rowOrdinals.length > 0) {
      bijectionValid = false;
    }
    for (const ordinal of rowOrdinals) {
      ordinals.push(ordinal);
      const issue = result.issues[ordinal - 1];
      if (!issue || issue.category !== row.category) bijectionValid = false;
    }
  }
  const expectedOrdinals = result.issues.map((_, index) => index + 1);
  if (
    ordinals.length !== expectedOrdinals.length ||
    ordinals.some((value, index) => value !== expectedOrdinals[index])
  ) {
    bijectionValid = false;
  }
  if (!bijectionValid) {
    addDiagnostic(
      diagnostics,
      'analysis.issue-bijection',
      '$.issues',
      'Mismatch markers and ordered issues must form a bijection.',
    );
    return false;
  }

  const categoryIndexes = result.issues.map((issue) => analysisCategories.indexOf(issue.category));
  if (categoryIndexes.some((value, index) => index > 0 && value < categoryIndexes[index - 1])) {
    addDiagnostic(
      diagnostics,
      'result.issue-order',
      '$.issues',
      'Issues must follow category order.',
    );
  }
  return true;
}

function validateResultSemantics(
  raw,
  result,
  rows,
  diagnostics,
  mappingValid,
  isFinalIteration,
) {
  if (!raw || !result) return;
  const calculated = (raw.differentPixels / raw.totalPixels) * 100;
  if (!closeEnough(raw.differenceRatio, calculated)) {
    addDiagnostic(
      diagnostics,
      'raw.ratio',
      '$.differenceRatio',
      'differenceRatio must equal differentPixels / totalPixels * 100.',
    );
  }
  if (isFinalIteration && raw.differenceRatio > 15) {
    addDiagnostic(
      diagnostics,
      'iteration.threshold',
      '$.differenceRatio',
      'Final strict evidence must not exceed 15 percentage points.',
    );
  }
  if (!closeEnough(result.differenceRatio, raw.differenceRatio)) {
    addDiagnostic(
      diagnostics,
      'result.ratio',
      '$.differenceRatio',
      'Result ratio must equal raw ratio.',
    );
  }
  if (!mappingValid) return;
  const mismatches = rows?.filter((row) => row.status === 'mismatch') ?? [];
  if (raw.differenceRatio > 0 && mismatches.length === 0) {
    addDiagnostic(
      diagnostics,
      'analysis.missing-mismatch',
      '$.analysis',
      'A nonzero ratio requires at least one concrete mismatch row and issue.',
    );
  }
  const blockingMismatches = mismatches.filter(
    (row) =>
      !(
        raw.differenceRatio > 0 &&
        raw.differenceRatio <= 15 &&
        /\bmicro\b/iu.test(row.diagnosis) &&
        !/\bmacro\b/iu.test(row.diagnosis) &&
        row.disposition.startsWith('accepted micro residual:') &&
        !protectedResidualCategories.has(row.category)
      ),
  );
  const expectedStatus =
    raw.differenceRatio === 0 && mismatches.length === 0
      ? 'pixel-perfect'
      : raw.differenceRatio > 0 &&
          raw.differenceRatio <= 15 &&
          mismatches.length > 0 &&
          blockingMismatches.length === 0
        ? 'strict-visual-accepted'
        : 'failed';
  if (result.status !== expectedStatus) {
    addDiagnostic(
      diagnostics,
      'result.status',
      '$.status',
      'Result status must reflect ratio and category-gate semantics.',
    );
  }
  if (isFinalIteration && raw.differenceRatio <= 15) {
    for (const row of blockingMismatches) {
      addDiagnostic(
        diagnostics,
        'analysis.blocking-mismatch',
        `$.analysis.${row.category}`,
        'Final evidence may retain only justified micro residuals in unprotected categories.',
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
  diagnostics,
) {
  const bundleRoot = `artifacts/visual/${task.taskId}/${captureCase.caseId}/iterations/${iterationName}`;
  try {
    const entries = await readdir(path.resolve(projectRoot, bundleRoot), { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
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

  const analysisSource = buffers.get('analysis.md')?.toString('utf8');
  const rows = analysisSource ? parseAnalysis(analysisSource, diagnostics) : undefined;
  const mappingValid = validateAnalysisSemantics(rows, result, diagnostics);
  validateResultSemantics(
    raw,
    result,
    rows,
    diagnostics,
    mappingValid,
    isFinalIteration,
  );

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
}

async function validateBundles(projectRoot, task, capture, diagnostics) {
  if (await pathExists(path.resolve(projectRoot, legacyArtifactRoot))) {
    addDiagnostic(
      diagnostics,
      'path.legacy',
      legacyArtifactRoot,
      'Legacy visual-evidence root is forbidden.',
    );
  }

  const mirrorRoot = path.resolve(projectRoot, 'tests/visual/references/figma');
  try {
    const mirrorEntries = (await readdir(mirrorRoot, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
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
    const visualRootEntries = (
      await readdir(path.resolve(projectRoot, 'artifacts/visual'), { withFileTypes: true })
    ).sort((left, right) => left.name.localeCompare(right.name));
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

  if (!Array.isArray(capture?.cases)) return;
  for (const captureCase of capture.cases) {
    if (!isObject(captureCase) || typeof captureCase.caseId !== 'string') continue;
    const caseRoot = `artifacts/visual/${task.taskId}/${captureCase.caseId}`;
    let caseEntries = [];
    try {
      caseEntries = (
        await readdir(path.resolve(projectRoot, caseRoot), { withFileTypes: true })
      ).sort((left, right) => left.name.localeCompare(right.name));
    } catch {
      // Required case artifacts report their own completeness diagnostics below.
    }
    if (captureCase.evidenceMode !== 'visual-reference') {
      const evidenceBuffer = await readArtifact(
        projectRoot,
        captureCase.evidencePath,
        '$.evidencePath',
        diagnostics,
      );
      if (evidenceBuffer && evidenceBuffer.toString('utf8').trim().length === 0) {
        addDiagnostic(
          diagnostics,
          'no-reference.evidence-empty',
          '$.evidencePath',
          'No-reference evidence must contain a concrete local record.',
        );
      }
      for (const entry of caseEntries) {
        if (entry.name !== 'evidence.md') {
          const forbidden = `${caseRoot}/${entry.name}`;
          addDiagnostic(
            diagnostics,
            'no-reference.artifact',
            forbidden,
            'No-reference case roots may contain only evidence.md.',
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

    const iterationsRoot = path.resolve(projectRoot, `${caseRoot}/iterations`);
    let entries;
    try {
      entries = (await readdir(iterationsRoot, { withFileTypes: true })).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
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
      .sort();
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
      await validateIterationBundle(
        projectRoot,
        task,
        captureCase,
        iterationName,
        index === names.length - 1,
        diagnostics,
      );
    }
  }
}

async function validateEvidenceLog(projectRoot, task, capture, diagnostics) {
  const relativePath = `artifacts/visual/${task.taskId}/evidence-log.jsonl`;
  const buffer = await readArtifact(projectRoot, relativePath, '$.evidenceLog', diagnostics);
  if (!buffer) return;
  const lines = buffer.toString('utf8').replace(/\r\n?/gu, '\n').trimEnd().split('\n');
  const events = [];
  let latestImplementationHash;
  for (const [index, line] of lines.entries()) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      addDiagnostic(diagnostics, 'evidence.json', `$[${index}]`, 'Evidence event is malformed JSON.');
      events.push(undefined);
      continue;
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
    for (const [hashIndex, artifact] of artifactHashes.entries()) {
      if (!isObject(artifact)) continue;
      const artifactBuffer = await readArtifact(
        projectRoot,
        artifact.path,
        `$[${index}].artifactHashes[${hashIndex}].path`,
        diagnostics,
      );
      if (artifactBuffer && artifact.hash !== checksum(artifactBuffer)) {
        addDiagnostic(
          diagnostics,
          'evidence.hash',
          `$[${index}].artifactHashes[${hashIndex}].hash`,
          'Evidence hash must match its artifact.',
        );
      }
    }
    if (latestImplementationHash === undefined) {
      latestImplementationHash = event.implementationHash;
    } else if (event.eventType === 'implementation-changed') {
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
    } else if (event.implementationHash !== latestImplementationHash) {
      addDiagnostic(
        diagnostics,
        'evidence.implementation-hash',
        `$[${index}].implementationHash`,
        'Only implementation-changed may alter the current implementation hash.',
      );
    }
  }

  const visualCases = new Map(
    (capture.cases ?? [])
      .filter((captureCase) => captureCase.evidenceMode === 'visual-reference')
      .map((captureCase) => [captureCase.caseId, captureCase]),
  );
  const completedIterations = new Set();
  const invalidEventCases = new Set();
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
      const resultHashes = (event.artifactHashes ?? []).filter(
        (artifact) => artifact?.path === expectedEvidencePath,
      );
      if (resultHashes.length !== 1) {
        addDiagnostic(
          diagnostics,
          'evidence.iteration-hash',
          `$[${index}].artifactHashes`,
          'Iteration event must contain exactly one hash for its canonical result.json.',
        );
      }
    }
  }

  for (const [caseId] of visualCases) {
    if (invalidEventCases.has(caseId)) continue;
    const iterationsRoot = path.resolve(
      projectRoot,
      `artifacts/visual/${task.taskId}/${caseId}/iterations`,
    );
    let entries;
    try {
      entries = await readdir(iterationsRoot, { withFileTypes: true });
    } catch {
      continue;
    }
    const names = entries
      .filter((entry) => entry.isDirectory() && /^\d{3}$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort();
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
  }
}

export async function validateVisualEvidence({ taskPath, capturePath, projectRoot }) {
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
  if (diagnostics.length > 0 || !captureShapeValid) return diagnostics;
  await validateCanonicalContractRecords(canonicalRoot, task, capture, diagnostics);
  if (diagnostics.length > 0) return diagnostics;
  validateCaptureIdentity(task, capture, diagnostics);
  validateCaptureModesAndPaths(task, capture, canonicalRoot, diagnostics);
  if (diagnostics.length > 0) return diagnostics;
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
  if (sourceManifest) {
    await validateSourceManifest(canonicalRoot, task, capture, sourceManifest, diagnostics);
  }
  await validateConformance(canonicalRoot, task, diagnostics);
  await validateBundles(canonicalRoot, task, capture, diagnostics);
  await validateEvidenceLog(canonicalRoot, task, capture, diagnostics);
  return diagnostics;
}

function oneLineDiagnostic({ id, path: diagnosticPath, message }) {
  return `${id} ${diagnosticPath} ${message}`.replace(/[\r\n\u2028\u2029]+/gu, ' ');
}

function writeInputError(stderr, id) {
  stderr.write(`${id}\n`);
  return 2;
}

function parseCliArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== 6) return undefined;
  const knownFlags = new Set(['--task', '--capture', '--project-root']);
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      !knownFlags.has(flag) ||
      values.has(flag) ||
      typeof value !== 'string' ||
      value.length === 0 ||
      value.startsWith('--')
    ) {
      return undefined;
    }
    values.set(flag, value);
  }
  if (values.size !== knownFlags.size) return undefined;
  return {
    taskPath: values.get('--task'),
    capturePath: values.get('--capture'),
    projectRoot: values.get('--project-root'),
  };
}

export async function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const inputs = parseCliArguments(argv);
  if (!inputs) return writeInputError(stderr, 'input.arguments');

  let diagnostics;
  try {
    diagnostics = await validateVisualEvidence(inputs);
  } catch (error) {
    return writeInputError(
      stderr,
      error instanceof VisualInputError ? error.id : 'input.internal',
    );
  }
  if (diagnostics.length === 0) return 0;
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
