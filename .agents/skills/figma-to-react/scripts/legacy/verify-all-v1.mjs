import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateTaskContract } from './validate-task-contract-v1.mjs';
import { VisualInputError, validateVisualEvidence } from './validate-visual-evidence-v1.mjs';

const gateIds = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
const gateRanks = new Map(gateIds.map((gateId, index) => [gateId, index]));
const eventTypes = new Set([
  'failed-pre-diff',
  'gate-failed',
  'gate-passed',
  'implementation-changed',
  'iteration-completed',
]);
const implementationGateRank = gateRanks.get('G4');
const taskIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const checksumPattern = /^sha256:[a-f0-9]{64}$/u;

const usage = [
  'Usage: node verify-all.mjs <task-id> [--project-root <path>]',
  '',
  'Discovers artifacts/visual/<task-id>/ from the consumer project and verifies G0 through G8.',
  'Exit 0: verification passed.',
  'Exit 1: contract or evidence failure.',
  'Exit 2: invocation or consumer-environment failure.',
].join('\n');

function oneLine(value) {
  return String(value).replace(/[\r\n\u2028\u2029]+/gu, ' ').trim();
}

function checksum(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function gateFailure(gate, evidence, detail) {
  return { detail, evidence, gate };
}

function writeContractFailure(stdout, failure) {
  stdout.write(
    `VERIFY_ALL_CONTRACT_FAILURE gate=${failure.gate} evidence=${failure.evidence} detail=${oneLine(
      failure.detail,
    )}\n`,
  );
  return 1;
}

function writeEnvironmentFailure(stderr, reason, detail) {
  stderr.write(
    `VERIFY_ALL_ENVIRONMENT_FAILURE reason=${reason} detail=${oneLine(detail)}\n`,
  );
  return 2;
}

function parseCliArguments(argv, defaultProjectRoot) {
  if (!Array.isArray(argv)) return undefined;
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  if (
    argv.length === 1 &&
    typeof argv[0] === 'string' &&
    argv[0].length > 0 &&
    !argv[0].startsWith('--')
  ) {
    return { projectRoot: defaultProjectRoot, taskId: argv[0] };
  }
  if (
    argv.length === 3 &&
    typeof argv[0] === 'string' &&
    argv[0].length > 0 &&
    !argv[0].startsWith('--') &&
    argv[1] === '--project-root' &&
    typeof argv[2] === 'string' &&
    argv[2].length > 0
  ) {
    return { projectRoot: argv[2], taskId: argv[0] };
  }
  return undefined;
}

async function resolveProjectRoot(candidate) {
  try {
    const resolved = await realpath(candidate);
    const stats = await lstat(resolved);
    return stats.isDirectory() ? resolved : undefined;
  } catch {
    return undefined;
  }
}

async function readRegularArtifact(projectRoot, relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || path.isAbsolute(relativePath)) {
    return { detail: 'Artifact path must be a non-empty project-relative path.' };
  }

  const candidate = path.resolve(projectRoot, relativePath);
  const relative = path.relative(projectRoot, candidate);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    return { detail: 'Artifact path escapes the consumer project.' };
  }

  let current = projectRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stats;
    try {
      stats = await lstat(current);
    } catch {
      return { detail: 'Required artifact is missing or unreadable.' };
    }
    if (stats.isSymbolicLink()) {
      return { detail: 'Artifact path must not contain symbolic links.' };
    }
  }

  try {
    const stats = await lstat(candidate);
    if (!stats.isFile()) return { detail: 'Artifact must be a regular file.' };
    return { content: await readFile(candidate) };
  } catch {
    return { detail: 'Required artifact is missing or unreadable.' };
  }
}

async function requireArtifact(projectRoot, gate, relativePath, { nonEmpty = false } = {}) {
  const artifact = await readRegularArtifact(projectRoot, relativePath);
  if (artifact.content === undefined) {
    return { failure: gateFailure(gate, relativePath, artifact.detail) };
  }
  if (nonEmpty && artifact.content.toString('utf8').trim().length === 0) {
    return {
      failure: gateFailure(gate, relativePath, 'Required evidence must not be empty.'),
    };
  }
  return artifact;
}

