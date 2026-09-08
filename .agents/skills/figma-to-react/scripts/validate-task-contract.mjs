import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { inspectGitBaseline } from './lib/git-baseline.mjs';
import { loadJsonDocument, validateSchema } from './lib/schema-validator.mjs';

const maximumInputBytes = 1024 * 1024;
const taskContractSchema = await loadJsonDocument(
  new URL('../schemas/task-contract.schema.json', import.meta.url),
);

const diagnosticOrder = new Map(
  [
    'task.schema',
    'task.file-key',
    'task.node-id-missing',
    'task.node-id-mismatch',
    'task.target',
    'task.baseline',
    'task.path',
    'task.scope-conflict',
    'task.viewport-duplicate',
    'task.state-duplicate',
    'task.state-evidence',
    'task.evidence-mode',
    'task.provisioning',
    'task.acceptance',
    'task.checks',
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
    diagnostic.id === 'schema.minLength' &&
    /^\$\.states\[\d+\]\.evidence$/u.test(diagnostic.path)
  ) {
    return true;
  }

  if (
    diagnostic.id === 'schema.const' &&
    /^\$\.provisioning\.(?:assetMaterialization|agentBrowser|visualCapture|visualCompare|vitestBrowser|playwright|agentVerify)$/u.test(
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
    (figmaUrl.hostname !== 'figma.com' && figmaUrl.hostname !== 'www.figma.com') ||
    figmaUrl.port !== '' ||
    figmaUrl.username !== '' ||
    figmaUrl.password !== '' ||
    figmaUrl.hash !== ''
  ) {
    addDiagnostic(
      diagnostics,
      'task.schema',
      '$.source.figmaUrl',
      'Source must be an HTTPS figma.com URL without credentials, a custom port, or a fragment.',
    );
    return;
  }

  if ([...figmaUrl.searchParams.keys()].some((key) => key !== 'node-id')) {
    addDiagnostic(
      diagnostics,
      'task.schema',
      '$.source.figmaUrl',
      'Figma URL may contain only the single node-id query parameter; remove tracking, access, and session parameters before recording it.',
    );
    return;
  }

  const pathSegments = figmaUrl.pathname.split('/').filter(Boolean);
  const supportedKind = pathSegments[0] === 'design' || pathSegments[0] === 'file';
  const isBranchUrl = pathSegments[0] === 'design' && pathSegments[2] === 'branch';
  let urlFileKey;
  if (supportedKind && pathSegments.length >= 2) {
    urlFileKey = isBranchUrl ? pathSegments[3] : pathSegments[1];
  }
  if (urlFileKey === undefined || urlFileKey !== document.source.fileKey) {
    addDiagnostic(
      diagnostics,
      'task.file-key',
      '$.source.fileKey',
      'Figma URL must use /design/<fileKey>/..., /design/<fileKey>/branch/<branchKey>/..., or /file/<fileKey>/... and match the effective source.fileKey.',
    );
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

function validateTarget(document, diagnostics) {
  if (!isObject(document.target)) return;

  const { origin, route } = document.target;
  let parsedOrigin;
  if (typeof origin === 'string') {
    try {
      parsedOrigin = new URL(origin);
    } catch {
      parsedOrigin = undefined;
    }
    if (
      !parsedOrigin ||
      !['http:', 'https:'].includes(parsedOrigin.protocol) ||
      parsedOrigin.username !== '' ||
      parsedOrigin.password !== '' ||
      parsedOrigin.pathname !== '/' ||
      parsedOrigin.search !== '' ||
      parsedOrigin.hash !== '' ||
      parsedOrigin.origin !== origin
    ) {
      addDiagnostic(
        diagnostics,
        'task.target',
        '$.target.origin',
        'Target origin must be a canonical HTTP(S) origin without credentials, path, query, fragment, or trailing slash.',
      );
      parsedOrigin = undefined;
    }
  }

  if (typeof route === 'string') {
    const structurallyValid =
      route.startsWith('/') &&
      !route.startsWith('//') &&
      !route.includes('\\') &&
      !route.includes('?') &&
      !route.includes('#') &&
      !/[\r\n\u2028\u2029\u0000]/u.test(route);
    let canonical = false;
    if (structurallyValid && parsedOrigin) {
      try {
        canonical = new URL(route, `${origin}/`).href === `${origin}${route}`;
      } catch {
        canonical = false;
      }
    }
    if (!structurallyValid || (parsedOrigin && !canonical)) {
      addDiagnostic(
        diagnostics,
        'task.target',
        '$.target.route',
        'Target route must be one canonical origin-relative path without query, fragment, credentials, or backslashes.',
      );
    }
  }
}

function isProjectRelativePath(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.includes('\0') ||
    value.includes('\\') ||
    value.startsWith('/') ||
    value !== value.trim() ||
    value.includes('//') ||
    /^[A-Za-z]:/u.test(value)
  ) {
    return false;
  }
  const segments = value.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function isForbiddenImplementationPath(value) {
  if (typeof value !== 'string') return false;
  const segments = value.split('/');
  return (
    segments.includes('.git') ||
    segments.includes('node_modules') ||
    value === 'artifacts/visual' ||
    value.startsWith('artifacts/visual/') ||
    value === 'tests/visual/references/figma' ||
    value.startsWith('tests/visual/references/figma/')
  );
}

function validateProjectPaths(document, diagnostics) {
  const entries = [
    ['$.target.featureModule', document.target?.featureModule],
    ['$.data.fixture', document.data?.fixture],
  ];
  for (const [index, root] of (document.target?.allowedImplementationRoots ?? []).entries()) {
    entries.push([`$.target.allowedImplementationRoots[${index}]`, root]);
  }
  for (const [index, change] of (document.baseline?.preExistingChanges ?? []).entries()) {
    entries.push([`$.baseline.preExistingChanges[${index}].path`, change?.path]);
  }
  for (const [index, dependency] of (document.provisioning?.dependencies ?? []).entries()) {
    entries.push(
      [`$.provisioning.dependencies[${index}].packageJsonPath`, dependency?.packageJsonPath],
      [`$.provisioning.dependencies[${index}].lockfilePath`, dependency?.lockfilePath],
    );
  }
  for (const [diagnosticPath, value] of entries) {
    if (typeof value === 'string' && !isProjectRelativePath(value)) {
      addDiagnostic(
        diagnostics,
        'task.path',
        diagnosticPath,
        'Path must be a normalized project-relative path without dot segments or backslashes.',
      );
    }
    if (
      typeof value === 'string' &&
      !diagnosticPath.startsWith('$.baseline.preExistingChanges') &&
      isForbiddenImplementationPath(value)
    ) {
      addDiagnostic(
        diagnostics,
        'task.path',
        diagnosticPath,
        'Implementation paths must not use Git internals, installed packages, or evidence roots.',
      );
    }
  }
}

function validateImplementationRoots(document, diagnostics) {
  const roots = document.target?.allowedImplementationRoots;
  if (!Array.isArray(roots)) return;
  if (roots[0] !== document.target?.featureModule) {
    addDiagnostic(
      diagnostics,
      'task.path',
      '$.target.allowedImplementationRoots[0]',
      'The first allowed implementation root must equal target.featureModule.',
    );
  }
  for (const [index, root] of roots.entries()) {
    if (typeof root !== 'string') continue;
    if (isForbiddenImplementationPath(root)) {
      addDiagnostic(
        diagnostics,
        'task.path',
        `$.target.allowedImplementationRoots[${index}]`,
        'Implementation roots must not include Git internals, dependencies, or evidence.',
      );
    }
  }
}

function validateBaseline(document, diagnostics) {
  if (!isObject(document.baseline) || !Array.isArray(document.baseline.preExistingChanges)) {
    return;
  }
  const paths = new Set();
  let previousPath;
  for (const [index, change] of document.baseline.preExistingChanges.entries()) {
    if (!isObject(change) || typeof change.path !== 'string') continue;
    const prefix = `$.baseline.preExistingChanges[${index}]`;
    if (paths.has(change.path)) {
      addDiagnostic(
        diagnostics,
        'task.baseline',
        `${prefix}.path`,
        'Pre-existing change paths must be unique.',
      );
    }
    paths.add(change.path);
    if (previousPath !== undefined && Buffer.compare(
      Buffer.from(previousPath, 'utf8'),
      Buffer.from(change.path, 'utf8'),
    ) >= 0) {
      addDiagnostic(
        diagnostics,
        'task.baseline',
        `${prefix}.path`,
        'Pre-existing changes must be sorted by project-relative UTF-8 byte order.',
      );
    }
    previousPath = change.path;
    const hashValid = typeof change.hash === 'string' && /^sha256:[a-f0-9]{64}$/u.test(change.hash);
    if (
      (change.kind === 'file' && (!hashValid || !['100644', '100755'].includes(change.mode))) ||
      (change.kind === 'deleted' && (change.hash !== null || change.mode !== null))
    ) {
      addDiagnostic(
        diagnostics,
        'task.baseline',
        `${prefix}.hash`,
        'File changes require a Git file mode and SHA-256 hash; deleted changes require null mode and hash.',
      );
    }
    const forbiddenRoots = [
      `artifacts/visual/${document.taskId ?? ''}`,
      `tests/visual/references/figma/${document.taskId ?? ''}`,
      '.git',
      'node_modules',
    ];
    if (forbiddenRoots.some((root) => change.path === root || change.path.startsWith(`${root}/`))) {
      addDiagnostic(
        diagnostics,
        'task.baseline',
        `${prefix}.path`,
        'Pre-existing changes must not list task evidence, test references, Git internals, or dependencies.',
      );
    }
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
  if (!document.states.some((state) => state?.applicability === 'required')) {
    addDiagnostic(
      diagnostics,
      'task.state-evidence',
      '$.states',
      'At least one state must be required; use a required default state for a stateless screen.',
    );
  }
}

function validateEvidenceModes(document, diagnostics) {
  if (!isObject(document.evidenceModes)) return;
  for (const mode of ['behaviorOnly', 'responsiveOnly']) {
    const requirement = document.evidenceModes[mode];
    if (!isObject(requirement)) continue;
    const evidencePath = `$.evidenceModes.${mode}.evidence`;
    if (requirement.applicability === 'required' && requirement.evidence !== null) {
      addDiagnostic(
        diagnostics,
        'task.evidence-mode',
        evidencePath,
        'Required evidence modes must use null evidence.',
      );
    }
    if (
      requirement.applicability === 'not-applicable' &&
      (typeof requirement.evidence !== 'string' || requirement.evidence.trim().length === 0)
    ) {
      addDiagnostic(
        diagnostics,
        'task.evidence-mode',
        evidencePath,
        'Not-applicable evidence modes require a non-empty reason.',
      );
    }
  }
}

function validateProvisioning(document, diagnostics) {
  if (!isObject(document.provisioning)) {
    return;
  }

  for (const capability of mandatoryCapabilities) {
    if (hasOwn(document.provisioning, capability) && document.provisioning[capability] !== 'available') {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.${capability}`,
        'Mandatory capability must be "available" before G1 can pass.',
      );
    }
  }

  const validateCommandTemplate = (field, requiredPlaceholders) => {
    const command = document.provisioning[field];
    if (typeof command !== 'string') return;
    const placeholders = [...command.matchAll(/\{([^{}\r\n]+)\}/gu)].map((match) => match[1]);
    const remainder = command.replace(/\{[^{}\r\n]+\}/gu, '');
    if (
      remainder.includes('{') ||
      remainder.includes('}') ||
      placeholders.length !== requiredPlaceholders.length ||
      placeholders.some((placeholder, index) => placeholder !== requiredPlaceholders[index])
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.${field}`,
        `Command template must contain exactly these placeholders in order: ${requiredPlaceholders.map((value) => `{${value}}`).join(', ')}.`,
      );
    }
  };
  validateCommandTemplate('visualCaptureCommand', ['caseId']);
  validateCommandTemplate('visualCompareCommand', ['caseId', 'iteration']);

  const packages = new Set();
  const lockNames = new Set([
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lock',
    'bun.lockb',
  ]);
  const dependencies = Array.isArray(document.provisioning.dependencies)
    ? document.provisioning.dependencies
    : [];
  const expectedLockfileCommand = (dependency) => {
    const lockDirectory = dependency.lockfilePath?.split('/').slice(0, -1).join('/');
    const prefix = lockDirectory
      ? {
          'npm-ci': `npm --prefix ${lockDirectory}`,
          'pnpm-frozen': `pnpm --dir ${lockDirectory}`,
          'yarn-immutable': `yarn --cwd ${lockDirectory}`,
          'yarn-classic-frozen': `yarn --cwd ${lockDirectory}`,
          'bun-frozen': `bun install --cwd ${lockDirectory}`,
        }[dependency.lockfileCheckProfile]
      : {
          'npm-ci': 'npm',
          'pnpm-frozen': 'pnpm',
          'yarn-immutable': 'yarn',
          'yarn-classic-frozen': 'yarn',
          'bun-frozen': 'bun install',
        }[dependency.lockfileCheckProfile];
    const suffix = {
      'npm-ci': 'ci --ignore-scripts',
      'pnpm-frozen': 'install --frozen-lockfile --ignore-scripts',
      'yarn-immutable': 'install --immutable --mode=skip-build',
      'yarn-classic-frozen': 'install --frozen-lockfile --ignore-scripts --non-interactive',
      'bun-frozen': '--frozen-lockfile --ignore-scripts',
    }[dependency.lockfileCheckProfile];
    return prefix && suffix ? `${prefix} ${suffix}` : undefined;
  };
  for (const [index, dependency] of dependencies.entries()) {
    if (!isObject(dependency) || typeof dependency.packageName !== 'string') continue;
    const normalized = dependency.packageName.toLowerCase();
    if (packages.has(normalized)) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].packageName`,
        'Dependency package names must be unique ignoring case.',
      );
    }
    packages.add(normalized);
    if (
      typeof dependency.packageJsonPath === 'string' &&
      dependency.packageJsonPath.split('/').at(-1) !== 'package.json'
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].packageJsonPath`,
        'packageJsonPath must identify a package.json file.',
      );
    }
    if (
      typeof dependency.lockfilePath === 'string' &&
      !lockNames.has(dependency.lockfilePath.split('/').at(-1))
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].lockfilePath`,
        'lockfilePath must identify a supported npm, pnpm, Yarn, or Bun lock file.',
      );
    }
    for (const field of ['packageJsonPath', 'lockfilePath']) {
      if (
        typeof dependency[field] === 'string' &&
        !/^[A-Za-z0-9._@/-]+$/u.test(dependency[field])
      ) {
        addDiagnostic(
          diagnostics,
          'task.provisioning',
          `$.provisioning.dependencies[${index}].${field}`,
          'Dependency paths must use only command-safe ASCII path characters.',
        );
      }
    }
    if (
      typeof dependency.specifier === 'string' &&
      dependency.specifier !== dependency.specifier.trim()
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].specifier`,
        'Dependency specifier must not contain surrounding whitespace.',
      );
    }
    const projectCheckIds = new Set(
      (document.acceptance?.projectChecks ?? []).map((check) => check?.id),
    );
    if (
      (dependency.status === 'available' && dependency.lockfileCheckId !== null) ||
      (dependency.status === 'approved-to-install' &&
        (typeof dependency.lockfileCheckId !== 'string' ||
          !projectCheckIds.has(dependency.lockfileCheckId)))
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].lockfileCheckId`,
        'available dependencies require null; approved installations require the ID of a declared frozen-lock project check.',
      );
    }
    const lockName = dependency.lockfilePath?.split('/').at(-1);
    const compatibleProfiles = {
      'package-lock.json': ['npm-ci'],
      'pnpm-lock.yaml': ['pnpm-frozen'],
      'yarn.lock': ['yarn-immutable', 'yarn-classic-frozen'],
      'bun.lock': ['bun-frozen'],
      'bun.lockb': ['bun-frozen'],
    }[lockName] ?? [];
    const matchingProjectCheck = (document.acceptance?.projectChecks ?? []).find(
      (check) => check?.id === dependency.lockfileCheckId,
    );
    if (
      dependency.status === 'available' &&
      dependency.lockfileCheckProfile !== null
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].lockfileCheckProfile`,
        'available dependencies require lockfileCheckProfile: null.',
      );
    } else if (
      dependency.status === 'approved-to-install' &&
      (!compatibleProfiles.includes(dependency.lockfileCheckProfile) ||
        matchingProjectCheck?.command !== expectedLockfileCommand(dependency))
    ) {
      addDiagnostic(
        diagnostics,
        'task.provisioning',
        `$.provisioning.dependencies[${index}].lockfileCheckProfile`,
        'Approved installations require a compatible strict lockfile profile and its exact safe project-check command.',
      );
    }
    for (const field of ['packageJsonPath', 'lockfilePath']) {
      const dependencyPath = dependency[field];
      if (typeof dependencyPath !== 'string') continue;
      if (isForbiddenImplementationPath(dependencyPath)) {
        addDiagnostic(
          diagnostics,
          'task.provisioning',
          `$.provisioning.dependencies[${index}].${field}`,
          'Dependency records must not use Git internals, installed packages, or evidence roots.',
        );
      }
    }
    if (
      typeof dependency.packageJsonPath === 'string' &&
      typeof document.target?.featureModule === 'string'
    ) {
      const packageDirectory = dependency.packageJsonPath.split('/').slice(0, -1).join('/');
      if (
        packageDirectory !== '' &&
        document.target.featureModule !== packageDirectory &&
        !document.target.featureModule.startsWith(`${packageDirectory}/`)
      ) {
        addDiagnostic(
          diagnostics,
          'task.provisioning',
          `$.provisioning.dependencies[${index}].packageJsonPath`,
          'packageJsonPath must belong to an ancestor workspace of target.featureModule.',
        );
      }
      if (typeof dependency.lockfilePath === 'string') {
        const lockDirectory = dependency.lockfilePath.split('/').slice(0, -1).join('/');
        if (
          lockDirectory !== '' &&
          packageDirectory !== lockDirectory &&
          !packageDirectory.startsWith(`${lockDirectory}/`)
        ) {
          addDiagnostic(
            diagnostics,
            'task.provisioning',
            `$.provisioning.dependencies[${index}].lockfilePath`,
            'lockfilePath must belong to the package workspace or one of its ancestors.',
          );
        }
      }
    }
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

  const checkIds = new Set();
  for (const group of ['projectChecks', 'browserChecks']) {
    const checks = Array.isArray(document.acceptance[group])
      ? document.acceptance[group]
      : [];
    for (const [index, check] of checks.entries()) {
      if (!isObject(check) || typeof check.id !== 'string') continue;
      if (checkIds.has(check.id)) {
        addDiagnostic(
          diagnostics,
          'task.checks',
          `$.acceptance.${group}[${index}].id`,
          'Check IDs must be unique across projectChecks and browserChecks.',
        );
      }
      checkIds.add(check.id);
    }
  }
}

