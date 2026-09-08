import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateSchema } from './lib/schema-validator.mjs';
import { validateTaskContract } from './validate-task-contract.mjs';

const requiredInventory = [
  'SKILL.md',
  'rules/gates.md',
  'rules/source-and-assets.md',
  'rules/mapping-and-implementation.md',
  'rules/verification-and-completion.md',
  'references/figma-connector.md',
  'references/agent-browser-cli.md',
  'templates/task-contract.json',
  'templates/capture-contract.json',
  'templates/design-context-manifest.json',
  'templates/source-manifest.json',
  'templates/comparator-conformance.json',
  'templates/implementation-manifest.json',
  'templates/verification-record.json',
  'templates/browser-evidence.json',
  'templates/visual-approval.json',
  'templates/failure-record.json',
  'templates/compatibility.md',
  'templates/evidence-log.jsonl',
  'templates/pre-code-evidence.md',
  'templates/visual-analysis.md',
  'templates/final-report.md',
  'schemas/task-contract.schema.json',
  'schemas/capture-contract.schema.json',
  'schemas/evidence-event.schema.json',
  'schemas/design-context-manifest.schema.json',
  'schemas/source-manifest.schema.json',
  'schemas/comparator-conformance.schema.json',
  'schemas/implementation-manifest.schema.json',
  'schemas/verification-record.schema.json',
  'schemas/browser-evidence.schema.json',
  'schemas/visual-approval.schema.json',
  'schemas/failure-record.schema.json',
  'schemas/visual-compare-raw.schema.json',
  'schemas/visual-result.schema.json',
  'scripts/lib/git-baseline.mjs',
  'scripts/lib/markdown-records.mjs',
  'scripts/lib/png-rgba.mjs',
  'scripts/lib/schema-validator.mjs',
  'scripts/lib/visual-analysis.mjs',
  'scripts/legacy/schemas/capture-contract.schema.json',
  'scripts/legacy/schemas/evidence-event.schema.json',
  'scripts/legacy/schemas/task-contract.schema.json',
  'scripts/legacy/schemas/visual-compare-raw.schema.json',
  'scripts/legacy/schemas/visual-result.schema.json',
  'scripts/legacy/validate-task-contract-v1.mjs',
  'scripts/legacy/validate-visual-evidence-v1.mjs',
  'scripts/legacy/verify-all-v1.mjs',
  'scripts/tests/fixtures/verify-all-fixture.mjs',
  'scripts/tests/verify-all.test.mjs',
  'scripts/validate-task-contract.mjs',
  'scripts/validate-visual-evidence.mjs',
  'scripts/verify-all.mjs',
  'scripts/lint-skill-pack.mjs',
];
const requiredInventorySet = new Set(requiredInventory);
const legacyArtifactRoot = ['artifacts', 'figma'].join('/');
const legacyReferences = [
  ['references', `${['figma'].join('')}.md`].join('/'),
  ['references', `${['agent', 'browser', 'verification'].join('-')}.md`].join('/'),
];
const diagnosticOrder = new Map(
  [
    'pack.frontmatter',
    'pack.link',
    'pack.inventory',
    'pack.legacy-path',
    'pack.legacy-reference',
    'pack.gate-id',
    'pack.duplicate-norm',
    'pack.reference-policy',
    'pack.schema-json',
    'pack.template-schema',
    'pack.line-budget',
    'pack.word-budget',
  ].map((id, index) => [id, index]),
);
const referenceOwners = new Map([
  ['references/figma-connector.md', '../rules/source-and-assets.md'],
  ['references/agent-browser-cli.md', '../rules/verification-and-completion.md'],
]);
const schemaTemplatePairs = [
  ['templates/task-contract.json', 'schemas/task-contract.schema.json'],
  ['templates/capture-contract.json', 'schemas/capture-contract.schema.json'],
  ['templates/design-context-manifest.json', 'schemas/design-context-manifest.schema.json'],
  ['templates/source-manifest.json', 'schemas/source-manifest.schema.json'],
  ['templates/comparator-conformance.json', 'schemas/comparator-conformance.schema.json'],
  ['templates/implementation-manifest.json', 'schemas/implementation-manifest.schema.json'],
  ['templates/verification-record.json', 'schemas/verification-record.schema.json'],
  ['templates/browser-evidence.json', 'schemas/browser-evidence.schema.json'],
  ['templates/visual-approval.json', 'schemas/visual-approval.schema.json'],
  ['templates/failure-record.json', 'schemas/failure-record.schema.json'],
];
const designContextResponseFormats = new Map([
  ['get_design_context', { format: 'text', extension: 'txt' }],
  ['get_metadata', { format: 'xml', extension: 'xml' }],
  ['get_screenshot', { format: 'png', extension: 'png' }],
  ['get_variable_defs', { format: 'json', extension: 'json' }],
  ['download_assets', { format: 'json', extension: 'json' }],
  ['get_code_connect_map', { format: 'json', extension: 'json' }],
]);
const forbiddenImplementationRoots = [
  'artifacts/visual',
  'tests/visual/references/figma',
  'node_modules',
  '.git',
];

