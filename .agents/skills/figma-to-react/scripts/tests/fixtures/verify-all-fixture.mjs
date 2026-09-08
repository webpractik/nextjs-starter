import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

const taskId = 'golden-g0-g8';
const implementationHash = `sha256:${'a'.repeat(64)}`;

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function checksum(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function crc32(content) {
  let value = 0xffffffff;
  for (const byte of content) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, content) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + content.length);
  chunk.writeUInt32BE(content.length, 0);
  typeBuffer.copy(chunk, 4);
  content.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, content])), 8 + content.length);
  return chunk;
}

function createPng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let row = 0; row < height; row += 1) {
    const rawOffset = row * (width * 4 + 1);
    raw[rawOffset] = 0;
    pixels.copy(raw, rawOffset + 1, row * width * 4, (row + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function createAnalysis() {
  const categories = [
    'geometry',
    'spacing',
    'typography',
    'colors',
    'borders and shadows',
    'assets',
    'responsive behavior',
    'missing or extra elements',
  ];
  return [
    '| Category | Status | Evidence | Diagnosis | Disposition |',
    '| --- | --- | --- | --- | --- |',
    ...categories.map(
      (category) =>
        `| ${category} | match | Exact golden comparison completed. | No mismatch detected. | accepted — no action |`,
    ),
    '',
  ].join('\n');
}

export async function createGoldenConsumerProject() {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'figma-to-react-verify-all-'));
  const artifactRoot = `artifacts/visual/${taskId}`;
  const visualCaseId = 'golden-visual';
  const caseRoot = `${artifactRoot}/${visualCaseId}`;
  const iterationRoot = `${caseRoot}/iterations/001`;
  const hashes = new Map();

  async function writeArtifact(relativePath, content) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const absolutePath = path.join(projectRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
    const hash = checksum(buffer);
    hashes.set(relativePath, hash);
    return hash;
  }

  async function writeJson(relativePath, value) {
    return writeArtifact(relativePath, serializeJson(value));
  }

  const matchingPixels = Buffer.from([
    10, 20, 30, 255,
    40, 50, 60, 255,
    70, 80, 90, 255,
    100, 110, 120, 255,
  ]);
  const comparisonReference = createPng(2, 2, matchingPixels);
  const comparisonActualPixels = Buffer.from(matchingPixels);
  comparisonActualPixels[0] = 255;
  const conformanceActual = createPng(2, 2, comparisonActualPixels);

  const taskContractPath = `${artifactRoot}/task-contract.json`;
  const captureContractPath = `${artifactRoot}/capture-contract.json`;
  const sourceManifestPath = `${artifactRoot}/source-manifest.json`;
  const designContextPath = `${artifactRoot}/design-context.json`;
  const compatibilityPath = `${artifactRoot}/compatibility.md`;
  const preCodePath = `${artifactRoot}/pre-code-evidence.md`;
  const finalReportPath = `${artifactRoot}/final-report.md`;
  const sourcePath = `${artifactRoot}/sources/golden-source.png`;
  const referencePath = `${caseRoot}/reference.png`;
  const mirrorPath = `tests/visual/references/figma/${taskId}/${visualCaseId}.png`;
  const conformanceReferencePath = `${artifactRoot}/conformance/reference.png`;
  const conformanceActualPath = `${artifactRoot}/conformance/actual.png`;
  const implementationPath = 'src/features/golden/Screen.tsx';
  const qualityPath = `${artifactRoot}/quality-q1-q4.md`;
  const projectChecksPath = `${artifactRoot}/project-checks.md`;

  const task = {
    schemaVersion: 1,
    taskId,
    profile: 'strict-internal',
    source: {
      figmaUrl: 'https://www.figma.com/design/golden?node-id=1-2',
      nodeId: '1:2',
    },
    target: {
      route: '/golden',
      featureModule: 'src/features/golden',
    },
    scope: {
      include: ['golden verification screen'],
      exclude: [],
    },
    viewports: [{ id: 'golden', width: 2, height: 2, dpr: 1 }],
    states: [{ id: 'default', applicability: 'required', evidence: null }],
    data: { fixture: 'src/features/golden/fixture.ts' },
    provisioning: {
      assetMaterialization: 'available',
      recharts: 'not-required',
      agentBrowser: 'available',
      visualCapture: 'available',
      visualCompare: 'available',
      vitestBrowser: 'available',
      playwright: 'available',
      agentVerify: 'available',
    },
    acceptance: {
      qualityGates: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'],
      comparatorProfile: 'rgba-exact-v1',
      maxDifferenceRatio: 15,
      requireEightCategoryAnalysis: true,
      requireProjectChecks: true,
    },
  };

  const capture = {
    schemaVersion: 1,
    cases: [
      {
        caseId: visualCaseId,
        taskId,
        nodeId: '1:2',
        route: '/golden',
        captureRegion: { kind: 'viewport', selector: null },
        viewport: { width: 2, height: 2, dpr: 1 },
        state: 'default',
        fixture: 'src/features/golden/fixture.ts',
        locale: 'en-US',
        timezone: 'UTC',
        rendering: {
          colorScheme: 'light',
          reducedMotion: 'reduce',
          scrollbarPolicy: 'stable',
        },
        environment: {
          browser: 'chromium',
          os: 'linux',
          container: 'golden-fixture',
          headless: true,
          fontHashes: [
            { family: 'Golden Sans', hash: `sha256:${'b'.repeat(64)}` },
          ],
        },
        comparatorProfile: 'rgba-exact-v1',
        readiness: ['document.fonts.status === \'loaded\''],
        reference: {
          sourceId: 'golden-source',
          path: referencePath,
          checksum: checksum(comparisonReference),
          dimensions: { width: 2, height: 2 },
        },
        selectors: {
          primaryLayout: ['[data-testid="golden-layout"]'],
          dynamicText: ['[data-testid="golden-copy"]'],
          visibility: ['[data-testid="golden-layout"]'],
        },
        evidenceMode: 'visual-reference',
      },
    ],
  };

  await writeArtifact(compatibilityPath, 'React, TypeScript, and Tailwind compatibility confirmed.\n');
  await writeJson(designContextPath, { nodeId: '1:2', source: 'golden fixture' });
  await writeArtifact(implementationPath, 'export const GoldenScreen = () => null;\n');
  await writeArtifact('src/features/golden/fixture.ts', 'export const fixture = {};\n');
  await writeArtifact(preCodePath, 'Repository mapping completed before implementation.\n');
  await writeArtifact(qualityPath, 'Q1 through Q4 passed for the golden fixture.\n');
  await writeArtifact(projectChecksPath, 'node --check src/features/golden/Screen.tsx: pass\n');
  await writeArtifact(finalReportPath, '# Golden verification report\n\nG0 through G8 passed.\n');
  await writeArtifact(sourcePath, comparisonReference);
  await writeArtifact(referencePath, comparisonReference);
  await writeArtifact(mirrorPath, comparisonReference);
  await writeArtifact(conformanceReferencePath, comparisonReference);
  await writeArtifact(conformanceActualPath, conformanceActual);

  await writeJson(sourceManifestPath, {
    schemaVersion: 1,
    taskId,
    sources: [
      {
        sourceId: 'golden-source',
        nodeId: '1:2',
        kind: 'png',
        path: sourcePath,
        checksum: hashes.get(sourcePath),
        logicalDimensions: { width: 2, height: 2 },
        pixelDimensions: { width: 2, height: 2 },
        rasterization: null,
      },
    ],
  });
  await writeJson(taskContractPath, task);
  await writeJson(captureContractPath, capture);
  await writeJson(`${artifactRoot}/comparator-conformance.json`, {
    schemaVersion: 1,
    profile: 'rgba-exact-v1',
    pixelThreshold: 0,
    antialiasPolicy: 'count',
    fixtures: {
      reference: conformanceReferencePath,
      actual: conformanceActualPath,
    },
    expected: { differentPixels: 1, totalPixels: 4, differenceRatio: 25 },
    actual: { differentPixels: 1, totalPixels: 4, differenceRatio: 25 },
    passed: true,
  });

  const rawPath = `${iterationRoot}/raw.json`;
  const analysisPath = `${iterationRoot}/analysis.md`;
  const resultPath = `${iterationRoot}/result.json`;
  const actualPath = `${iterationRoot}/actual.png`;
  const iterationReferencePath = `${iterationRoot}/reference.png`;
  const diffPath = `${iterationRoot}/diff.png`;
  const overlayPath = `${iterationRoot}/overlay.png`;

  await writeArtifact(actualPath, comparisonReference);
  await writeArtifact(iterationReferencePath, comparisonReference);
  await writeArtifact(diffPath, comparisonReference);
  await writeArtifact(overlayPath, comparisonReference);
  await writeJson(rawPath, {
    schemaVersion: 1,
    success: true,
    error: null,
    comparator: 'rgba-exact-v1',
    pixelThreshold: 0,
    antialiasPolicy: 'count',
    differentPixels: 0,
    totalPixels: 4,
    differenceRatio: 0,
    dimensionMismatch: null,
    referenceDimensions: { width: 2, height: 2 },
    actualDimensions: { width: 2, height: 2 },
    diff: diffPath,
    overlay: overlayPath,
  });
  await writeArtifact(analysisPath, createAnalysis());
  await writeJson(resultPath, {
    schemaVersion: 1,
    iteration: 1,
    reference: iterationReferencePath,
    actual: actualPath,
    diff: diffPath,
    overlay: overlayPath,
    raw: rawPath,
    analysis: analysisPath,
    viewport: '2x2',
    differenceRatio: 0,
    dimensionMismatch: null,
    status: 'pixel-perfect',
    issues: [],
  });

  function event(gateId, eventType, artifactPaths, extras = {}) {
    return {
      schemaVersion: 1,
      sequence: 0,
      taskId,
      gateId,
      eventType,
      artifactHashes: artifactPaths.map((artifactPath) => ({
        path: artifactPath,
        hash: hashes.get(artifactPath),
      })),
      implementationHash,
      ...extras,
    };
  }

  const events = [
    event('G0', 'gate-passed', [compatibilityPath]),
    event('G1', 'gate-passed', [taskContractPath]),
    event('G2', 'gate-passed', [designContextPath, sourceManifestPath]),
    event('G3', 'gate-passed', [preCodePath, captureContractPath]),
    event('G4', 'gate-passed', [implementationPath]),
    event('G5', 'gate-passed', [qualityPath]),
    event('G6', 'gate-passed', [projectChecksPath]),
    event('G7', 'iteration-completed', [resultPath], {
      caseId: visualCaseId,
      iteration: 1,
      evidencePath: resultPath,
    }),
    event('G7', 'gate-passed', [resultPath]),
    event('G8', 'gate-passed', [finalReportPath]),
  ].map((item, index) => ({ ...item, sequence: index + 1 }));
  await writeArtifact(`${artifactRoot}/evidence-log.jsonl`, `${events.map(JSON.stringify).join('\n')}\n`);

  return {
    artifactRoot: path.join(projectRoot, artifactRoot),
    projectRoot,
    rawPath: path.join(projectRoot, rawPath),
    sourceManifestPath: path.join(projectRoot, sourceManifestPath),
    taskId,
  };
}
