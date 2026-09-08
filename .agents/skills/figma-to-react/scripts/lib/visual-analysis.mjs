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
const allowedStatuses = new Set(['match', 'mismatch', 'not-applicable']);

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

export function closeEnough(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(right)) * 8;
  return Math.abs(left - right) <= tolerance;
}

function parseAnalysis(source, diagnostics) {
  const lines = source.replace(/\r\n?/gu, '\n').split('\n');
  const containsHtml =
    /<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z][A-Za-z0-9-]*(?:\s|\/?>)|<![A-Z]|<!\[CDATA\[|<\?/iu.test(
      source,
    );
  const containsFence = lines.some((line) => /^ {0,3}(?:`{3,}|~{3,})/u.test(line));
  if (containsHtml || containsFence) {
    addDiagnostic(
      diagnostics,
      'analysis.markdown-visibility',
      '$.analysis',
      'Analysis must not hide its canonical table in HTML or a fenced code block.',
    );
    return undefined;
  }
  const tableLines = lines.filter((line) => /^ {0,3}\|/u.test(line));
  const parseRow = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];
    const cells = [];
    let cell = '';
    for (let index = 1; index < trimmed.length - 1; index += 1) {
      const character = trimmed[index];
      if (character === '\\' && trimmed[index + 1] === '|') {
        cell += '|';
        index += 1;
      } else if (character === '|') {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += character;
      }
    }
    cells.push(cell.trim());
    return cells;
  };
  if (tableLines.length < 2) {
    addDiagnostic(
      diagnostics,
      'analysis.categories',
      '$.analysis',
      'Analysis must contain the canonical table.',
    );
    return undefined;
  }

  const expectedHeader = ['Category', 'Status', 'Evidence', 'Diagnosis', 'Disposition'];
  const header = parseRow(tableLines[0]);
  if (
    header.length !== expectedHeader.length ||
    header.some((cell, index) => cell !== expectedHeader[index])
  ) {
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
    if (!allowedStatuses.has(status)) {
      addDiagnostic(
        diagnostics,
        'analysis.status',
        `$.analysis.${row[0]}.Status`,
        'Analysis status must be match, mismatch, or not-applicable.',
      );
    } else if (
      (status === 'match' && row[4] !== 'accepted: no action') ||
      (status === 'not-applicable' && row[4] !== 'not applicable: no action')
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

  const categoryIndexes = result.issues.map((issue) =>
    analysisCategories.indexOf(issue.category),
  );
  if (
    categoryIndexes.some(
      (value, index) => index > 0 && value < categoryIndexes[index - 1],
    )
  ) {
    addDiagnostic(
      diagnostics,
      'result.issue-order',
      '$.issues',
      'Issues must follow category order.',
    );
  }
  return true;
}

function validateResultSemantics({
  raw,
  result,
  rows,
  diagnostics,
  mappingValid,
  isFinalIteration,
  measured,
}) {
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

  const trustedMetrics = measured ?? raw;
  if (isFinalIteration && trustedMetrics.differenceRatio > 15) {
    addDiagnostic(
      diagnostics,
      'iteration.threshold',
      '$.differenceRatio',
      'Final strict evidence must not exceed 15 percentage points.',
    );
  }
  if (!closeEnough(result.differenceRatio, trustedMetrics.differenceRatio)) {
    addDiagnostic(
      diagnostics,
      'result.ratio',
      '$.differenceRatio',
      'Result ratio must equal the independently measured ratio.',
    );
  }
  if (result.implementationHash !== raw.implementationHash) {
    addDiagnostic(
      diagnostics,
      'result.implementation-hash',
      '$.implementationHash',
      'Raw and result records must identify the same implementation.',
    );
  }
  if (!mappingValid) return;

  const mismatches = rows.filter((row) => row.status === 'mismatch');
  if (trustedMetrics.differenceRatio > 0 && mismatches.length === 0) {
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
        trustedMetrics.differenceRatio > 0 &&
        trustedMetrics.differenceRatio <= 15 &&
        /\bmicro\b/iu.test(row.diagnosis) &&
        !/\bmacro\b/iu.test(row.diagnosis) &&
        row.disposition.startsWith('accepted micro residual:') &&
        !protectedResidualCategories.has(row.category)
      ),
  );

  let expectedStatus = 'failed';
  if (trustedMetrics.differenceRatio === 0 && mismatches.length === 0) {
    expectedStatus = 'pixel-perfect';
  } else if (
    trustedMetrics.differenceRatio > 0 &&
    trustedMetrics.differenceRatio <= 15 &&
    mismatches.length > 0 &&
    blockingMismatches.length === 0
  ) {
    expectedStatus = 'strict-visual-accepted';
  }
  if (result.status !== expectedStatus) {
    addDiagnostic(
      diagnostics,
      'result.status',
      '$.status',
      'Result status must reflect ratio and category-gate semantics.',
    );
  }
  if (isFinalIteration && trustedMetrics.differenceRatio <= 15) {
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

export function validateVisualAnalysis({
  source,
  raw,
  result,
  diagnostics,
  isFinalIteration,
  measured,
}) {
  const rows = typeof source === 'string' ? parseAnalysis(source, diagnostics) : undefined;
  const mappingValid = validateAnalysisSemantics(rows, result, diagnostics);
  validateResultSemantics({
    raw,
    result,
    rows,
    diagnostics,
    mappingValid,
    isFinalIteration,
    measured,
  });
}