function compareUtf8Text(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

function isSamePathOrDescendant(candidate, root) {
  return candidate === root || candidate.startsWith(`${root}/`);
}

function templateError(diagnostics, relativePath, message) {
  addDiagnostic(diagnostics, 'pack.template-schema', relativePath, message);
}

function manifestRootHash(files, taskContractHash) {
  const source = [`task\0${taskContractHash}\n`, ...[...files]
    .sort((left, right) => compareUtf8Text(left.path, right.path))
    .map(
      ({ path: filePath, kind, mode, hash }) =>
        `${filePath}\0${kind}\0${mode ?? 'null'}\0${hash ?? 'null'}\n`,
    )]
    .join('');
  return `sha256:${createHash('sha256').update(source, 'utf8').digest('hex')}`;
}

function validateTemplateCoherence(parsedJson, evidenceEvents, diagnostics, fileSources) {
  const task = parsedJson.get('templates/task-contract.json');
  const capture = parsedJson.get('templates/capture-contract.json');
  const context = parsedJson.get('templates/design-context-manifest.json');
  const sources = parsedJson.get('templates/source-manifest.json');
  const implementation = parsedJson.get('templates/implementation-manifest.json');
  const verification = parsedJson.get('templates/verification-record.json');
  const browser = parsedJson.get('templates/browser-evidence.json');
  const approval = parsedJson.get('templates/visual-approval.json');
  const conformance = parsedJson.get('templates/comparator-conformance.json');
  if (
    !task ||
    !capture ||
    !context ||
    !sources ||
    !implementation ||
    !verification ||
    !browser ||
    !approval ||
    !conformance
  ) {
    return;
  }

  const identity = [task.taskId, task.source.fileKey, task.source.fileVersion, task.source.nodeId];
  const sameIdentity = (values) => values.every((value, index) => value === identity[index]);
  for (const captureCase of capture.cases ?? []) {
    if (
      !sameIdentity([
        captureCase.taskId,
        captureCase.fileKey,
        captureCase.fileVersion,
        captureCase.nodeId,
      ])
    ) {
      templateError(
        diagnostics,
        'templates/capture-contract.json',
        'Capture template identity must match the task template.',
      );
    }
  }
  for (const [relativePath, values] of [
    [
      'templates/design-context-manifest.json',
      [context.taskId, context.fileKey, context.fileVersion, context.rootNodeId],
    ],
    [
      'templates/source-manifest.json',
      [sources.taskId, sources.fileKey, sources.fileVersion, sources.rootNodeId],
    ],
  ]) {
    if (!sameIdentity(values)) {
      templateError(diagnostics, relativePath, 'Template identity must match the task template.');
    }
  }

  for (const request of context.requests ?? []) {
    const response = designContextResponseFormats.get(request.operation);
    const expectedPath = response
      ? `artifacts/visual/${task.taskId}/design-context/${request.requestId}.${response.extension}`
      : undefined;
    if (
      !response ||
      request.responseFormat !== response.format ||
      request.path !== expectedPath
    ) {
      templateError(
        diagnostics,
        'templates/design-context-manifest.json',
        'Design-context response formats and paths must match their Figma operations.',
      );
      break;
    }
  }

  const browserCase = (capture.cases ?? []).find(({ caseId }) => caseId === browser.caseId);
  const captureTemplateHash = fileSources.has('templates/capture-contract.json')
    ? `sha256:${createHash('sha256')
        .update(fileSources.get('templates/capture-contract.json'), 'utf8')
        .digest('hex')}`
    : undefined;
  if (
    !browserCase ||
    !sameIdentity([browser.taskId, browser.fileKey, browser.fileVersion, browser.nodeId]) ||
    browser.route !== browserCase.route ||
    browser.state !== browserCase.state ||
    browser.evidenceMode !== browserCase.evidenceMode ||
    JSON.stringify(browser.viewport) !== JSON.stringify(browserCase.viewport) ||
    browser.captureContractHash !== captureTemplateHash
  ) {
    templateError(
      diagnostics,
      'templates/browser-evidence.json',
      'Browser evidence template must identify one no-reference capture case exactly.',
    );
  }

  for (const captureCase of (capture.cases ?? []).filter(
    ({ evidenceMode }) => evidenceMode === 'visual-reference',
  )) {
    const source = (sources.sources ?? []).find(
      ({ sourceId }) => sourceId === captureCase.reference?.sourceId,
    );
    if (
      !source ||
      source.caseId !== captureCase.caseId ||
      source.purpose !== 'visual-reference' ||
      source.checksum !== captureCase.reference.checksum
    ) {
      templateError(
        diagnostics,
        'templates/source-manifest.json',
        `Visual case ${captureCase.caseId} must have one matching source entry.`,
      );
    }
  }

  const taskTemplateHash = fileSources.has('templates/task-contract.json')
    ? `sha256:${createHash('sha256')
        .update(fileSources.get('templates/task-contract.json'), 'utf8')
        .digest('hex')}`
    : undefined;
  const calculatedRootHash = manifestRootHash(
    implementation.files ?? [],
    implementation.taskContractHash,
  );
  const implementationPaths = (implementation.files ?? []).map(({ path: filePath }) => filePath);
  const sortedImplementationPaths = [...implementationPaths].sort(compareUtf8Text);
  const approvedDependencyPaths = new Set(
    (task.provisioning?.dependencies ?? [])
      .filter(({ status }) => status === 'approved-to-install')
      .flatMap(({ packageJsonPath, lockfilePath }) => [packageJsonPath, lockfilePath]),
  );
  const implementationCoverageValid =
    (implementation.files ?? []).some(({ path: filePath, kind }) =>
      kind === 'file' && isSamePathOrDescendant(filePath, task.target.featureModule),
    ) &&
    (implementation.files ?? []).some(
      ({ path: filePath, kind }) => kind === 'file' && filePath === task.data.fixture,
    ) &&
    !implementationPaths.some((filePath) =>
      forbiddenImplementationRoots.some((root) => isSamePathOrDescendant(filePath, root)),
    ) &&
    implementationPaths.every(
      (filePath) =>
        (task.target.allowedImplementationRoots ?? []).some((root) =>
          isSamePathOrDescendant(filePath, root),
        ) ||
        filePath === task.data.fixture ||
        approvedDependencyPaths.has(filePath),
    ) &&
    implementationPaths.every(
      (filePath, index) => filePath === sortedImplementationPaths[index],
    );
  if (
    implementation.taskId !== task.taskId ||
    implementation.taskContractHash !== taskTemplateHash ||
    implementation.rootHash !== calculatedRootHash ||
    !implementationCoverageValid
  ) {
    templateError(
      diagnostics,
      'templates/implementation-manifest.json',
      'Implementation template identity, coverage, paths, and rootHash must be self-consistent.',
    );
  }
  const implementationHex = implementation.rootHash?.slice('sha256:'.length);
  const versionRoot = `artifacts/visual/${task.taskId}/implementations/${implementationHex}`;
  if (
    verification.taskId !== task.taskId ||
    verification.implementationHash !== implementation.rootHash ||
    conformance.taskId !== task.taskId ||
    conformance.implementationHash !== implementation.rootHash ||
    browser.implementationHash !== implementation.rootHash
  ) {
    templateError(
      diagnostics,
      'templates/verification-record.json',
      'Implementation-bound templates must share the implementation rootHash.',
    );
  }
  if (
    approval.taskId !== task.taskId ||
    approval.implementationHash !== implementation.rootHash ||
    approval.captureContractHash !== captureTemplateHash ||
    !(capture.cases ?? []).some(
      ({ caseId, evidenceMode }) =>
        caseId === approval.caseId && evidenceMode === 'visual-reference',
    )
  ) {
    templateError(
      diagnostics,
      'templates/visual-approval.json',
      'Visual approval template must match the task, implementation, capture contract, and visual case.',
    );
  }

  for (const [group, suffix] of [
    ['projectChecks', 'txt'],
    ['browserChecks', 'txt'],
  ]) {
    const configured = task.acceptance[group] ?? [];
    const executed = verification[group] ?? [];
    if (
      configured.length !== executed.length ||
      executed.some(
        (item, index) =>
          item.id !== configured[index]?.id ||
          item.command !== configured[index]?.command ||
          item.outputPath !== `${versionRoot}/checks/${item.id}.${suffix}`,
      )
    ) {
      templateError(
        diagnostics,
        'templates/verification-record.json',
        `${group} must mirror the task template and use versioned output paths.`,
      );
    }
  }
  if (
    (verification.qualityChecks ?? []).some(
      ({ id, evidencePath }) => evidencePath !== `${versionRoot}/checks/${id.toLowerCase()}.md`,
    ) ||
    !Object.values(conformance.fixtures ?? {}).every((filePath) =>
      filePath.startsWith(`${versionRoot}/conformance/`),
    )
  ) {
    templateError(
      diagnostics,
      'templates/verification-record.json',
      'Quality and conformance artifacts must use the versioned implementation root.',
    );
  }

  for (const [index, event] of evidenceEvents.entries()) {
    if (event === null || typeof event !== 'object' || Array.isArray(event)) {
      templateError(
        diagnostics,
        'templates/evidence-log.jsonl',
        'Every evidence template line must contain one object.',
      );
      continue;
    }
    const beforeImplementation = ['G0', 'G1', 'G2', 'G3'].includes(event.gateId);
    if (
      event.sequence !== index + 1 ||
      event.taskId !== task.taskId ||
      (beforeImplementation
        ? event.implementationHash !== null
        : event.implementationHash !== implementation.rootHash)
    ) {
      templateError(
        diagnostics,
        'templates/evidence-log.jsonl',
        'Evidence template sequence, task identity, and implementation hashes must agree.',
      );
      break;
    }
    const artifactPaths = new Set(
      (Array.isArray(event?.artifactHashes) ? event.artifactHashes : [])
        .map((artifact) => artifact?.path)
        .filter((artifactPath) => typeof artifactPath === 'string'),
    );
    if (event.eventType === 'iteration-completed') {
      const iterationId = String(event.iteration).padStart(3, '0');
      const iterationRoot =
        `artifacts/visual/${task.taskId}/${event.caseId}/iterations/${iterationId}`;
      const expectedPaths = [
        'actual.png',
        'reference.png',
        'diff.png',
        'overlay.png',
        'raw.json',
        'analysis.md',
        'result.json',
      ].map((fileName) => `${iterationRoot}/${fileName}`);
      if (expectedPaths.some((artifactPath) => !artifactPaths.has(artifactPath))) {
        templateError(
          diagnostics,
          'templates/evidence-log.jsonl',
          'Iteration events must hash all seven immutable bundle files.',
        );
      }
    }
    if (
      event.eventType === 'gate-passed' &&
      event.gateId === 'G7' &&
      (capture.cases ?? []).some(({ evidenceMode }) => evidenceMode === 'visual-reference')
    ) {
      const expectedPaths = [
        `${versionRoot}/comparator-conformance.json`,
        `${versionRoot}/conformance/reference.png`,
        `${versionRoot}/conformance/actual.png`,
        `${versionRoot}/conformance/raw.json`,
        `${versionRoot}/conformance/diff.png`,
        `${versionRoot}/conformance/overlay.png`,
      ];
      if (expectedPaths.some((artifactPath) => !artifactPaths.has(artifactPath))) {
        templateError(
          diagnostics,
          'templates/evidence-log.jsonl',
          'G7 must hash the conformance record and all five conformance artifacts.',
        );
      }
    }
  }
}

class PackInputError extends Error {
  constructor(id, message) {
    super(message);
    this.name = 'PackInputError';
    this.id = id;
  }
}

function normalizeLf(source) {
  return source.replace(/\r\n?/gu, '\n');
}

function wordCount(source) {
  return source.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

function lineCount(source) {
  const normalized = normalizeLf(source);
  if (normalized.length === 0) return 0;
  return normalized.endsWith('\n')
    ? normalized.split('\n').length - 1
    : normalized.split('\n').length;
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

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function isRegularFile(candidate) {
  try {
    const stats = await lstat(candidate);
    return stats.isFile() && !stats.isSymbolicLink();
  } catch {
    return false;
  }
}

async function collectFiles(root, current = root) {
  const files = [];
  const entries = (await readdir(current, { withFileTypes: true })).sort((left, right) =>
    compareUtf8Text(left.name, right.name),
  );
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, absolute)));
    } else {
      files.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  return files;
}