async function requireJsonArtifact(projectRoot, gate, relativePath) {
  const artifact = await requireArtifact(projectRoot, gate, relativePath);
  if (artifact.failure) return artifact;
  try {
    return { document: JSON.parse(artifact.content.toString('utf8')) };
  } catch {
    return {
      failure: gateFailure(gate, relativePath, 'Required evidence must be valid JSON.'),
    };
  }
}

function firstTaskFailure(task) {
  const diagnostics = validateTaskContract(task);
  if (diagnostics.length === 0) return undefined;
  const diagnostic = diagnostics[0];
  return gateFailure(
    'G1',
    '$.task-contract',
    `${diagnostic.id} ${diagnostic.path} ${diagnostic.message}`,
  );
}

function parseEvidenceLog(content, evidencePath) {
  const source = content.toString('utf8').replace(/\r\n?/gu, '\n').trimEnd();
  if (source.length === 0) {
    return { failure: gateFailure('G0', evidencePath, 'Evidence log must contain gate evidence.') };
  }

  const records = [];
  for (const [index, line] of source.split('\n').entries()) {
    try {
      const event = JSON.parse(line);
      if (event === null || typeof event !== 'object' || Array.isArray(event)) {
        records.push({ detail: `Evidence event ${index + 1} must be an object.` });
        continue;
      }
      records.push({ event });
    } catch {
      records.push({ detail: `Evidence event ${index + 1} is not valid JSON.` });
    }
  }
  return { records };
}

function expectedGateArtifacts(taskId) {
  const root = `artifacts/visual/${taskId}`;
  return new Map([
    ['G0', [`${root}/compatibility.md`]],
    ['G1', [`${root}/task-contract.json`]],
    ['G2', [`${root}/design-context.json`, `${root}/source-manifest.json`]],
    ['G3', [`${root}/capture-contract.json`, `${root}/pre-code-evidence.md`]],
    ['G8', [`${root}/final-report.md`]],
  ]);
}

function gateAt(rank) {
  return gateIds[Math.min(rank, gateIds.length - 1)];
}

function failureGateForEvent(nextGateRank, eventGateRank) {
  return gateAt(Math.min(nextGateRank, eventGateRank ?? nextGateRank));
}

async function validateEventArtifacts({ event, gate, projectRoot, evidencePath, requireArtifacts }) {
  if (!Array.isArray(event.artifactHashes)) {
    return gateFailure(gate, evidencePath, 'Evidence event artifactHashes must be an array.');
  }
  if (requireArtifacts && event.artifactHashes.length === 0) {
    return gateFailure(gate, evidencePath, 'Gate-passed event must bind at least one evidence artifact.');
  }

  for (const artifact of event.artifactHashes) {
    if (
      artifact === null ||
      typeof artifact !== 'object' ||
      typeof artifact.path !== 'string' ||
      !checksumPattern.test(artifact.hash ?? '')
    ) {
      return gateFailure(gate, evidencePath, 'Evidence event has an invalid artifact hash entry.');
    }
    const stored = await readRegularArtifact(projectRoot, artifact.path);
    if (stored.content === undefined) return gateFailure(gate, artifact.path, stored.detail);
    if (stored.content.toString('utf8').trim().length === 0) {
      return gateFailure(gate, artifact.path, 'Evidence artifact must not be empty.');
    }
    if (checksum(stored.content) !== artifact.hash) {
      return gateFailure(gate, artifact.path, 'Evidence hash does not match the stored artifact.');
    }
  }
  return undefined;
}

function requiredGateArtifactFailure(event, gate, taskId) {
  const requiredPaths = expectedGateArtifacts(taskId).get(gate) ?? [];
  for (const requiredPath of requiredPaths) {
    if (!event.artifactHashes.some((artifact) => artifact?.path === requiredPath)) {
      return gateFailure(
        gate,
        requiredPath,
        `Gate-passed event must bind its canonical ${gate} evidence.`,
      );
    }
  }
  return undefined;
}

