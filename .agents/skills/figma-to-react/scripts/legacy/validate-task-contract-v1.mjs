import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { join, parse, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadJsonDocument, validateSchema } from '../lib/schema-validator.mjs';

const maximumInputBytes = 1024 * 1024;
const taskContractSchema = await loadJsonDocument(
  new URL('./schemas/task-contract.schema.json', import.meta.url),
);

const diagnosticOrder = new Map(
  [
    'task.schema',
    'task.node-id-missing',
    'task.node-id-mismatch',
    'task.scope-conflict',
    'task.viewport-duplicate',
    'task.state-duplicate',
    'task.state-evidence',
    'task.provisioning',
    'task.acceptance',
  ].map((id, index) => [id, index]),
);

const mandatoryCapabilities = [
  'assetMaterialization',
  'agentBrowser',
  'visualCapture',
  'visualCompare',
  'vitestBrowser',
  'playwright',
  'agentVerify',
];
const acceptanceConstants = {
  qualityGates: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'],
  comparatorProfile: 'rgba-exact-v1',
  maxDifferenceRatio: 15,
  requireEightCategoryAnalysis: true,
  requireProjectChecks: true,
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function addDiagnostic(diagnostics, id, path, message) {
  if (
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.id === id && diagnostic.path === path && diagnostic.message === message,
    )
  ) {
    diagnostics.push({ id, path, message });
  }
}

function isOwnedSemanticSchemaDiagnostic(diagnostic) {
  if (diagnostic.id === 'schema.uniqueItems') {
    return diagnostic.path === '$.viewports' || diagnostic.path === '$.states';
  }

  if (
    diagnostic.id === 'schema.pattern' &&
    /^\$\.scope\.(?:include|exclude)\[\d+\]$/u.test(diagnostic.path)
  ) {
    return true;
  }

  if (
    diagnostic.id === 'schema.minLength' &&
    /^\$\.states\[\d+\]\.evidence$/u.test(diagnostic.path)
  ) {
    return true;
  }

  if (
    diagnostic.id === 'schema.enum' &&
    /^\$\.provisioning\.(?:assetMaterialization|recharts|agentBrowser|visualCapture|visualCompare|vitestBrowser|playwright|agentVerify)$/u.test(
      diagnostic.path,
    )
  ) {
    return true;
  }

  return /^\$\.acceptance\.(?:qualityGates|comparatorProfile|maxDifferenceRatio|requireEightCategoryAnalysis|requireProjectChecks)(?:\[\d+\])?$/u.test(
    diagnostic.path,
  );
}

function addSchemaDiagnostics(document, diagnostics) {
  for (const diagnostic of validateSchema(document, taskContractSchema)) {
    if (isOwnedSemanticSchemaDiagnostic(diagnostic)) {
      continue;
    }

    const id = diagnostic.path.startsWith('$.provisioning')
      ? 'task.provisioning'
      : diagnostic.path.startsWith('$.acceptance')
        ? 'task.acceptance'
        : 'task.schema';
    addDiagnostic(
      diagnostics,
      id,
      diagnostic.path,
      `Schema validation failed (${diagnostic.id}): ${diagnostic.message}`,
    );
  }
}

function normalizeNodeId(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const match = /^(\d+)(?::|-)(\d+)$/u.exec(value);
  return match ? `${match[1]}:${match[2]}` : undefined;
}

function validateNodeIdentity(document, diagnostics) {
  if (!isObject(document.source) || typeof document.source.figmaUrl !== 'string') {
    return;
  }

  let figmaUrl;
  try {
    figmaUrl = new URL(document.source.figmaUrl);
  } catch {
    addDiagnostic(
      diagnostics,
      'task.node-id-missing',
      '$.source.figmaUrl',
      'Figma URL must contain exactly one node-id query value.',
    );
    return;
  }

  if (
    figmaUrl.protocol !== 'https:' ||
    (figmaUrl.hostname !== 'figma.com' && figmaUrl.hostname !== 'www.figma.com')
  ) {
    addDiagnostic(
      diagnostics,
      'task.schema',
      '$.source.figmaUrl',
      'Source must be an HTTPS figma.com URL.',
    );
    return;
  }

  const nodeValues = figmaUrl.searchParams.getAll('node-id');

  if (nodeValues.length !== 1 || nodeValues[0] === '') {
    addDiagnostic(
      diagnostics,
      'task.node-id-missing',
      '$.source.figmaUrl',
      'Figma URL must contain exactly one node-id query value.',
    );
    return;
  }

  const urlNodeId = normalizeNodeId(nodeValues[0]);
  const contractNodeId = normalizeNodeId(document.source.nodeId);
  if (urlNodeId === undefined || (contractNodeId !== undefined && urlNodeId !== contractNodeId)) {
    addDiagnostic(
      diagnostics,
      'task.node-id-mismatch',
      '$.source.nodeId',
      'URL node-id must match source.nodeId after normalization.',
    );
  }
}