function parseFrontmatter(source) {
  const normalized = normalizeLf(source);
  if (!normalized.startsWith('---\n')) return undefined;
  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) return undefined;
  const entries = new Map();
  for (const line of normalized.slice(4, closingIndex).split('\n')) {
    const match = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.+)$/u.exec(line);
    if (!match || entries.has(match[1])) return undefined;
    entries.set(match[1], match[2].trim());
  }
  const allowed = new Set(['name', 'description', 'compatibility']);
  if ([...entries.keys()].some((key) => !allowed.has(key))) return undefined;
  if (
    entries.size !== allowed.size ||
    entries.get('name') !== 'figma-to-react' ||
    !entries.get('description') ||
    !entries.get('compatibility')
  ) {
    return undefined;
  }
  return entries;
}

function markdownTargets(source) {
  const targets = [];
  const pattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
  for (const match of source.matchAll(pattern)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1);
    } else {
      target = target.split(/\s+/u)[0];
    }
    targets.push(target);
  }
  return targets;
}

function isExternalTarget(target) {
  return (
    target.startsWith('#') ||
    target.startsWith('//') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(target)
  );
}

async function validateLinks(root, markdownFiles, sources, diagnostics) {
  for (const relativePath of markdownFiles) {
    for (const rawTarget of markdownTargets(sources.get(relativePath))) {
      if (isExternalTarget(rawTarget)) continue;
      const target = rawTarget.split('#', 1)[0];
      if (target.length === 0) continue;
      let decoded;
      try {
        decoded = decodeURIComponent(target);
      } catch {
        addDiagnostic(
          diagnostics,
          'pack.link',
          relativePath,
          `Local Markdown link is not valid URI text: ${rawTarget}`,
        );
        continue;
      }
      const candidate = path.resolve(root, path.dirname(relativePath), decoded);
      if (!isContained(root, candidate)) {
        addDiagnostic(
          diagnostics,
          'pack.link',
          relativePath,
          `Local Markdown link escapes the skill root: ${rawTarget}`,
        );
        continue;
      }
      try {
        const canonical = await realpath(candidate);
        if (!isContained(root, canonical)) throw new Error('link escape');
        await lstat(canonical);
      } catch {
        addDiagnostic(
          diagnostics,
          'pack.link',
          relativePath,
          `Local Markdown link does not resolve inside the pack: ${rawTarget}`,
        );
      }
    }
  }
}

