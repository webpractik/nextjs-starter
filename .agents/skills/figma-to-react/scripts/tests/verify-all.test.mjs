import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createGoldenConsumerProject } from './fixtures/verify-all-fixture.mjs';

const scriptsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packRoot = path.resolve(scriptsRoot, '..');
const verifyAllPath = path.join(scriptsRoot, 'verify-all.mjs');

function checksum(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function runVerifyAll(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [verifyAllPath, ...args], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve({ code, signal, stderr, stdout });
    });
  });
}

async function withGoldenFixture(run) {
  const fixture = await createGoldenConsumerProject();
  try {
    return await run(fixture);
  } finally {
    await rm(fixture.projectRoot, { force: true, recursive: true });
  }
}

async function withV2ContractProject(run) {
  const taskId = 'pricing-dashboard';
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'figma-to-react-verify-all-v2-'));
  const artifactRoot = path.join(projectRoot, 'artifacts', 'visual', taskId);
  try {
    await mkdir(artifactRoot, { recursive: true });
    const [captureContract, taskContract] = await Promise.all([
      readFile(path.join(packRoot, 'templates', 'capture-contract.json')),
      readFile(path.join(packRoot, 'templates', 'task-contract.json')),
    ]);
    await Promise.all([
      writeFile(path.join(artifactRoot, 'capture-contract.json'), captureContract),
      writeFile(path.join(artifactRoot, 'task-contract.json'), taskContract),
    ]);
    return await run({ artifactRoot, projectRoot, taskId });
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
}

async function readEvidenceEvents(evidenceLogPath) {
  return (await readFile(evidenceLogPath, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

async function writeEvidenceEvents(evidenceLogPath, events) {
  await writeFile(evidenceLogPath, `${events.map(JSON.stringify).join('\n')}\n`);
}

async function refreshEvidenceHash({ artifactPath, evidenceLogPath, projectRoot }) {
  const artifactRelativePath = path.relative(projectRoot, artifactPath).split(path.sep).join('/');
  const events = await readEvidenceEvents(evidenceLogPath);
  const artifactHash = checksum(await readFile(artifactPath));
  for (const event of events) {
    for (const artifact of event.artifactHashes) {
      if (artifact.path === artifactRelativePath) artifact.hash = artifactHash;
    }
  }
  await writeEvidenceEvents(evidenceLogPath, events);
}

function createV2CompatibilityEvidence(task) {
  const dependency = task.provisioning.dependencies[0];
  return [
    '# Совместимость',
    '',
    `- Задача: \`${task.taskId}\``,
    '- Проект: `React TypeScript Tailwind consumer`',
    `- URL Figma: \`${task.source.figmaUrl}\``,
    `- Источник: \`${task.source.fileKey}\`, версия \`${task.source.fileVersion}\`, узел \`${task.source.nodeId}\``,
    `- Адрес проекта: \`${task.target.origin}\``,
    `- Маршрут и целевой модуль: \`${task.target.route}\`, \`${task.target.featureModule}\``,
    `- Разрешённые корни реализации: \`${JSON.stringify(task.target.allowedImplementationRoots)}\``,
    `- Команда снимка: \`${task.provisioning.visualCaptureCommand}\``,
    `- Команда сравнения: \`${task.provisioning.visualCompareCommand}\``,
    '- Права: чтение Figma и запись только в разрешённые корни реализации, файл данных и согласованные файлы зависимости',
    '',
    '| Возможность | Статус | Как проверено |',
    '| --- | --- | --- |',
    '| Получение и сохранение ресурсов | `available` | `asset check` |',
    '| Управление браузером | `available` | `browser check` |',
    '| Снимок интерфейса | `available` | `capture check` |',
    '| Сравнение изображений | `available` | `compare check` |',
    '| Vitest Browser | `available` | `vitest check` |',
    '| Playwright | `available` | `playwright check` |',
    '| Проверка агентом | `available` | `agent check` |',
    '',
    '## Зависимости',
    '',
    '| Пакет | Назначение | Статус | Версия | package.json | Файл блокировки | Проверка блокировки | Профиль проверки |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    `| ${dependency.packageName} | ${dependency.purpose} | ${dependency.status} | ${dependency.specifier} | ${dependency.packageJsonPath} | ${dependency.lockfilePath} | ${dependency.lockfileCheckId} | ${dependency.lockfileCheckProfile} |`,
    '',
    'Если хотя бы одна обязательная возможность недоступна, примени `STOP` и не переходи к `G1`.',
    '',
  ].join('\n');
}

function v2GatePassedEvent({ artifactPath, hash, sequence, taskId, gateId }) {
  return {
    schemaVersion: 2,
    sequence,
    taskId,
    gateId,
    eventType: 'gate-passed',
    artifactHashes: [{ path: artifactPath, hash }],
    implementationHash: null,
    qualityGates: [],
    checkIds: [],
  };
}

test('verify-all closes G0 through G8 for the golden consumer project', async () => {
  await withGoldenFixture(async ({ projectRoot, taskId }) => {
    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /^VERIFY_ALL_PASS gate=G8 task=golden-g0-g8\n$/u);
    assert.equal(result.stderr, '');
  });
});

test('verify-all identifies missing v2 compatibility evidence as G0', async () => {
  await withV2ContractProject(async ({ projectRoot, taskId }) => {
    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G0 /u);
    assert.match(result.stdout, /compatibility\.md/u);
  });
});

test('verify-all rejects symlinked v2 compatibility evidence as G0', async () => {
  await withV2ContractProject(async ({ artifactRoot, projectRoot, taskId }) => {
    const externalPath = path.join(projectRoot, 'untrusted-compatibility.md');
    const compatibilityPath = path.join(artifactRoot, 'compatibility.md');
    await writeFile(externalPath, 'untrusted compatibility evidence\n');
    await symlink(externalPath, compatibilityPath);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G0 /u);
    assert.match(result.stdout, /compatibility\.md/u);
    assert.match(result.stdout, /symbolic links/u);
  });
});