export function validateTaskContract(document) {
  const diagnostics = [];
  addSchemaDiagnostics(document, diagnostics);

  if (isObject(document)) {
    validateNodeIdentity(document, diagnostics);
    validateTarget(document, diagnostics);
    validateBaseline(document, diagnostics);
    validateProjectPaths(document, diagnostics);
    validateImplementationRoots(document, diagnostics);
    validateScope(document, diagnostics);
    validateViewports(document, diagnostics);
    validateStates(document, diagnostics);
    validateEvidenceModes(document, diagnostics);
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

function parseCliArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== 4) return undefined;
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      !['--task', '--project-root'].includes(flag) ||
      values.has(flag) ||
      typeof value !== 'string' ||
      value.length === 0 ||
      value.startsWith('--')
    ) {
      return undefined;
    }
    values.set(flag, value);
  }
  if (values.size !== 2) return undefined;
  return { taskPath: values.get('--task'), projectRoot: values.get('--project-root') };
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
  const cli = parseCliArguments(argv);
  if (!cli) return writeInputError(stderr, 'input.arguments');

  let projectRoot;
  try {
    projectRoot = await realpath(cli.projectRoot);
    if (!(await lstat(projectRoot)).isDirectory()) throw new Error('not a directory');
  } catch {
    return writeInputError(stderr, 'input.project-root');
  }

  let input;
  const candidateInputPath = resolve(projectRoot, cli.taskPath);
  const candidateRelativePath = relative(projectRoot, candidateInputPath);
  if (
    candidateRelativePath === '..' ||
    candidateRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(candidateRelativePath)
  ) {
    return writeInputError(stderr, 'input.task-path');
  }
  try {
    input = await inspectInputPath(candidateInputPath);
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
    const expectedPath = resolve(
      projectRoot,
      `artifacts/visual/${document.taskId}/task-contract.json`,
    );
    if (input.absolutePath !== expectedPath) {
      addDiagnostic(
        diagnostics,
        'task.path',
        '$',
        `Task contract must be stored at artifacts/visual/${document.taskId}/task-contract.json.`,
      );
    }
    const snapshot = await inspectGitBaseline({
      projectRoot,
      revision: document.baseline.revision,
      excludedRoots: [
        `artifacts/visual/${document.taskId}`,
        `tests/visual/references/figma/${document.taskId}`,
      ],
    });
    for (const issue of snapshot.issues) {
      addDiagnostic(diagnostics, 'task.baseline', issue.path, issue.message);
    }
    if (
      Array.isArray(snapshot.entries) &&
      !isDeepStrictEqual(snapshot.entries, document.baseline.preExistingChanges)
    ) {
      addDiagnostic(
        diagnostics,
        'task.baseline',
        '$.baseline.preExistingChanges',
        'preExistingChanges must exactly match the current Git-visible snapshot.',
      );
    }
  }

  diagnostics.sort(
    (left, right) => diagnosticOrder.get(left.id) - diagnosticOrder.get(right.id),
  );
  if (diagnostics.length === 0) return 0;
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