function contentWithoutFrontmatter(source) {
  const normalized = normalizeLf(source);
  if (!normalized.startsWith('---\n')) return normalized;
  const closingIndex = normalized.indexOf('\n---\n', 4);
  return closingIndex === -1 ? normalized : normalized.slice(closingIndex + 5);
}

function normalizedParagraphs(source) {
  const withoutFences = contentWithoutFrontmatter(source).replace(/```[\s\S]*?```/gu, ' ');
  return withoutFences
    .split(/\n\s*\n/gu)
    .map((paragraph) =>
      paragraph
        .normalize('NFKC')
        .replace(/^\s*(?:#{1,6}|[-*+] |\d+\. )/gmu, '')
        .replace(/\s+/gu, ' ')
        .trim()
        .toLowerCase(),
    )
    .filter((paragraph) => wordCount(paragraph) > 20);
}

function validateDuplicateParagraphs(markdownFiles, sources, diagnostics) {
  const owners = new Map();
  for (const relativePath of markdownFiles) {
    for (const paragraph of normalizedParagraphs(sources.get(relativePath))) {
      const firstOwner = owners.get(paragraph);
      if (firstOwner !== undefined) {
        addDiagnostic(
          diagnostics,
          'pack.duplicate-norm',
          relativePath,
          `Long paragraph duplicates policy already owned by ${firstOwner}.`,
        );
      } else {
        owners.set(paragraph, relativePath);
      }
    }
  }
}

function validateReferencePolicy(sources, diagnostics) {
  const normativePattern =
    /\b(?:MUST|MUST NOT|SHALL|SHOULD|REQUIRED)\b|\b(?:обязан\p{L}*|обязательно|запрещ\p{L}*|нельзя|должен|должна|должны|требуется|необходимо|остановит\p{L}*)\b/giu;
  for (const [relativePath, ownerTarget] of referenceOwners) {
    const source = sources.get(relativePath);
    if (source === undefined) continue;
    const targets = markdownTargets(source).map((target) => target.split('#', 1)[0]);
    if (normativePattern.test(source) || !targets.includes(ownerTarget)) {
      addDiagnostic(
        diagnostics,
        'pack.reference-policy',
        relativePath,
        'Tool references must remain procedural and link to their policy owner.',
      );
    }
    normativePattern.lastIndex = 0;
  }
}

function oneLineDiagnostic({ id, path: diagnosticPath, message }) {
  return `${id} ${diagnosticPath} ${message}`.replace(/[\r\n\u2028\u2029]+/gu, ' ');
}

export async function lintSkillPack(skillRoot) {
  if (typeof skillRoot !== 'string' || skillRoot.length === 0) {
    throw new PackInputError('input.arguments', 'Skill root is required.');
  }

  let root;
  try {
    root = await realpath(skillRoot);
    const stats = await lstat(root);
    if (!stats.isDirectory()) throw new Error('not a directory');
  } catch {
    throw new PackInputError('input.unreadable', 'Skill root is missing or unreadable.');
  }

  let files;
  try {
    files = await collectFiles(root);
  } catch {
    throw new PackInputError('input.unreadable', 'Cannot inspect skill pack.');
  }
  const sources = new Map();
  for (const relativePath of files) {
    if (!/\.(?:md|json|jsonl|mjs)$/u.test(relativePath)) continue;
    if (!(await isRegularFile(path.resolve(root, relativePath)))) continue;
    try {
      sources.set(relativePath, normalizeLf(await readFile(path.resolve(root, relativePath), 'utf8')));
    } catch {
      throw new PackInputError('input.unreadable', `Cannot read ${relativePath}.`);
    }
  }

  const diagnostics = [];
  const skillSource = sources.get('SKILL.md');
  if (skillSource === undefined || parseFrontmatter(skillSource) === undefined) {
    addDiagnostic(
      diagnostics,
      'pack.frontmatter',
      'SKILL.md',
      'SKILL.md requires exact name, description, and compatibility frontmatter.',
    );
  }

  const markdownFiles = files.filter(
    (relativePath) => relativePath.endsWith('.md') && sources.has(relativePath),
  );
  await validateLinks(root, markdownFiles, sources, diagnostics);

  for (const relativePath of requiredInventory) {
    if (!(await isRegularFile(path.resolve(root, relativePath)))) {
      addDiagnostic(
        diagnostics,
        'pack.inventory',
        relativePath,
        'Required public skill-pack file is missing or not regular.',
      );
    }
  }
  for (const relativePath of files) {
    if (!requiredInventorySet.has(relativePath) && !legacyReferences.includes(relativePath)) {
      addDiagnostic(
        diagnostics,
        'pack.inventory',
        relativePath,
        'File is outside the exact public skill-pack inventory.',
      );
    }
  }

  for (const relativePath of sources.keys()) {
    if (sources.get(relativePath).includes(legacyArtifactRoot)) {
      addDiagnostic(
        diagnostics,
        'pack.legacy-path',
        relativePath,
        'Legacy visual-evidence path is forbidden.',
      );
    }
  }
  for (const legacyPath of legacyReferences) {
    if (files.includes(legacyPath)) {
      addDiagnostic(
        diagnostics,
        'pack.legacy-reference',
        legacyPath,
        'Legacy reference file must be removed in the cutover.',
      );
    }
  }
  for (const relativePath of sources.keys()) {
    const source = sources.get(relativePath);
    if (legacyReferences.some((legacyPath) => source.includes(path.basename(legacyPath)))) {
      addDiagnostic(
        diagnostics,
        'pack.legacy-reference',
        relativePath,
        'Pack source still names a legacy reference file.',
      );
    }
  }
  for (const relativePath of markdownFiles) {
    const source = sources.get(relativePath);
    const unknownGate = [...source.matchAll(/\b([GQ])(\d+)\b/gu)].find((match) => {
      const number = Number.parseInt(match[2], 10);
      const outsideRange =
        match[1] === 'G' ? number < 0 || number > 8 : number < 1 || number > 6;
      return outsideRange || match[2] !== String(number);
    });
    if (unknownGate) {
      addDiagnostic(
        diagnostics,
        'pack.gate-id',
        relativePath,
        `Unknown gate ID ${unknownGate[0]}.`,
      );
    }
  }

  validateDuplicateParagraphs(markdownFiles, sources, diagnostics);
  validateReferencePolicy(sources, diagnostics);

  const parsedJson = new Map();
  for (const relativePath of files.filter(
    (candidate) => candidate.endsWith('.json') && sources.has(candidate),
  )) {
    try {
      parsedJson.set(relativePath, JSON.parse(sources.get(relativePath)));
    } catch {
      addDiagnostic(
        diagnostics,
        'pack.schema-json',
        relativePath,
        'JSON file must contain valid JSON.',
      );
    }
  }

  for (const [templatePath, schemaPath] of schemaTemplatePairs) {
    const template = parsedJson.get(templatePath);
    const schema = parsedJson.get(schemaPath);
    if (template === undefined || schema === undefined) continue;
    for (const diagnostic of validateSchema(template, schema)) {
      addDiagnostic(
        diagnostics,
        'pack.template-schema',
        templatePath,
        `Template violates ${schemaPath} at ${diagnostic.path} (${diagnostic.id}).`,
      );
    }
  }

  const taskTemplate = parsedJson.get('templates/task-contract.json');
  if (taskTemplate !== undefined) {
    for (const diagnostic of validateTaskContract(taskTemplate)) {
      addDiagnostic(
        diagnostics,
        'pack.template-schema',
        'templates/task-contract.json',
        `Task template fails semantic validation at ${diagnostic.path} (${diagnostic.id}).`,
      );
    }
  }

  const evidenceTemplate = sources.get('templates/evidence-log.jsonl');
  const evidenceSchema = parsedJson.get('schemas/evidence-event.schema.json');
  const evidenceEvents = [];
  if (evidenceTemplate !== undefined && evidenceSchema !== undefined) {
    const lines = normalizeLf(evidenceTemplate).trimEnd().split('\n');
    for (const [index, line] of lines.entries()) {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        addDiagnostic(
          diagnostics,
          'pack.schema-json',
          'templates/evidence-log.jsonl',
          `Line ${index + 1} must contain one JSON object.`,
        );
        continue;
      }
      evidenceEvents.push(event);
      for (const diagnostic of validateSchema(event, evidenceSchema)) {
        addDiagnostic(
          diagnostics,
          'pack.template-schema',
          'templates/evidence-log.jsonl',
          `Event ${index + 1} violates evidence-event.schema.json at ${diagnostic.path} (${diagnostic.id}).`,
        );
      }
    }
  }
  validateTemplateCoherence(parsedJson, evidenceEvents, diagnostics, sources);

  if (skillSource !== undefined && lineCount(skillSource) > 180) {
    addDiagnostic(
      diagnostics,
      'pack.line-budget',
      'SKILL.md',
      'SKILL.md must not exceed 180 normalized lines.',
    );
  }
  if (skillSource !== undefined && wordCount(skillSource) > 500) {
    addDiagnostic(
      diagnostics,
      'pack.word-budget',
      'SKILL.md',
      'SKILL.md must not exceed 500 Unicode words.',
    );
  }

  return diagnostics.sort((left, right) => {
    const byId = diagnosticOrder.get(left.id) - diagnosticOrder.get(right.id);
    return (
      byId ||
      compareUtf8Text(left.path, right.path) ||
      compareUtf8Text(left.message, right.message)
    );
  });
}

function writeInputError(stderr, id) {
  stderr.write(`${id}\n`);
  return 2;
}

export async function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  if (
    !Array.isArray(argv) ||
    argv.length > 1 ||
    (argv.length === 1 && typeof argv[0] !== 'string')
  ) {
    return writeInputError(stderr, 'input.arguments');
  }
  const skillRoot = argv[0] ?? fileURLToPath(new URL('..', import.meta.url));
  let diagnostics;
  try {
    diagnostics = await lintSkillPack(skillRoot);
  } catch (error) {
    return writeInputError(
      stderr,
      error instanceof PackInputError ? error.id : 'input.internal',
    );
  }
  if (diagnostics.length > 0) {
    stdout.write(`${diagnostics.map(oneLineDiagnostic).join('\n')}\n`);
    return 1;
  }
  stdout.write('figma-to-react skill pack: pass\n');
  return 0;
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

export { PackInputError };