test('verify-all reports incomplete v2 evidence without an internal error', async () => {
  await withV2ContractProject(async ({ artifactRoot, projectRoot, taskId }) => {
    await Promise.all([
      writeFile(path.join(artifactRoot, 'compatibility.md'), 'incomplete compatibility evidence\n'),
      writeFile(path.join(artifactRoot, 'evidence-log.jsonl'), '{}\n'),
    ]);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G0 /u);
    assert.equal(result.stderr, '');
  });
});

test('verify-all reports the first open v2 gate for malformed later evidence', async () => {
  await withV2ContractProject(async ({ artifactRoot, projectRoot, taskId }) => {
    const compatibilityPath = path.join(artifactRoot, 'compatibility.md');
    const taskContractPath = path.join(artifactRoot, 'task-contract.json');
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const task = JSON.parse(await readFile(taskContractPath, 'utf8'));
    const compatibility = createV2CompatibilityEvidence(task);
    await writeFile(compatibilityPath, compatibility);
    const compatibilityRelativePath = path.relative(projectRoot, compatibilityPath).split(path.sep).join('/');
    const taskRelativePath = path.relative(projectRoot, taskContractPath).split(path.sep).join('/');
    const events = [
      v2GatePassedEvent({
        artifactPath: compatibilityRelativePath,
        gateId: 'G0',
        hash: checksum(compatibility),
        sequence: 1,
        taskId,
      }),
      v2GatePassedEvent({
        artifactPath: taskRelativePath,
        gateId: 'G1',
        hash: checksum(await readFile(taskContractPath)),
        sequence: 2,
        taskId,
      }),
    ];
    await writeFile(evidenceLogPath, `${events.map(JSON.stringify).join('\n')}\n{ malformed G2\n`);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G2 /u);
  });
});

test('verify-all reports G2 and the missing source manifest through its public CLI', async () => {
  await withGoldenFixture(async ({ projectRoot, sourceManifestPath, taskId }) => {
    await rm(sourceManifestPath);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G2 /u);
    assert.match(result.stdout, /source-manifest\.json/u);
  });
});

