import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// v1 remains frozen behind this public dispatcher while v2 uses current validators.
import { runCli as runLegacyV1 } from './legacy/verify-all-v1.mjs';
import {
  VisualInputError,
  validateG8Preflight,
  validateVisualEvidence,
} from './validate-visual-evidence.mjs';

const gateIds = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
const gateRanks = new Map(gateIds.map((gateId, index) => [gateId, index]));
const taskIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const usage = [
  'Usage: node verify-all.mjs <task-id> [--project-root <path>] [--preflight-g8]',
  '',
  'Discovers artifacts/visual/<task-id>/ from the consumer project and verifies G0 through G8.',
  'Exit 0: verification passed.',
  'Exit 1: contract or evidence failure.',
  'Exit 2: invocation or consumer-environment failure.',
].join('\n');

function oneLine(value) {
  return String(value).replace(/[\r\n\u2028\u2029]+/gu, ' ').trim();
}

function gateFailure(gate, evidence, detail) {
  return { detail, evidence, gate };
}

function writeContractFailure(stdout, failure) {
  stdout.write(
    'VERIFY_ALL_CONTRACT_FAILURE gate=' +
      failure.gate +
      ' evidence=' +
      failure.evidence +
      ' detail=' +
      oneLine(failure.detail) +
      '\n',
  );
  return 1;
}

function writeEnvironmentFailure(stderr, reason, detail) {
  stderr.write(
    'VERIFY_ALL_ENVIRONMENT_FAILURE reason=' +
      reason +
      ' detail=' +
      oneLine(detail) +
      '\n',
  );
  return 2;
}

function parseCliArguments(argv, defaultProjectRoot) {
  if (!Array.isArray(argv)) return undefined;
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  if (
    argv.length === 0 ||
    typeof argv[0] !== 'string' ||
    argv[0].length === 0 ||
    argv[0].startsWith('--')
  ) {
    return undefined;
  }

  const inputs = {
    preflightG8: false,
    projectRoot: defaultProjectRoot,
    taskId: argv[0],
  };
  let projectRootSpecified = false;
  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--preflight-g8' && !inputs.preflightG8) {
      inputs.preflightG8 = true;
      continue;
    }
    if (
      flag === '--project-root' &&
      !projectRootSpecified &&
      typeof argv[index + 1] === 'string' &&
      argv[index + 1].length > 0 &&
      !argv[index + 1].startsWith('--')
    ) {
      inputs.projectRoot = argv[index + 1];
      projectRootSpecified = true;
      index += 1;
      continue;
    }
    return undefined;
  }
  return inputs;
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
  const relativePathFromRoot = path.relative(projectRoot, candidate);
  if (
    relativePathFromRoot === '..' ||
    relativePathFromRoot.startsWith('..' + path.sep) ||
    path.isAbsolute(relativePathFromRoot)
  ) {
    return { detail: 'Artifact path escapes the consumer project.' };
  }

  let current = projectRoot;
  try {
    for (const segment of relativePathFromRoot.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      if ((await lstat(current)).isSymbolicLink()) {
        return { detail: 'Artifact path must not contain symbolic links.' };
      }
    }
    if (!(await lstat(candidate)).isFile()) {
      return { detail: 'Artifact must be a regular file.' };
    }
    return { content: await readFile(candidate) };
  } catch {
    return { detail: 'Required artifact is missing or unreadable.' };
  }
}

async function readSchemaVersion(projectRoot, relativePath) {
  const artifact = await readRegularArtifact(projectRoot, relativePath);
  if (artifact.content === undefined) return undefined;
  try {
    const document = JSON.parse(artifact.content.toString('utf8'));
    return document !== null && typeof document === 'object' && !Array.isArray(document)
      ? document.schemaVersion
      : undefined;
  } catch {
    return undefined;
  }
}

async function readEvidenceEvents(projectRoot, taskId) {
  const evidencePath = 'artifacts/visual/' + taskId + '/evidence-log.jsonl';
  const artifact = await readRegularArtifact(projectRoot, evidencePath);
  if (artifact.content === undefined) return [];
  const source = artifact.content.toString('utf8').replace(/\r\n?/gu, '\n');
  const lines = source.endsWith('\n') ? source.slice(0, -1).split('\n') : source.split('\n');
  return lines.map((line) => {
    try {
      const event = JSON.parse(line);
      return isObject(event) ? event : undefined;
    } catch {
      return undefined;
    }
  });
}