async function firstEvidencePassageFailure({ evidencePath, projectRoot, records, taskId }) {
  let nextGateRank = 0;
  let latestImplementationHash;
  let reopened;

  for (const [index, record] of records.entries()) {
    const currentGate = gateAt(nextGateRank);
    if (!record.event) return gateFailure(currentGate, evidencePath, record.detail);

    const event = record.event;
    const eventGateRank = gateRanks.get(event.gateId);
    const eventGate = failureGateForEvent(nextGateRank, eventGateRank);
    if (eventGateRank === undefined) {
      return gateFailure(currentGate, evidencePath, 'Evidence event has an unknown gate ID.');
    }
    if (!eventTypes.has(event.eventType)) {
      return gateFailure(eventGate, evidencePath, 'Evidence event has an unknown event type.');
    }
    if (event.sequence !== index + 1) {
      return gateFailure(eventGate, evidencePath, 'Evidence event sequence must be contiguous from 1.');
    }
    if (event.taskId !== taskId) {
      return gateFailure(eventGate, evidencePath, 'Evidence event taskId must match the requested identity.');
    }
    if (!checksumPattern.test(event.implementationHash ?? '')) {
      return gateFailure(eventGate, evidencePath, 'Evidence event implementationHash must be a SHA-256 digest.');
    }
    if (latestImplementationHash === undefined) {
      latestImplementationHash = event.implementationHash;
    } else if (event.eventType === 'implementation-changed') {
      if (event.implementationHash === latestImplementationHash) {
        return gateFailure(
          eventGate,
          evidencePath,
          'implementation-changed must record a new implementationHash.',
        );
      }
      latestImplementationHash = event.implementationHash;
    } else if (event.implementationHash !== latestImplementationHash) {
      return gateFailure(
        eventGate,
        evidencePath,
        'Only implementation-changed may alter the current implementationHash.',
      );
    }

    const artifactFailure = await validateEventArtifacts({
      event,
      gate: eventGate,
      projectRoot,
      evidencePath,
      requireArtifacts: event.eventType === 'gate-passed',
    });
    if (artifactFailure) return artifactFailure;

    if (event.eventType === 'gate-passed') {
      if (eventGateRank > nextGateRank) {
        return gateFailure(
          currentGate,
          evidencePath,
          'Gate-passed events must follow the current G0 through G8 passage order.',
        );
      }
      const requiredFailure = requiredGateArtifactFailure(event, event.gateId, taskId);
      if (requiredFailure) return requiredFailure;
      nextGateRank = eventGateRank + 1;
      reopened = undefined;
      continue;
    }

    if (event.eventType === 'implementation-changed') {
      const reopenedGateRank = Math.min(nextGateRank, implementationGateRank);
      if (reopenedGateRank < nextGateRank) {
        nextGateRank = reopenedGateRank;
        reopened = { eventType: event.eventType, index: index + 1 };
      }
      continue;
    }

    if (event.eventType === 'gate-failed' || event.eventType === 'failed-pre-diff') {
      const reopenedGateRank = Math.min(nextGateRank, eventGateRank);
      if (reopenedGateRank < nextGateRank) {
        nextGateRank = reopenedGateRank;
        reopened = { eventType: event.eventType, index: index + 1 };
      }
    }
  }

  if (nextGateRank < gateIds.length) {
    const gate = gateAt(nextGateRank);
    const detail = reopened
      ? `Evidence event ${reopened.index} (${reopened.eventType}) reopened ${gate}; add a current gate-passed event.`
      : `Missing current gate-passed event for ${gate}.`;
    return gateFailure(gate, evidencePath, detail);
  }
  return undefined;
}