test('verify-all names the capture contract for missing G2 reference evidence', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    await rm(path.join(artifactRoot, 'golden-visual', 'reference.png'));

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G2 /u);
    assert.match(result.stdout, /capture-contract\.json/u);
    assert.match(result.stdout, /artifact\.missing/u);
  });
});

test('verify-all reports invalid visual evidence as a G7 contract failure through its public CLI', async () => {
  await withGoldenFixture(async ({ projectRoot, rawPath, taskId }) => {
    const raw = JSON.parse(await readFile(rawPath, 'utf8'));
    raw.totalPixels = 3;
    await writeFile(rawPath, `${JSON.stringify(raw, null, 2)}\n`);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G7 /u);
    assert.match(result.stdout, /raw\.dimensions/u);
  });
});

test('verify-all rejects malformed G2 source evidence even when its event hash is refreshed', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, sourceManifestPath, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    await writeFile(sourceManifestPath, '{ malformed source manifest\n');
    await refreshEvidenceHash({
      artifactPath: sourceManifestPath,
      evidenceLogPath,
      projectRoot,
    });

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G2 /u);
    assert.match(result.stdout, /source-manifest\.json/u);
  });
});

test('verify-all names the source manifest for invalid G2 source evidence', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, sourceManifestPath, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const sourceManifest = JSON.parse(await readFile(sourceManifestPath, 'utf8'));
    sourceManifest.sources = [];
    await writeFile(sourceManifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`);
    await refreshEvidenceHash({
      artifactPath: sourceManifestPath,
      evidenceLogPath,
      projectRoot,
    });

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G2 /u);
    assert.match(result.stdout, /source-manifest\.json/u);
  });
});

test('verify-all classifies malformed capture evidence as a G3 contract failure', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const captureContractPath = path.join(artifactRoot, 'capture-contract.json');
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    await writeFile(captureContractPath, '{ malformed capture contract\n');
    await refreshEvidenceHash({ artifactPath: captureContractPath, evidenceLogPath, projectRoot });

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G3 /u);
    assert.match(result.stdout, /capture-contract\.json/u);
  });
});

test('verify-all reports an invalid capture reference path at G3 before visual gates', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const captureContractPath = path.join(artifactRoot, 'capture-contract.json');
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const capture = JSON.parse(await readFile(captureContractPath, 'utf8'));
    capture.cases[0].reference.path = 'artifacts/visual/golden-g0-g8/not-a-reference.png';
    await writeFile(captureContractPath, `${JSON.stringify(capture, null, 2)}\n`);
    await refreshEvidenceHash({ artifactPath: captureContractPath, evidenceLogPath, projectRoot });

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G3 /u);
    assert.match(result.stdout, /reference\.path/u);
  });
});

test('verify-all names G2 when the first malformed evidence event prevents its closure', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const lines = (await readFile(evidenceLogPath, 'utf8')).trim().split('\n');
    lines[2] = '{ malformed G2 event';
    await writeFile(evidenceLogPath, `${lines.join('\n')}\n`);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G2 /u);
    assert.match(result.stdout, /evidence-log\.jsonl/u);
  });
});

test('verify-all does not advance past an invalid earlier gate before malformed later evidence', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const lines = (await readFile(evidenceLogPath, 'utf8')).trim().split('\n');
    const g0 = JSON.parse(lines[0]);
    g0.taskId = 'different-task';
    lines[0] = JSON.stringify(g0);
    lines[1] = '{ malformed G1 event';
    await writeFile(evidenceLogPath, `${lines.join('\n')}\n`);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G0 /u);
    assert.match(result.stdout, /taskId/u);
  });
});

test('verify-all does not advance past an unannounced implementation hash change', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const lines = (await readFile(evidenceLogPath, 'utf8')).trim().split('\n');
    const g1 = JSON.parse(lines[1]);
    g1.implementationHash = `sha256:${'d'.repeat(64)}`;
    lines[1] = JSON.stringify(g1);
    lines[2] = '{ malformed G2 event';
    await writeFile(evidenceLogPath, `${lines.join('\n')}\n`);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G1 /u);
    assert.match(result.stdout, /implementationHash/u);
  });
});

test('verify-all rejects empty G5 event-bound evidence even when its hash is refreshed', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const qualityPath = path.join(artifactRoot, 'quality-q1-q4.md');
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    await writeFile(qualityPath, '\n');
    await refreshEvidenceHash({ artifactPath: qualityPath, evidenceLogPath, projectRoot });

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G5 /u);
    assert.match(result.stdout, /quality-q1-q4\.md/u);
  });
});

test('verify-all rejects an empty final report even when its G8 hash is refreshed', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const finalReportPath = path.join(artifactRoot, 'final-report.md');
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    await writeFile(finalReportPath, '\n');
    await refreshEvidenceHash({ artifactPath: finalReportPath, evidenceLogPath, projectRoot });

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G8 /u);
    assert.match(result.stdout, /final-report\.md/u);
  });
});

test('verify-all reopens G7 after a later gate-failed event', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const events = await readEvidenceEvents(evidenceLogPath);
    const g7 = events.find((event) => event.gateId === 'G7' && event.eventType === 'gate-passed');
    events.push({
      ...g7,
      eventType: 'gate-failed',
      sequence: events.length + 1,
    });
    await writeEvidenceEvents(evidenceLogPath, events);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G7 /u);
    assert.match(result.stdout, /evidence-log\.jsonl/u);
  });
});

test('verify-all reopens G7 after a later failed-pre-diff event', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const events = await readEvidenceEvents(evidenceLogPath);
    const g7 = events.find((event) => event.gateId === 'G7' && event.eventType === 'gate-passed');
    events.push({
      ...g7,
      eventType: 'failed-pre-diff',
      sequence: events.length + 1,
    });
    await writeEvidenceEvents(evidenceLogPath, events);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G7 /u);
    assert.match(result.stdout, /evidence-log\.jsonl/u);
  });
});

test('verify-all reopens G4 after a later implementation-changed event', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const evidenceLogPath = path.join(artifactRoot, 'evidence-log.jsonl');
    const events = await readEvidenceEvents(evidenceLogPath);
    const g4 = events.find((event) => event.gateId === 'G4' && event.eventType === 'gate-passed');
    events.push({
      ...g4,
      eventType: 'implementation-changed',
      implementationHash: `sha256:${'c'.repeat(64)}`,
      sequence: events.length + 1,
    });
    await writeEvidenceEvents(evidenceLogPath, events);

    const result = await runVerifyAll([taskId], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G4 /u);
    assert.match(result.stdout, /evidence-log\.jsonl/u);
  });
});

test('verify-all reports G1 before unsupported preflight for an invalid contract version', async () => {
  await withGoldenFixture(async ({ artifactRoot, projectRoot, taskId }) => {
    const taskContractPath = path.join(artifactRoot, 'task-contract.json');
    const taskContract = JSON.parse(await readFile(taskContractPath, 'utf8'));
    taskContract.schemaVersion = 3;
    await writeFile(taskContractPath, `${JSON.stringify(taskContract, null, 2)}\n`);

    const result = await runVerifyAll([taskId, '--preflight-g8'], projectRoot);

    assert.equal(result.signal, null);
    assert.equal(result.code, 1);
    assert.match(result.stdout, /^VERIFY_ALL_CONTRACT_FAILURE gate=G1 /u);
    assert.match(result.stdout, /task-contract\.json/u);
  });
});

test('verify-all reserves exit category 2 for an unreadable consumer project', async () => {
  const result = await runVerifyAll([
    'golden-g0-g8',
    '--project-root',
    path.join(path.dirname(verifyAllPath), 'missing-consumer-project'),
  ], process.cwd());

  assert.equal(result.signal, null);
  assert.equal(result.code, 2);
  assert.match(result.stderr, /^VERIFY_ALL_ENVIRONMENT_FAILURE reason=input\.project-root /u);
});