function firstOpenV2GateBefore(evidenceEvents, eventIndex) {
  let nextGateIndex = 0;
  let openFailure;
  const openPreDiffFailures = new Set();

  for (const event of evidenceEvents.slice(0, eventIndex)) {
    if (!isObject(event)) continue;
    const gateIndex = gateRanks.get(event.gateId);

    if (event.eventType === 'gate-passed') {
      if (
        gateIndex === nextGateIndex &&
        (!openFailure || openFailure === event.gateId) &&
        !(event.gateId === 'G7' && openPreDiffFailures.size > 0)
      ) {
        nextGateIndex += 1;
        openFailure = undefined;
      }
      continue;
    }

    if (event.eventType === 'gate-failed') {
      if (gateIndex === nextGateIndex) openFailure = event.gateId;
      continue;
    }

    if (event.eventType === 'implementation-changed') {
      if (event.gateId === 'G4' && nextGateIndex >= 5 && nextGateIndex < gateIds.length) {
        nextGateIndex = gateRanks.get('G4');
        openFailure = undefined;
        openPreDiffFailures.clear();
      }
      continue;
    }

    if (event.eventType === 'failed-pre-diff' && event.gateId === 'G7' && nextGateIndex === 7) {
      openPreDiffFailures.add(event.caseId);
      continue;
    }

    if (event.eventType === 'iteration-completed' && event.gateId === 'G7' && nextGateIndex === 7) {
      openPreDiffFailures.delete(event.caseId);
    }
  }

  return gateIds[nextGateIndex] ?? 'G8';
}

async function firstV2GateZeroFailure(projectRoot, taskId) {
  const root = 'artifacts/visual/' + taskId;
  for (const relativePath of [root + '/compatibility.md', root + '/evidence-log.jsonl']) {
    const artifact = await readRegularArtifact(projectRoot, relativePath);
    if (artifact.content === undefined) {
      return gateFailure('G0', relativePath, artifact.detail);
    }
    if (artifact.content.toString('utf8').trim().length === 0) {
      return gateFailure('G0', relativePath, 'Required evidence must not be empty.');
    }
  }
  return undefined;
}

function gateForV2Diagnostic(diagnostic, evidenceEvents) {
  const id = typeof diagnostic?.id === 'string' ? diagnostic.id : '';
  const diagnosticPath = typeof diagnostic?.path === 'string' ? diagnostic.path : '';
  const message = typeof diagnostic?.message === 'string' ? diagnostic.message : '';
  const prefix = id.split('.', 1)[0];
  const eventMatch = /^\$\[([0-9]+)\]/u.exec(diagnosticPath);
  const eventIndex = eventMatch ? Number.parseInt(eventMatch[1], 10) : undefined;
  const eventGate = eventIndex === undefined ? undefined : evidenceEvents[eventIndex]?.gateId;

  if (gateRanks.has(eventGate)) return eventGate;
  if (eventIndex !== undefined) return firstOpenV2GateBefore(evidenceEvents, eventIndex);

  if (prefix === 'compatibility') return 'G0';
  if (prefix === 'task') return 'G1';
  if (['design-context', 'source', 'reference'].includes(prefix)) return 'G2';
  if (['capture', 'pre-code'].includes(prefix)) return 'G3';
  if (['implementation', 'git'].includes(prefix)) return 'G4';
  if (prefix === 'quality') return 'G5';
  if (prefix === 'project') return 'G6';
  if (
    [
      'analysis',
      'approval',
      'browser',
      'bundle',
      'conformance',
      'no-reference',
      'raw',
      'result',
      'iteration',
      'visual',
    ].includes(prefix)
  ) {
    return 'G7';
  }
  if (['inventory', 'verification', 'final-report'].includes(prefix)) return 'G8';

  if (prefix === 'evidence') {
    const messageGate =
      /next gate is (G[0-8])\b/u.exec(message)?.[1] ?? /\bG[0-8]\b/u.exec(message)?.[0];
    if (gateRanks.has(messageGate)) return messageGate;
    if (id === 'evidence.current-implementation') return 'G4';
    return 'G0';
  }

  if (diagnosticPath.includes('source-manifest') || diagnosticPath.includes('design-context')) {
    return 'G2';
  }
  if (diagnosticPath.includes('capture-contract') || diagnosticPath.includes('pre-code')) {
    return 'G3';
  }
  if (diagnosticPath.includes('implementation-manifest')) return 'G4';
  return 'G8';
}

function evidencePathForV2Diagnostic(diagnostic, gate, taskId) {
  const root = 'artifacts/visual/' + taskId;
  const id = typeof diagnostic?.id === 'string' ? diagnostic.id : '';
  const prefix = id.split('.', 1)[0];

  if (gate === 'G0') return root + '/compatibility.md';
  if (gate === 'G1') return root + '/task-contract.json';
  if (prefix === 'design-context') return root + '/design-context-manifest.json';
  if (prefix === 'source') return root + '/source-manifest.json';
  if (prefix === 'reference' || gate === 'G3') return root + '/capture-contract.json';
  if (gate === 'G4') return root + '/implementation-manifest.json';
  if (prefix === 'verification') return root + '/verification-record.json';
  if (prefix === 'final-report') return root + '/final-report.md';
  if (prefix === 'evidence') return root + '/evidence-log.jsonl';
  if (gate === 'G8') return root + '/verification-record.json';
  return root + '/evidence-log.jsonl';
}