function normalizeScopeEntry(value) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

function validateScope(document, diagnostics) {
  if (!isObject(document.scope)) {
    return;
  }

  const included = new Set();
  if (Array.isArray(document.scope.include)) {
    document.scope.include.forEach((entry, index) => {
      if (typeof entry !== 'string') {
        return;
      }

      const normalized = normalizeScopeEntry(entry);
      if (normalized.length === 0) {
        addDiagnostic(
          diagnostics,
          'task.schema',
          `$.scope.include[${index}]`,
          'Scope entry must contain non-whitespace text.',
        );
      } else {
        included.add(normalized);
      }
    });
  }

  if (!Array.isArray(document.scope.exclude)) {
    return;
  }

  document.scope.exclude.forEach((entry, index) => {
    if (typeof entry !== 'string') {
      return;
    }

    const normalized = normalizeScopeEntry(entry);
    if (normalized.length === 0) {
      addDiagnostic(
        diagnostics,
        'task.schema',
        `$.scope.exclude[${index}]`,
        'Scope entry must contain non-whitespace text.',
      );
    } else if (included.has(normalized)) {
      addDiagnostic(
        diagnostics,
        'task.scope-conflict',
        `$.scope.exclude[${index}]`,
        'Scope entry conflicts with an included entry after normalization.',
      );
    }
  });
}

function validateViewports(document, diagnostics) {
  if (!Array.isArray(document.viewports)) {
    return;
  }

  const ids = new Set();
  const geometries = new Set();
  document.viewports.forEach((viewport, index) => {
    if (!isObject(viewport)) {
      return;
    }

    if (typeof viewport.id === 'string') {
      if (ids.has(viewport.id)) {
        addDiagnostic(
          diagnostics,
          'task.viewport-duplicate',
          `$.viewports[${index}].id`,
          'Viewport id must be unique.',
        );
      } else {
        ids.add(viewport.id);
      }
    }

    if (
      Number.isInteger(viewport.width) &&
      Number.isInteger(viewport.height) &&
      typeof viewport.dpr === 'number' &&
      Number.isFinite(viewport.dpr)
    ) {
      const geometry = JSON.stringify([viewport.width, viewport.height, viewport.dpr]);
      if (geometries.has(geometry)) {
        addDiagnostic(
          diagnostics,
          'task.viewport-duplicate',
          `$.viewports[${index}]`,
          'Viewport width, height, and dpr combination must be unique.',
        );
      } else {
        geometries.add(geometry);
      }
    }
  });
}

function validateStates(document, diagnostics) {
  if (!Array.isArray(document.states)) {
    return;
  }

  const ids = new Set();
  document.states.forEach((state, index) => {
    if (!isObject(state)) {
      return;
    }

    if (typeof state.id === 'string') {
      if (ids.has(state.id)) {
        addDiagnostic(
          diagnostics,
          'task.state-duplicate',
          `$.states[${index}].id`,
          'State id must be unique.',
        );
      } else {
        ids.add(state.id);
      }
    }

    const evidencePath = `$.states[${index}].evidence`;
    if (state.applicability === 'required' && typeof state.evidence === 'string') {
      addDiagnostic(
        diagnostics,
        'task.state-evidence',
        evidencePath,
        'Required states must use null evidence.',
      );
    }
    if (
      state.applicability === 'not-applicable' &&
      (state.evidence === null ||
        (typeof state.evidence === 'string' && state.evidence.trim().length === 0))
    ) {
      addDiagnostic(
        diagnostics,
        'task.state-evidence',
        evidencePath,
        'Not-applicable states require non-empty evidence.',
      );
    }
  });
}