function gateForVisualDiagnostic(diagnostic, events, fallbackGate) {
  const id = typeof diagnostic?.id === 'string' ? diagnostic.id : '';
  const diagnosticPath = typeof diagnostic?.path === 'string' ? diagnostic.path : '';

  if (id.startsWith('task.') || diagnosticPath.startsWith('$.task')) return 'G1';
  if (id.startsWith('capture.') || diagnosticPath.startsWith('$.cases')) return 'G3';
  if (id.startsWith('source.')) return 'G2';
  if (
    id === 'reference.checksum' ||
    id === 'reference.dimensions' ||
    id === 'reference.source' ||
    id === 'reference.source-mismatch' ||
    id === 'reference.mirror-checksum'
  ) {
    return 'G2';
  }
  if (id.startsWith('evidence.')) {
    const match = /^\$\[([0-9]+)\]/u.exec(diagnosticPath);
    const event = match ? events[Number.parseInt(match[1], 10)] : undefined;
    return gateRanks.has(event?.gateId) ? event.gateId : fallbackGate ?? 'G0';
  }
  if (id.startsWith('no-reference.')) return 'G5';
  if (id.startsWith('artifact.') && diagnosticPath.startsWith('$.sources')) return 'G2';
  if (id.startsWith('artifact.') && diagnosticPath.startsWith('$.reference')) return 'G2';
  if (id.startsWith('path.') && diagnosticPath.startsWith('$.reference')) return 'G2';
  return 'G7';
}

function evidencePathForVisualFailure(diagnostic, gate, taskId) {
  const artifactRoot = `artifacts/visual/${taskId}`;
  const id = typeof diagnostic?.id === 'string' ? diagnostic.id : '';
  const diagnosticPath = typeof diagnostic?.path === 'string' ? diagnostic.path : '';

  if (gate === 'G1') return `${artifactRoot}/task-contract.json`;
  if (gate === 'G2' && id.startsWith('source.')) {
    return `${artifactRoot}/source-manifest.json`;
  }
  if (gate === 'G2' && id === 'reference.source') return `${artifactRoot}/source-manifest.json`;
  if (
    gate === 'G2' &&
    (id.startsWith('reference.') ||
      (id.startsWith('artifact.') && diagnosticPath.startsWith('$.reference')))
  ) {
    return `${artifactRoot}/capture-contract.json`;
  }
  if (gate === 'G2' && id.startsWith('artifact.')) return `${artifactRoot}/source-manifest.json`;
  if (gate === 'G3' && id.startsWith('capture.')) return `${artifactRoot}/capture-contract.json`;
  if (id.startsWith('evidence.')) return `${artifactRoot}/evidence-log.jsonl`;
  return diagnostic.path || '$';
}

function firstVisualFailure(diagnostics, events, taskId, fallbackGate) {
  if (diagnostics.length === 0) return undefined;
  const ranked = diagnostics.map((diagnostic) => ({
    diagnostic,
    gate: gateForVisualDiagnostic(diagnostic, events, fallbackGate),
  }));
  ranked.sort(
    (left, right) =>
      gateRanks.get(left.gate) - gateRanks.get(right.gate) ||
      `${left.diagnostic.id}\0${left.diagnostic.path}`.localeCompare(
        `${right.diagnostic.id}\0${right.diagnostic.path}`,
      ),
  );
  const { diagnostic, gate } = ranked[0];
  return gateFailure(
    gate,
    evidencePathForVisualFailure(diagnostic, gate, taskId),
    `${diagnostic.id} ${diagnostic.path} ${diagnostic.message}`,
  );
}

function earlierFailure(left, right) {
  if (!left) return right;
  if (!right) return left;
  return gateRanks.get(left.gate) <= gateRanks.get(right.gate) ? left : right;
}