function firstV2Failure(diagnostics, evidenceEvents, taskId) {
  if (!Array.isArray(diagnostics) || diagnostics.length === 0) return undefined;
  const ranked = diagnostics
    .map((diagnostic, index) => ({
      diagnostic,
      gate: gateForV2Diagnostic(diagnostic, evidenceEvents),
      index,
    }))
    .sort(
      (left, right) =>
        gateRanks.get(left.gate) - gateRanks.get(right.gate) || left.index - right.index,
    );
  const first = ranked[0];
  const diagnostic = first.diagnostic;
  return gateFailure(
    first.gate,
    evidencePathForV2Diagnostic(diagnostic, first.gate, taskId),
    (diagnostic.id || 'verification.failure') +
      ' ' +
      (diagnostic.path || '$') +
      ' ' +
      (diagnostic.message || 'Verification failed.'),
  );
}

async function runV2(inputs, projectRoot, io) {
  const stdout = io.stdout;
  const stderr = io.stderr;
  const artifactRoot = 'artifacts/visual/' + inputs.taskId;
  const taskPath = artifactRoot + '/task-contract.json';
  const capturePath = artifactRoot + '/capture-contract.json';

  let outcome;
  try {
    outcome = inputs.preflightG8
      ? await validateG8Preflight({ capturePath, projectRoot, taskPath })
      : {
          diagnostics: await validateVisualEvidence({ capturePath, projectRoot, taskPath }),
        };
  } catch (error) {
    if (error instanceof VisualInputError) {
      if (error.id === 'input.project-root') {
        return writeEnvironmentFailure(stderr, error.id, error.message);
      }
      return writeContractFailure(
        stdout,
        gateFailure('G3', capturePath, error.id + ' ' + error.message),
      );
    }
    return writeEnvironmentFailure(
      stderr,
      'input.internal',
      'Visual verifier could not complete; rerun verify-all and report this output with the task ID if it persists.',
    );
  }

  const evidenceEvents = await readEvidenceEvents(projectRoot, inputs.taskId);
  const failure = firstV2Failure(outcome.diagnostics, evidenceEvents, inputs.taskId);
  if (failure) return writeContractFailure(stdout, failure);

  if (inputs.preflightG8) {
    if (!outcome.g8Candidate) {
      return writeEnvironmentFailure(
        stderr,
        'input.internal',
        'The v2 verifier returned no G8 preflight event.',
      );
    }
    stdout.write(JSON.stringify(outcome.g8Candidate) + '\n');
    return 0;
  }

  stdout.write('VERIFY_ALL_PASS gate=G8 task=' + inputs.taskId + '\n');
  return 0;
}

export async function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const inputs = parseCliArguments(argv, process.cwd());
  if (!inputs) return writeEnvironmentFailure(stderr, 'input.arguments', usage);
  if (inputs.help) {
    stdout.write(usage + '\n');
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

  const taskPath = 'artifacts/visual/' + inputs.taskId + '/task-contract.json';
  const schemaVersion = await readSchemaVersion(projectRoot, taskPath);
  if (schemaVersion !== 2) {
    if (inputs.preflightG8) {
      return writeContractFailure(
        stdout,
        gateFailure(
          schemaVersion === 1 ? 'G8' : 'G1',
          taskPath,
          schemaVersion === 1
            ? 'G8 preflight is available only for task-contract schemaVersion 2.'
            : 'Task contract must declare supported schemaVersion 2 before G8 preflight.',
        ),
      );
    }
    return runLegacyV1([inputs.taskId, '--project-root', projectRoot], { stderr, stdout });
  }

  const gateZeroFailure = await firstV2GateZeroFailure(projectRoot, inputs.taskId);
  if (gateZeroFailure) return writeContractFailure(stdout, gateZeroFailure);

  return runV2(inputs, projectRoot, { stderr, stdout });
}

async function isDirectInvocation() {
  if (!process.argv[1]) return false;
  try {
    const invokedPath = await realpath(path.resolve(process.argv[1]));
    const modulePath = await realpath(fileURLToPath(import.meta.url));
    return invokedPath === modulePath;
  } catch {
    return pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
  }
}

if (await isDirectInvocation()) {
  process.exitCode = await runCli();
}