function validateProvisioning(document, diagnostics) {
  if (!isObject(document.provisioning)) {
    return;
  }

  const requiredValues = new Set(['available', 'in-scope']);
  for (const capability of mandatoryCapabilities) {
    if (hasOwn(document.provisioning, capability) && !requiredValues.has(document.provisioning[capability])) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.${capability}`,
        'Mandatory capability must be "available" or "in-scope".',
      );
    }
  }

  if (
    hasOwn(document.provisioning, 'recharts') &&
    !new Set(['available', 'in-scope', 'not-required']).has(document.provisioning.recharts)
  ) {
    addDiagnostic(
      diagnostics,
      'task.provisioning',
      '$.provisioning.recharts',
      'Recharts capability must be "available", "in-scope", or "not-required".',
    );
  }
}

function isAcceptanceValueEqual(actual, expected) {
  if (!Array.isArray(expected)) {
    return actual === expected;
  }
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function validateAcceptance(document, diagnostics) {
  if (!isObject(document.acceptance)) {
    return;
  }

  for (const [property, expected] of Object.entries(acceptanceConstants)) {
    if (
      hasOwn(document.acceptance, property) &&
      !isAcceptanceValueEqual(document.acceptance[property], expected)
    ) {
      addDiagnostic(
        diagnostics,
        'task.acceptance',
        `$.acceptance.${property}`,
        'Acceptance value must match the strict profile constant.',
      );
    }
  }
}

export function validateTaskContract(document) {
  const diagnostics = [];
  addSchemaDiagnostics(document, diagnostics);

  if (isObject(document)) {
    validateNodeIdentity(document, diagnostics);
    validateScope(document, diagnostics);
    validateViewports(document, diagnostics);
    validateStates(document, diagnostics);
    validateProvisioning(document, diagnostics);
    validateAcceptance(document, diagnostics);
  }

  return diagnostics.sort(
    (left, right) => diagnosticOrder.get(left.id) - diagnosticOrder.get(right.id),
  );
}

function oneLineDiagnostic({ id, path, message }) {
  return `${id} ${path} ${message}`.replace(/[\r\n\u2028\u2029]+/gu, ' ');
}

function writeInputError(stderr, id) {
  stderr.write(`${id}\n`);
  return 2;
}

async function inspectInputPath(filePath) {
  const absolutePath = resolve(filePath);
  const { root } = parse(absolutePath);
  const segments = absolutePath.slice(root.length).split(sep).filter(Boolean);
  let currentPath = root;
  let fileStats;

  for (const segment of segments) {
    currentPath = join(currentPath, segment);
    fileStats = await lstat(currentPath);
    if (fileStats.isSymbolicLink()) {
      return { absolutePath, fileStats, hasSymlink: true };
    }
  }

  return { absolutePath, fileStats, hasSymlink: false };
}

export async function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;

  if (!Array.isArray(argv) || argv.length !== 1 || typeof argv[0] !== 'string') {
    return writeInputError(stderr, 'input.unreadable');
  }

  let input;
  try {
    input = await inspectInputPath(argv[0]);
  } catch {
    return writeInputError(stderr, 'input.unreadable');
  }

  if (input.hasSymlink || !input.fileStats?.isFile()) {
    return writeInputError(stderr, 'input.not-regular');
  }
  if (input.fileStats.size > maximumInputBytes) {
    return writeInputError(stderr, 'input.too-large');
  }

  let document;
  let fileHandle;
  try {
    fileHandle = await open(
      input.absolutePath,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    );
    const openedStats = await fileHandle.stat();
    if (!openedStats.isFile()) {
      return writeInputError(stderr, 'input.not-regular');
    }
    if (openedStats.size > maximumInputBytes) {
      return writeInputError(stderr, 'input.too-large');
    }
    document = JSON.parse(await fileHandle.readFile('utf8'));
  } catch (error) {
    return writeInputError(stderr, error instanceof SyntaxError ? 'input.json' : 'input.unreadable');
  } finally {
    await fileHandle?.close();
  }

  let diagnostics;
  try {
    diagnostics = validateTaskContract(document);
  } catch {
    return writeInputError(stderr, 'input.json');
  }

  if (diagnostics.length === 0) {
    return 0;
  }

  stdout.write(`${diagnostics.map(oneLineDiagnostic).join('\n')}\n`);
  return 1;
}

async function isDirectInvocation() {
  if (!process.argv[1]) {
    return false;
  }

  try {
    const [invokedPath, modulePath] = await Promise.all([
      realpath(resolve(process.argv[1])),
      realpath(fileURLToPath(import.meta.url)),
    ]);
    return invokedPath === modulePath;
  } catch {
    return pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
  }
}

if (await isDirectInvocation()) {
  process.exitCode = await runCli();
}