export async function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const inputs = parseCliArguments(argv, process.cwd());
  if (!inputs) return writeEnvironmentFailure(stderr, 'input.arguments', usage);
  if (inputs.help) {
    stdout.write(`${usage}\n`);
    return 0;
  }
  if (!taskIdPattern.test(inputs.taskId)) {
    return writeContractFailure(
      stdout,
      gateFailure('G1', '<task-id>', 'Task identity must be a lowercase kebab-case identifier.'),
    );
  }

  const projectRoot = await resolveProjectRoot(inputs.projectRoot);
  if (!projectRoot) {
    return writeEnvironmentFailure(
      stderr,
      'input.project-root',
      'Consumer project root is missing, unreadable, or not a directory; pass an existing readable directory with --project-root.',
    );
  }

  const artifactRoot = `artifacts/visual/${inputs.taskId}`;
  const compatibilityPath = `${artifactRoot}/compatibility.md`;
  const evidenceLogPath = `${artifactRoot}/evidence-log.jsonl`;
  const taskContractPath = `${artifactRoot}/task-contract.json`;
  const captureContractPath = `${artifactRoot}/capture-contract.json`;

  const compatibility = await requireArtifact(projectRoot, 'G0', compatibilityPath, { nonEmpty: true });
  if (compatibility.failure) return writeContractFailure(stdout, compatibility.failure);

  const evidenceLog = await requireArtifact(projectRoot, 'G0', evidenceLogPath, { nonEmpty: true });
  if (evidenceLog.failure) return writeContractFailure(stdout, evidenceLog.failure);
  const parsedEvidence = parseEvidenceLog(evidenceLog.content, evidenceLogPath);
  if (parsedEvidence.failure) return writeContractFailure(stdout, parsedEvidence.failure);
  const records = parsedEvidence.records;
  const events = records.map((record) => record.event);
  const passageFailure = await firstEvidencePassageFailure({
    evidencePath: evidenceLogPath,
    projectRoot,
    records,
    taskId: inputs.taskId,
  });
  if (passageFailure?.gate === 'G0') return writeContractFailure(stdout, passageFailure);

  const taskRecord = await requireJsonArtifact(projectRoot, 'G1', taskContractPath);
  if (taskRecord.failure) return writeContractFailure(stdout, taskRecord.failure);
  if (taskRecord.document?.taskId !== inputs.taskId) {
    return writeContractFailure(
      stdout,
      gateFailure('G1', taskContractPath, 'Task contract identity must match the requested task ID.'),
    );
  }
  const taskFailure = firstTaskFailure(taskRecord.document);
  if (taskFailure) return writeContractFailure(stdout, taskFailure);
  if (passageFailure?.gate === 'G1') return writeContractFailure(stdout, passageFailure);

  for (const [gate, paths] of [
    ['G2', [`${artifactRoot}/design-context.json`, `${artifactRoot}/source-manifest.json`]],
    ['G3', [captureContractPath, `${artifactRoot}/pre-code-evidence.md`]],
  ]) {
    for (const evidencePath of paths) {
      const required = evidencePath.endsWith('.json')
        ? await requireJsonArtifact(projectRoot, gate, evidencePath)
        : await requireArtifact(projectRoot, gate, evidencePath, { nonEmpty: true });
      if (required.failure) return writeContractFailure(stdout, required.failure);
    }
    if (passageFailure?.gate === gate) return writeContractFailure(stdout, passageFailure);
  }

  let visualFailure;
  try {
    const diagnostics = await validateVisualEvidence({
      taskPath: taskContractPath,
      capturePath: captureContractPath,
      projectRoot,
    });
    visualFailure = firstVisualFailure(
      diagnostics,
      events,
      inputs.taskId,
      passageFailure?.gate,
    );
  } catch (error) {
    if (error instanceof VisualInputError) {
      if (['input.json', 'input.path', 'input.unreadable'].includes(error.id)) {
        return writeContractFailure(
          stdout,
          gateFailure('G3', captureContractPath, `${error.id} ${error.message}`),
        );
      }
      return writeEnvironmentFailure(stderr, error.id, error.message);
    }
    return writeEnvironmentFailure(
      stderr,
      'input.internal',
      'Visual verifier could not complete; check the canonical task and capture artifacts, rerun verify-all, and report this output with the task ID if it persists.',
    );
  }

  const earliestFailure = earlierFailure(passageFailure, visualFailure);
  if (earliestFailure && earliestFailure.gate !== 'G8') {
    return writeContractFailure(stdout, earliestFailure);
  }

  const finalReport = await requireArtifact(
    projectRoot,
    'G8',
    `${artifactRoot}/final-report.md`,
    { nonEmpty: true },
  );
  if (finalReport.failure) return writeContractFailure(stdout, finalReport.failure);
  if (earliestFailure) return writeContractFailure(stdout, earliestFailure);

  stdout.write(`VERIFY_ALL_PASS gate=G8 task=${inputs.taskId}\n`);
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
