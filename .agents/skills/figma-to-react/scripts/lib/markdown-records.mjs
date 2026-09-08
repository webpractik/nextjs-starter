import { readFile } from 'node:fs/promises';

const templateEntries = await Promise.all(
  [
    ['compatibility', '../../templates/compatibility.md'],
    ['preCode', '../../templates/pre-code-evidence.md'],
    ['finalReport', '../../templates/final-report.md'],
  ].map(async ([name, relativePath]) => [
    name,
    await readFile(new URL(relativePath, import.meta.url), 'utf8'),
  ]),
);

const templates = Object.fromEntries(templateEntries);

const capabilityRows = [
  ['Получение и сохранение ресурсов', 'assetMaterialization'],
  ['Управление браузером', 'agentBrowser'],
  ['Снимок интерфейса', 'visualCapture'],
  ['Сравнение изображений', 'visualCompare'],
  ['Vitest Browser', 'vitestBrowser'],
  ['Playwright', 'playwright'],
  ['Проверка агентом', 'agentVerify'],
];

const gateIds = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'];
const qualityIds = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
const blockHtmlNames = new Set([
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'search',
  'section',
  'script',
  'pre',
  'style',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'textarea',
  'ul',
]);
const voidHtmlNames = new Set([
  'area',
  'base',
  'basefont',
  'br',
  'col',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'link',
  'menuitem',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

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

function normalizeLineEndings(source) {
  return source.replace(/\r\n?/gu, '\n');
}

function blankExceptLineEndings(value) {
  return value.replace(/[^\n]/gu, ' ');
}

function maskHtmlCommentsOutsideCodeSpans(source) {
  let result = '';
  let rawHtmlFound = false;
  let index = 0;

  while (index < source.length) {
    if (source[index] === '`' && !isBackslashEscaped(source, index)) {
      let openingLength = 1;
      while (source[index + openingLength] === '`') openingLength += 1;
      let closingIndex = index + openingLength;
      while (closingIndex < source.length) {
        if (source[closingIndex] !== '`') {
          closingIndex += 1;
          continue;
        }
        let closingLength = 1;
        while (source[closingIndex + closingLength] === '`') closingLength += 1;
        if (closingLength === openingLength) break;
        closingIndex += closingLength;
      }
      if (closingIndex < source.length) {
        const end = closingIndex + openingLength;
        result += source.slice(index, end);
        index = end;
        continue;
      }
    }

    if (source.startsWith('<!--', index)) {
      rawHtmlFound = true;
      const closingIndex = source.indexOf('-->', index + 4);
      const end = closingIndex === -1 ? source.length : closingIndex + 3;
      result += blankExceptLineEndings(source.slice(index, end));
      index = end;
      continue;
    }

    result += source[index];
    index += 1;
  }

  return { source: result, rawHtmlFound };
}

function maskNonMarkdownBlocks(source) {
  const maskedComments = maskHtmlCommentsOutsideCodeSpans(source);
  let { rawHtmlFound } = maskedComments;
  let fenceFound = false;
  const withoutComments = maskedComments.source;
  const lines = normalizeLineEndings(withoutComments).split('\n');
  let fence;
  let htmlBlock;

  const maskedLines = lines.map((line) => {
    if (fence) {
      const closingFence = /^ {0,3}(`{3,}|~{3,})[ \t]*$/u.exec(line);
      if (
        closingFence &&
        closingFence[1][0] === fence.marker &&
        closingFence[1].length >= fence.length
      ) {
        fence = undefined;
      }
      return '';
    }
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/u.exec(line);
    const backtickInfoIsValid =
      fenceMatch?.[1]?.[0] !== '`' || !line.slice(fenceMatch[0].length).includes('`');
    if (fenceMatch && backtickInfoIsValid) {
      fenceFound = true;
      fence = { marker: fenceMatch[1][0], length: fenceMatch[1].length };
      return '';
    }

    if (htmlBlock) {
      if (
        (htmlBlock.end === 'blank-line' && line.trim().length === 0) ||
        (htmlBlock.end instanceof RegExp && htmlBlock.end.test(line))
      ) {
        htmlBlock = undefined;
      }
      return '';
    }

    const specialHtmlBlocks = [
      [/^ {0,3}<\?/u, /\?>/u],
      [/^ {0,3}<!\[CDATA\[/u, /\]\]>/u],
      [/^ {0,3}<![A-Z]/u, />/u],
    ];
    for (const [start, end] of specialHtmlBlocks) {
      if (start.test(line)) {
        rawHtmlFound = true;
        if (!end.test(line)) htmlBlock = { end };
        return '';
      }
    }
    if (/^ {0,3}<\/[A-Za-z][A-Za-z0-9-]*(?:\s|>)/u.test(line)) {
      rawHtmlFound = true;
      return '';
    }

    const htmlMatch = /^ {0,3}<([A-Za-z][A-Za-z0-9-]*)(?:\s|\/?>)/u.exec(line);
    const htmlName = htmlMatch?.[1].toLowerCase();
    if (htmlName && blockHtmlNames.has(htmlName)) {
      rawHtmlFound = true;
      const selfClosing = /\/>\s*$/u.test(line);
      const closesHere = new RegExp(`</${htmlName}\\s*>`, 'iu').test(line);
      if (!voidHtmlNames.has(htmlName) && !selfClosing && !closesHere) {
        htmlBlock = {
          end: ['script', 'pre', 'style', 'textarea'].includes(htmlName)
            ? new RegExp(`</${htmlName}\\s*>`, 'iu')
            : 'blank-line',
        };
      }
      return '';
    }
    return line;
  });

  return { lines: maskedLines, rawHtmlFound, fenceFound };
}

function decodeMarkdownText(value) {
  return value
    .replace(/\\([\\`*{}\[\]()#+.!|_<>~-])/gu, '$1')
    .replace(
      /&(?:#([0-9]+)|#x([0-9a-f]+)|amp|lt|gt|quot|apos|vert);/giu,
      (entity, decimal, hexadecimal) => {
        if (decimal !== undefined || hexadecimal !== undefined) {
          const codePoint = Number.parseInt(decimal ?? hexadecimal, decimal === undefined ? 16 : 10);
          return codePoint > 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
            ? String.fromCodePoint(codePoint)
            : '\uFFFD';
        }
        return {
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&apos;': "'",
          '&vert;': '|',
        }[entity.toLowerCase()];
      },
    );
}

function stripInlineHtml(value) {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    if (
      value[index] !== '<' ||
      !/^<\/?[A-Za-z][A-Za-z0-9-]*(?:\s|\/?>)/u.test(value.slice(index))
    ) {
      result += value[index];
      continue;
    }

    let quote;
    let closingIndex = index + 1;
    for (; closingIndex < value.length; closingIndex += 1) {
      const character = value[closingIndex];
      if (quote) {
        if (character === quote) quote = undefined;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      } else if (character === '\n') {
        break;
      }
    }
    if (value[closingIndex] !== '>') {
      result += value[index];
      continue;
    }
    index = closingIndex;
  }
  return result;
}

function isBackslashEscaped(value, index) {
  let backslashes = 0;
  for (let offset = index - 1; offset >= 0 && value[offset] === '\\'; offset -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function mapMarkdownCodeSpans(value, mapText, mapCode) {
  let result = '';
  let textStart = 0;
  let index = 0;

  while (index < value.length) {
    if (value[index] !== '`' || isBackslashEscaped(value, index)) {
      index += 1;
      continue;
    }

    let openingLength = 1;
    while (value[index + openingLength] === '`') openingLength += 1;
    let closingIndex = index + openingLength;
    while (closingIndex < value.length) {
      if (value[closingIndex] !== '`') {
        closingIndex += 1;
        continue;
      }
      let closingLength = 1;
      while (value[closingIndex + closingLength] === '`') closingLength += 1;
      if (closingLength === openingLength) break;
      closingIndex += closingLength;
    }

    if (closingIndex >= value.length) {
      index += openingLength;
      continue;
    }

    result += mapText(value.slice(textStart, index));
    result += mapCode(value.slice(index + openingLength, closingIndex));
    index = closingIndex + openingLength;
    textStart = index;
  }

  result += mapText(value.slice(textStart));
  return result;
}

function normalizeCodeSpanText(value) {
  let normalized = normalizeLineEndings(value).replace(/\n/gu, ' ');
  if (
    normalized.startsWith(' ') &&
    normalized.endsWith(' ') &&
    /[^ ]/u.test(normalized)
  ) {
    normalized = normalized.slice(1, -1);
  }
  return normalized;
}

function unwrapWholeCodeSpan(value) {
  const trimmed = value.trim();
  const opening = /^`+/u.exec(trimmed)?.[0];
  const closing = /`+$/u.exec(trimmed)?.[0];
  if (!opening || !closing || opening.length !== closing.length) return undefined;
  const inner = trimmed.slice(opening.length, -closing.length);
  if ([...inner.matchAll(/`+/gu)].some((match) => match[0].length === opening.length)) {
    return undefined;
  }
  return normalizeCodeSpanText(inner);
}

function semanticText(value) {
  return mapMarkdownCodeSpans(
    value,
    (text) =>
      stripInlineHtml(
        decodeMarkdownText(text)
          .replace(/<(https?:\/\/[^ <>\n]+)>/giu, '$1')
          .replace(/<mailto:([^ <>\n]+)>/giu, '$1'),
      ),
    (code) => normalizeCodeSpanText(code),
  ).trim();
}

function splitTableLine(line) {
  if (/^(?: {4,}|\t)/u.test(line)) return undefined;
  const value = line.trim();
  if (!value.includes('|')) return undefined;

  const cells = [];
  let cell = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '\\' && value[index + 1] === '|') {
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
  if (cells[0] === '') cells.shift();
  if (cells.at(-1) === '') cells.pop();
  return cells;
}

function isTableSeparator(cells) {
  return (
    Array.isArray(cells) &&
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/u.test(cell))
  );
}

function tableSignature(sectionPath, header) {
  return JSON.stringify([sectionPath ?? '', ...header]);
}

function fieldSignature(sectionPath, label) {
  return JSON.stringify([sectionPath ?? '', label]);
}

function currentHeadingPath(headingStack) {
  return headingStack
    .map((text, index) => (text ? `${index + 1}:${text}` : undefined))
    .filter(Boolean)
    .join('\0');
}

function parseField(line) {
  const bullet = /^ {0,3}[-*+]\s+(.+)$/u.exec(line);
  if (!bullet) return undefined;
  const value = bullet[1];
  let codeFenceLength = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '`') {
      let run = 1;
      while (value[index + run] === '`') run += 1;
      codeFenceLength = codeFenceLength === 0 ? run : codeFenceLength === run ? 0 : codeFenceLength;
      index += run - 1;
    } else if (value[index] === ':' && codeFenceLength === 0) {
      return {
        label: value.slice(0, index + 1).trim(),
        value: value.slice(index + 1).trim(),
      };
    }
  }
  return undefined;
}

function parseDocument(source) {
  const { lines, rawHtmlFound, fenceFound } = maskNonMarkdownBlocks(source);
  const headings = [];
  const fields = new Map();
  const tables = [];
  const sectionLines = new Map();
  const prose = [];
  const headingStack = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headingMatch = /^ {0,3}(#{1,6})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/u.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = semanticText(headingMatch[2]);
      headingStack.splice(level - 1);
      headingStack[level - 1] = text;
      headings.push({ level, text, path: currentHeadingPath(headingStack) });
      continue;
    }

    const section = [...headingStack].reverse().find(Boolean);
    const sectionPath = currentHeadingPath(headingStack);
    if (sectionPath) {
      const existing = sectionLines.get(sectionPath) ?? [];
      existing.push(line);
      sectionLines.set(sectionPath, existing);
    }

    const possibleHeader = splitTableLine(line);
    const possibleSeparator = splitTableLine(lines[index + 1] ?? '');
    if (
      possibleHeader &&
      possibleSeparator &&
      possibleHeader.length === possibleSeparator.length &&
      isTableSeparator(possibleSeparator)
    ) {
      const body = [];
      index += 2;
      while (index < lines.length) {
        const row = splitTableLine(lines[index]);
        if (!row || row.length !== possibleHeader.length) break;
        body.push(row);
        index += 1;
      }
      index -= 1;
      tables.push({
        section,
        sectionPath,
        header: possibleHeader.map(semanticText),
        body,
      });
      continue;
    }

    const field = parseField(line);
    if (field) {
      const occurrences = fields.get(field.label) ?? [];
      occurrences.push({ value: field.value, sectionPath });
      fields.set(field.label, occurrences);
      continue;
    }
    if (line.trim().length > 0) {
      prose.push({ sectionPath, line: line.trim() });
    }
  }

  return {
    rawSource: normalizeLineEndings(source),
    visibleSource: lines.join('\n'),
    rawHtmlFound,
    fenceFound,
    headings,
    fields,
    tables,
    sectionLines,
    prose,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function templateProsePattern(line) {
  const parts = line.split(/(<[^>\r\n]+>)/gu);
  const expression = parts
    .map((part) => (/^<[^>\r\n]+>$/u.test(part) ? '.+' : escapeRegExp(part)))
    .join('');
  return new RegExp(`^${expression}$`, 'u');
}

function placeholdersFromTemplate(source) {
  return [
    ...new Set(
      [...source.matchAll(/<[^>\r\n]+>/gu)]
        .map((match) => match[0])
        .filter(
          (value) =>
            !/^<(?:https?:\/\/|mailto:)/iu.test(value) &&
            !/^<[^ <>@]+@[^ <>@]+>$/u.test(value),
        ),
    ),
  ];
}

function templateRequirements(source, document) {
  const placeholders = placeholdersFromTemplate(source);
  const headingCounts = new Map();
  const fieldCounts = new Map();
  const tableCounts = new Map();
  for (const heading of document.headings) {
    const signature = heading.path;
    headingCounts.set(signature, (headingCounts.get(signature) ?? 0) + 1);
  }
  for (const [label, entries] of document.fields) {
    if (!placeholders.some((placeholder) => label.includes(placeholder))) {
      for (const { sectionPath } of entries) {
        const signature = fieldSignature(sectionPath, label);
        fieldCounts.set(signature, (fieldCounts.get(signature) ?? 0) + 1);
      }
    }
  }
  for (const table of document.tables) {
    const signature = tableSignature(table.sectionPath, table.header);
    tableCounts.set(signature, (tableCounts.get(signature) ?? 0) + 1);
  }
  return {
    headingCounts,
    fieldCounts,
    tableCounts,
    placeholders,
    prosePatterns: document.prose.map(({ sectionPath, line }) => ({
      sectionPath,
      pattern: templateProsePattern(line),
    })),
  };
}

const templateDocuments = Object.fromEntries(
  Object.entries(templates).map(([name, source]) => [name, parseDocument(source)]),
);
const requirements = Object.fromEntries(
  Object.entries(templates).map(([name, source]) => [
    name,
    templateRequirements(source, templateDocuments[name]),
  ]),
);

function countBy(values, signatureFor) {
  const counts = new Map();
  for (const value of values) {
    const signature = signatureFor(value);
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  return counts;
}

function validateTemplateShape(document, expected, idPrefix, diagnosticPath, diagnostics) {
  const withoutCodeSpans = mapMarkdownCodeSpans(
    document.visibleSource,
    (text) => text,
    (code) => blankExceptLineEndings(code),
  );
  const withoutAutolinks = withoutCodeSpans
    .replace(/<https?:\/\/[^ <>\n]+>/giu, '')
    .replace(/<mailto:[^ <>\n]+>/giu, '');
  if (
    document.rawHtmlFound ||
    /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s|\/?>)/u.test(withoutAutolinks)
  ) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.html`,
      diagnosticPath,
      'Raw HTML is not allowed in a Markdown evidence record.',
    );
  }
  if (document.fenceFound) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.fence`,
      diagnosticPath,
      'Fenced code blocks are not allowed in a Markdown evidence record.',
    );
  }
  const headingCounts = countBy(
    document.headings,
    ({ path: headingPath }) => headingPath,
  );
  for (const [signature, count] of expected.headingCounts) {
    if ((headingCounts.get(signature) ?? 0) !== count) {
      const lastHeading = signature.split('\0').at(-1) ?? '';
      const separator = lastHeading.indexOf(':');
      const level = lastHeading.slice(0, separator);
      const text = lastHeading.slice(separator + 1);
      addDiagnostic(
        diagnostics,
        `${idPrefix}.heading`,
        diagnosticPath,
        `Missing template heading: ${'#'.repeat(Number(level))} ${text}.`,
      );
    }
  }
  for (const signature of headingCounts.keys()) {
    if (!expected.headingCounts.has(signature)) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.heading-extra`,
        diagnosticPath,
        'Markdown evidence must not add headings outside the template.',
      );
    }
  }

  const actualFieldCounts = new Map();
  for (const [label, entries] of document.fields) {
    for (const { sectionPath } of entries) {
      const signature = fieldSignature(sectionPath, label);
      actualFieldCounts.set(signature, (actualFieldCounts.get(signature) ?? 0) + 1);
    }
  }
  for (const [signature, count] of expected.fieldCounts) {
    if ((actualFieldCounts.get(signature) ?? 0) !== count) {
      const [sectionPath, label] = JSON.parse(signature);
      const section = sectionPath.split('\0').at(-1)?.replace(/^\d+:/u, '') ?? '';
      addDiagnostic(
        diagnostics,
        `${idPrefix}.field`,
        diagnosticPath,
        `Section "${section}" is missing template field label: ${label}`,
      );
    }
  }
  for (const signature of actualFieldCounts.keys()) {
    if (!expected.fieldCounts.has(signature)) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.field-extra`,
        diagnosticPath,
        'Markdown evidence must not add labeled fields outside the template.',
      );
    }
  }

  const tableCounts = countBy(
    document.tables,
    ({ sectionPath, header }) => tableSignature(sectionPath, header),
  );
  for (const [signature, count] of expected.tableCounts) {
    if ((tableCounts.get(signature) ?? 0) !== count) {
      const [sectionPath, ...header] = JSON.parse(signature);
      const section = sectionPath.split('\0').at(-1)?.replace(/^\d+:/u, '') ?? '';
      addDiagnostic(
        diagnostics,
        `${idPrefix}.table-header`,
        diagnosticPath,
        `Missing table in section "${section}" with header: ${header.join(' | ')}.`,
      );
    }
  }
  for (const signature of tableCounts.keys()) {
    if (!expected.tableCounts.has(signature)) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.table-extra`,
        diagnosticPath,
        'Markdown evidence must not add tables outside the template.',
      );
    }
  }
  if (
    document.prose.length !== expected.prosePatterns.length ||
    document.prose.some(
      ({ sectionPath, line }, index) =>
        sectionPath !== expected.prosePatterns[index]?.sectionPath ||
        !expected.prosePatterns[index]?.pattern.test(line),
    )
  ) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.prose`,
      diagnosticPath,
      'Visible prose must preserve the template; free text is allowed only in declared fields.',
    );
  }

}

function normalizeCell(cell) {
  const value = cell.trim();
  const code = unwrapWholeCodeSpan(value);
  return (code ?? decodeMarkdownText(value)).trim();
}

function normalizeOpaqueCell(cell) {
  return cell.trim();
}

function serializeIssuesForMarkdown(issues) {
  const serialized = JSON.stringify(issues);
  if (typeof serialized !== 'string') return undefined;
  return serialized.replace(/[<>&|\u2028\u2029]/gu, (character) =>
    `\\u${character.codePointAt(0).toString(16).padStart(4, '0')}`,
  );
}

function containsLiteral(source, expected) {
  if (typeof expected !== 'string' || expected.length === 0) return false;
  const value = semanticText(source);
  let offset = 0;
  const boundary = /[\p{L}\p{N}_-]/u;
  while (offset <= value.length - expected.length) {
    const index = value.indexOf(expected, offset);
    if (index === -1) return false;
    const before = value[index - 1];
    const after = value[index + expected.length];
    const leftOk = !boundary.test(expected[0]) || before === undefined || !boundary.test(before);
    const rightOk =
      !boundary.test(expected.at(-1)) || after === undefined || !boundary.test(after);
    if (leftOk && rightOk) return true;
    offset = index + 1;
  }
  return false;
}

function requireSingleField(document, label, idPrefix, diagnosticPath, diagnostics) {
  const templateName = templateNameFor(idPrefix);
  const expectedPaths = new Set(
    (templateDocuments[templateName]?.fields.get(label) ?? []).map(
      ({ sectionPath }) => sectionPath,
    ),
  );
  const allEntries = document.fields.get(label) ?? [];
  const entries = allEntries.filter(
    ({ sectionPath }) => expectedPaths.size === 0 || expectedPaths.has(sectionPath),
  );
  if (entries.length !== 1 || allEntries.length !== 1) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.field-count`,
      diagnosticPath,
      `Field ${label} must appear exactly once.`,
    );
    return undefined;
  }
  return entries[0].value;
}

function requireExactField(
  document,
  label,
  expected,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const value = requireSingleField(document, label, idPrefix, diagnosticPath, diagnostics);
  if (value !== undefined && semanticText(value) !== expected) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.field-value`,
      diagnosticPath,
      `Field ${label} must equal ${expected}.`,
    );
  }
  return value;
}

function requireNonEmptyField(
  document,
  label,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const value = requireSingleField(document, label, idPrefix, diagnosticPath, diagnostics);
  const visibleValue = value === undefined ? undefined : semanticText(value);
  if (
    visibleValue !== undefined &&
    (visibleValue.length === 0 || /^<[^<>\r\n]+>$/u.test(visibleValue))
  ) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.field-value`,
      diagnosticPath,
      `Field ${label} requires a filled visible value; use "нет" when there is nothing to report.`,
    );
  }
  return value;
}

function cellIsUnfilled(value) {
  const normalized = normalizeCell(value);
  return normalized.length === 0 || /^<[^<>\r\n]+>$/u.test(normalized);
}

function requireFilledManualTable(
  document,
  section,
  header,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const table = findTable(
    document,
    section,
    header,
    idPrefix,
    diagnosticPath,
    diagnostics,
  );
  if (!table) return;
  if (table.body.length === 0 || table.body.some((row) => row.some(cellIsUnfilled))) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.value`,
      diagnosticPath,
      `Section "${section}" requires at least one fully filled row.`,
    );
  }
}

function requireFilledProseSection(
  document,
  templateName,
  heading,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const sectionPath = expectedHeadingPath(templateName, heading);
  const lines = document.prose.filter((entry) => entry.sectionPath === sectionPath);
  if (
    lines.length === 0 ||
    lines.some(({ line }) => {
      const value = semanticText(line);
      return value.length === 0 || /^<[^<>\r\n]+>$/u.test(value);
    })
  ) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.value`,
      diagnosticPath,
      `Section "${heading}" requires filled visible prose.`,
    );
  }
}

function requireExactUrlField(
  document,
  label,
  expected,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const value = requireSingleField(document, label, idPrefix, diagnosticPath, diagnostics);
  if (value === undefined) return value;
  const code = unwrapWholeCodeSpan(value);
  const unwrapped = code ?? decodeMarkdownText(value).trim();
  const autolink = code === undefined
    ? /^<(https?:\/\/[^ <>\n]+)>$/iu.exec(unwrapped)
    : undefined;
  const markdownLink = code === undefined
    ? /^\[[^\]]+\]\((https?:\/\/[^\s)]+)(?:\s+['"][^'"]*['"])?\)$/iu.exec(
        unwrapped,
      )
    : undefined;
  const actual = code ?? autolink?.[1] ?? markdownLink?.[1] ?? semanticText(unwrapped);
  if (actual !== expected) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.field-value`,
      diagnosticPath,
      `Field ${label} must identify the exact URL ${expected}.`,
    );
  }
  return value;
}

function requireFieldLiterals(
  document,
  label,
  expectedValues,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const value = requireSingleField(document, label, idPrefix, diagnosticPath, diagnostics);
  if (value === undefined) return;
  for (const expected of expectedValues.filter(
    (item) => typeof item === 'string' && item.length > 0,
  )) {
    if (!containsLiteral(value, expected)) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.field-value`,
        diagnosticPath,
        `Field ${label} does not contain the contract value ${expected}.`,
      );
    }
  }
}

function requireFieldPairs(
  document,
  label,
  expectedPairs,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const value = requireSingleField(document, label, idPrefix, diagnosticPath, diagnostics);
  if (value === undefined) return;
  for (const [left, right] of expectedPairs) {
    const expected = `${left}: ${right}`;
    if (!containsLiteral(value, expected)) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.field-value`,
        diagnosticPath,
        `Field ${label} does not contain the associated contract pair ${expected}.`,
      );
    }
  }
}

function templateNameFor(idPrefix) {
  if (idPrefix.startsWith('compatibility')) return 'compatibility';
  if (idPrefix.startsWith('pre-code')) return 'preCode';
  if (idPrefix.startsWith('final-report')) return 'finalReport';
  return undefined;
}

function expectedHeadingPath(templateName, headingText) {
  const matches = (templateDocuments[templateName]?.headings ?? []).filter(
    ({ text }) => text === headingText,
  );
  return matches.length === 1 ? matches[0].path : undefined;
}

function findTable(document, section, header, idPrefix, diagnosticPath, diagnostics) {
  const templateName = templateNameFor(idPrefix);
  const expectedPath = (templateDocuments[templateName]?.tables ?? []).find(
    (table) =>
      table.section === section &&
      table.header.length === header.length &&
      table.header.every((cell, index) => cell === header[index]),
  )?.sectionPath;
  const matches = document.tables.filter(
    (table) =>
      table.section === section &&
      expectedPath !== undefined &&
      table.sectionPath === expectedPath &&
      table.header.length === header.length &&
      table.header.every((cell, index) => cell === header[index]),
  );
  if (matches.length !== 1) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.table-count`,
      diagnosticPath,
      `Section "${section}" must contain exactly one table with header: ${header.join(' | ')}.`,
    );
  }
  return matches[0];
}

function validateRowsById({
  table,
  expected,
  idIndex = 0,
  idPrefix,
  diagnosticPath,
  diagnostics,
  validateRow,
}) {
  if (!table) return;
  if (table.body.length !== expected.length) {
    addDiagnostic(
      diagnostics,
      `${idPrefix}.row-count`,
      diagnosticPath,
      `Expected ${expected.length} data rows, found ${table.body.length}.`,
    );
  }
  const expectedIds = expected.map((expectedItem) =>
    typeof expectedItem === 'string' ? expectedItem : expectedItem.id,
  );
  for (const [index, expectedItem] of expected.entries()) {
    const expectedId = typeof expectedItem === 'string' ? expectedItem : expectedItem.id;
    const matches = table.body.filter((row) => normalizeCell(row[idIndex] ?? '') === expectedId);
    if (matches.length !== 1) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.row-identity`,
        diagnosticPath,
        `Row ${expectedId} must appear exactly once.`,
      );
    } else if (normalizeCell(table.body[index]?.[idIndex] ?? '') !== expectedId) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.row-order`,
        diagnosticPath,
        `Row ${expectedId} must appear at position ${index + 1}.`,
      );
      validateRow?.(matches[0], expectedItem);
    } else {
      validateRow?.(matches[0], expectedItem);
    }
  }
  for (const [index, row] of table.body.entries()) {
    const actualId = normalizeCell(row[idIndex] ?? '');
    if (!expectedIds.includes(actualId)) {
      addDiagnostic(
        diagnostics,
        `${idPrefix}.row-identity`,
        diagnosticPath,
        `Unexpected row ${actualId || index + 1}.`,
      );
    }
  }
}

function valuesFromTask(task, path) {
  let current = task;
  for (const segment of path) current = current?.[segment];
  return Array.isArray(current) ? current : [];
}

function validateSourceInput(source, idPrefix, diagnosticPath, diagnostics) {
  if (typeof source === 'string' && source.trim().length > 0 && !source.includes('\0')) {
    return parseDocument(source);
  }
  addDiagnostic(
    diagnostics,
    `${idPrefix}.source`,
    diagnosticPath,
    'Markdown source must be a non-empty string without NUL characters.',
  );
  return undefined;
}

function defaultPath(task, fileName) {
  return `artifacts/visual/${task?.taskId ?? '<task-id>'}/${fileName}`;
}

function contractScalar(value) {
  return value === null ? 'null' : value ?? '';
}

function finalCaseEvidencePath(task, captureCase, finalResults) {
  if (captureCase?.evidenceMode !== 'visual-reference') {
    return captureCase?.evidencePath;
  }
  const result = finalResults?.get(captureCase.caseId);
  if (!Number.isInteger(result?.iteration)) return undefined;
  const iteration = String(result.iteration).padStart(3, '0');
  return `artifacts/visual/${task?.taskId ?? ''}/${captureCase.caseId}/iterations/${iteration}/result.json`;
}

export function validateCompatibilityMarkdown({
  source,
  task,
  diagnostics = [],
  path = defaultPath(task, 'compatibility.md'),
} = {}) {
  const document = validateSourceInput(source, 'compatibility', path, diagnostics);
  if (!document) return diagnostics;
  validateTemplateShape(document, requirements.compatibility, 'compatibility', path, diagnostics);

  requireExactField(document, 'Задача:', task?.taskId ?? '', 'compatibility', path, diagnostics);
  const project = requireSingleField(document, 'Проект:', 'compatibility', path, diagnostics);
  if (
    !project ||
    semanticText(project).length < 2 ||
    ['React', 'TypeScript', 'Tailwind'].some((technology) =>
      !containsLiteral(project, technology),
    )
  ) {
    addDiagnostic(
      diagnostics,
      'compatibility.project',
      path,
      'Project identity must be filled in and the stack must include React, TypeScript, and Tailwind.',
    );
  }
  requireExactUrlField(
    document,
    'URL Figma:',
    task?.source?.figmaUrl ?? '',
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Источник:',
    `${task?.source?.fileKey ?? ''}, версия ${contractScalar(task?.source?.fileVersion)}, узел ${task?.source?.nodeId ?? ''}`,
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Адрес проекта:',
    task?.target?.origin ?? '',
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Маршрут и целевой модуль:',
    `${task?.target?.route ?? ''}, ${task?.target?.featureModule ?? ''}`,
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Разрешённые корни реализации:',
    serializeIssuesForMarkdown(task?.target?.allowedImplementationRoots ?? []),
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Команда снимка:',
    task?.provisioning?.visualCaptureCommand ?? '',
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Команда сравнения:',
    task?.provisioning?.visualCompareCommand ?? '',
    'compatibility',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Права:',
    'чтение Figma и запись только в разрешённые корни реализации, файл данных и согласованные файлы зависимости',
    'compatibility',
    path,
    diagnostics,
  );

  const capabilityTable = findTable(
    document,
    'Совместимость',
    ['Возможность', 'Статус', 'Как проверено'],
    'compatibility.capabilities',
    path,
    diagnostics,
  );
  if (capabilityTable) {
    if (capabilityTable.body.length !== capabilityRows.length) {
      addDiagnostic(
        diagnostics,
        'compatibility.capabilities.row-count',
        path,
        'Capability table must contain exactly seven data rows.',
      );
    }
    for (const [label, key] of capabilityRows) {
      const matches = capabilityTable.body.filter((row) => normalizeCell(row[0] ?? '') === label);
      if (
        matches.length !== 1 ||
        normalizeCell(matches[0]?.[1] ?? '') !== 'available' ||
        task?.provisioning?.[key] !== 'available'
      ) {
        addDiagnostic(
          diagnostics,
          'compatibility.capabilities.value',
          path,
          `${label} must appear exactly once with status available in both task and report.`,
        );
      } else if (cellIsUnfilled(matches[0][2] ?? '')) {
        addDiagnostic(
          diagnostics,
          'compatibility.capabilities.evidence',
          path,
          `${label} requires a non-empty verification note.`,
        );
      }
    }
  }

  const dependencies = Array.isArray(task?.provisioning?.dependencies)
    ? task.provisioning.dependencies
    : [];
  const dependencyTable = findTable(
    document,
    'Зависимости',
    ['Пакет', 'Назначение', 'Статус', 'Версия', 'package.json', 'Файл блокировки', 'Проверка блокировки', 'Профиль проверки'],
    'compatibility.dependencies',
    path,
    diagnostics,
  );
  validateRowsById({
    table: dependencyTable,
    expected: dependencies.map((dependency) => ({ ...dependency, id: dependency.packageName })),
    idPrefix: 'compatibility.dependencies',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, dependency) {
      if (
        normalizeCell(row[1] ?? '') !== dependency.purpose ||
        normalizeCell(row[2] ?? '') !== dependency.status ||
        normalizeCell(row[3] ?? '') !== dependency.specifier ||
        normalizeCell(row[4] ?? '') !== dependency.packageJsonPath ||
        normalizeCell(row[5] ?? '') !== dependency.lockfilePath ||
        normalizeCell(row[6] ?? '') !== contractScalar(dependency.lockfileCheckId) ||
        normalizeCell(row[7] ?? '') !== contractScalar(dependency.lockfileCheckProfile)
      ) {
        addDiagnostic(
          diagnostics,
          'compatibility.dependencies.value',
          path,
          `Dependency ${dependency.packageName} must preserve its purpose, status, specifier, paths, and lock-file check ID.`,
        );
      }
    },
  });
  return diagnostics;
}

export function validatePreCodeMarkdown({
  source,
  task,
  capture,
  diagnostics = [],
  path = defaultPath(task, 'pre-code-evidence.md'),
} = {}) {
  const document = validateSourceInput(source, 'pre-code', path, diagnostics);
  if (!document) return diagnostics;
  validateTemplateShape(document, requirements.preCode, 'pre-code', path, diagnostics);

  requireFieldLiterals(
    document,
    'Запись `G0`:',
    [task?.taskId, `artifacts/visual/${task?.taskId}/compatibility.md`],
    'pre-code.identity',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'Контракт задачи:',
    [task?.taskId, 'task-contract.json'],
    'pre-code.identity',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'База Git:',
    [
      task?.baseline?.repositoryRoot,
      task?.baseline?.profile,
      task?.baseline?.revision,
      ...(task?.baseline?.preExistingChanges ?? []).flatMap(({ path: filePath, kind, mode, hash }) => [
        filePath,
        kind,
        contractScalar(mode),
        contractScalar(hash),
      ]),
    ],
    'pre-code.baseline',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'Точный URL Figma, `fileKey`, `fileVersion`, `nodeId`:',
    [
      task?.source?.figmaUrl,
      task?.source?.fileKey,
      contractScalar(task?.source?.fileVersion),
      task?.source?.nodeId,
    ],
    'pre-code.identity',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'Адрес проекта:',
    [task?.target?.origin],
    'pre-code.identity',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'Владелец маршрута и точки входа React:',
    [task?.target?.route, task?.target?.featureModule],
    'pre-code.identity',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'Включено в работу:',
    valuesFromTask(task, ['scope', 'include']),
    'pre-code.scope',
    path,
    diagnostics,
  );
  requireFieldLiterals(
    document,
    'Исключено из работы:',
    valuesFromTask(task, ['scope', 'exclude']),
    'pre-code.scope',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Разрешённые корни реализации:',
    serializeIssuesForMarkdown(task?.target?.allowedImplementationRoots ?? []),
    'pre-code.scope',
    path,
    diagnostics,
  );

  const provisioningValues = capabilityRows.flatMap(([, key]) => [
    key,
    task?.provisioning?.[key],
  ]);
  const dependencies = Array.isArray(task?.provisioning?.dependencies)
    ? task.provisioning.dependencies
    : [];
  for (const dependency of dependencies) {
    provisioningValues.push(
      dependency.packageName,
      dependency.purpose,
      dependency.status,
      dependency.specifier,
      dependency.packageJsonPath,
      dependency.lockfilePath,
      contractScalar(dependency.lockfileCheckId),
      contractScalar(dependency.lockfileCheckProfile),
    );
  }
  requireFieldLiterals(
    document,
    'Доступные инструменты и полномочия:',
    provisioningValues,
    'pre-code.provisioning',
    path,
    diagnostics,
  );
  requireFieldPairs(
    document,
    'Команды `projectChecks` и `browserChecks`:',
    [
      ...(Array.isArray(task?.acceptance?.projectChecks)
        ? task.acceptance.projectChecks
        : []
      ).map(({ id, command }) => [id, command]),
      ...(Array.isArray(task?.acceptance?.browserChecks)
        ? task.acceptance.browserChecks
        : []
      ).map(({ id, command }) => [id, command]),
    ],
    'pre-code.checks',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Команда снимка:',
    task?.provisioning?.visualCaptureCommand ?? '',
    'pre-code.checks',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Команда сравнения:',
    task?.provisioning?.visualCompareCommand ?? '',
    'pre-code.checks',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Воспроизводимые данные:',
    task?.data?.fixture ?? '',
    'pre-code.fixture',
    path,
    diagnostics,
  );

  const taskRoot = `artifacts/visual/${task?.taskId ?? ''}`;
  requireExactField(
    document,
    'Реестр контекста:',
    `${taskRoot}/design-context-manifest.json`,
    'pre-code.sources',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Реестр источников:',
    `${taskRoot}/source-manifest.json`,
    'pre-code.sources',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Контракт захвата:',
    `${taskRoot}/capture-contract.json`,
    'pre-code.capture',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Журнал:',
    `${taskRoot}/evidence-log.jsonl`,
    'pre-code.log',
    path,
    diagnostics,
  );
  for (const label of [
    'Стили, токены и контрольные ширины:',
    'Шрифты:',
    'Изученные компоненты и варианты:',
    'Первый `get_design_context` корня:',
    'Точечные запросы:',
    'Дополнительные операции:',
    'Эталон и его происхождение:',
    'Полная матрица:',
    'Значения `not-applicable`:',
    'Единый отпечаток среды:',
    'Готовность:',
    'Фактические размер и DPR будут проверены:',
    'Применимость дополнительных режимов:',
    'Режим каждого случая:',
    '`behavior-only`:',
    '`responsive-only`:',
    'Файлы, которые могут войти в `files`:',
    'Будущая неизменяемая копия:',
    'События `G0`, `G1`, `G2`, `G3`:',
    'Последний закрытый этап:',
  ]) {
    requireNonEmptyField(document, label, 'pre-code.manual', path, diagnostics);
  }

  const viewports = Array.isArray(task?.viewports) ? task.viewports : [];
  const viewportTable = findTable(
    document,
    'Адаптивные выводы',
    ['ID области просмотра', 'Переход', 'Класс', 'Статус', 'Источник'],
    'pre-code.viewports',
    path,
    diagnostics,
  );
  validateRowsById({
    table: viewportTable,
    expected: viewports,
    idPrefix: 'pre-code.viewports',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, viewport) {
      if (row.slice(1).some(cellIsUnfilled)) {
        addDiagnostic(
          diagnostics,
          'pre-code.viewports.value',
          path,
          `Viewport ${viewport.id} requires all adaptive-analysis cells.`,
        );
      }
    },
  });

  const states = Array.isArray(task?.states) ? task.states : [];
  const captureSectionPath = expectedHeadingPath('preCode', 'Контракт захвата');
  const captureSection = (
    document.sectionLines.get(captureSectionPath) ?? []
  ).join('\n');
  for (const state of states) {
    if (!containsLiteral(captureSection, state.id)) {
      addDiagnostic(
        diagnostics,
        'pre-code.states.identity',
        path,
        `Capture-plan section must identify state ${state.id}.`,
      );
    }
    if (state.applicability === 'not-applicable') {
      requireFieldLiterals(
        document,
        'Значения `not-applicable`:',
        [state.id, state.evidence],
        'pre-code.states',
        path,
        diagnostics,
      );
    } else {
      requireFieldLiterals(
        document,
        'Полная матрица:',
        [state.id, ...viewports.map(({ id }) => id)],
        'pre-code.states',
        path,
        diagnostics,
      );
    }
  }

  const cases = Array.isArray(capture?.cases) ? capture.cases : [];
  const evidenceModes = [
    ['behavior-only', task?.evidenceModes?.behaviorOnly],
    ['responsive-only', task?.evidenceModes?.responsiveOnly],
  ];
  requireFieldPairs(
    document,
    'Применимость дополнительных режимов:',
    evidenceModes.map(([mode, plan]) => [mode, plan?.applicability ?? '']),
    'pre-code.evidence-modes',
    path,
    diagnostics,
  );
  for (const [, plan] of evidenceModes) {
    if (plan?.applicability === 'not-applicable') {
      requireFieldLiterals(
        document,
        'Применимость дополнительных режимов:',
        [plan.evidence],
        'pre-code.evidence-modes',
        path,
        diagnostics,
      );
    }
  }
  requireFieldPairs(
    document,
    'Режим каждого случая:',
    cases.map(({ caseId, evidenceMode }) => [caseId, evidenceMode]),
    'pre-code.capture-cases',
    path,
    diagnostics,
  );

  requireFilledManualTable(
    document,
    'Ресурсы приложения',
    ['Узел Figma', 'Вид', 'Запись источника', 'Планируемый путь', 'Решение'],
    'pre-code.assets',
    path,
    diagnostics,
  );
  requireFilledManualTable(
    document,
    'Решения по компонентам',
    ['Ответственность', 'Изученные кандидаты', 'Решение', 'Причина'],
    'pre-code.components',
    path,
    diagnostics,
  );
  requireFilledManualTable(
    document,
    'Порядок выбора значений',
    ['Свойство', 'Ступень', 'Источник', 'Обоснование'],
    'pre-code.values',
    path,
    diagnostics,
  );
  for (const heading of [
    'Модель компоновки',
    'Повторно используемые компоненты',
    'Новые компоненты',
    'Токены',
  ]) {
    requireFilledProseSection(
      document,
      'preCode',
      heading,
      'pre-code.model',
      path,
      diagnostics,
    );
  }
  return diagnostics;
}

function validateStatusTable({
  document,
  section,
  header,
  ids,
  canonicalRows,
  canonicalEvidenceById,
  idPrefix,
  diagnosticPath,
  diagnostics,
}) {
  const table = findTable(document, section, header, idPrefix, diagnosticPath, diagnostics);
  validateRowsById({
    table,
    expected: ids,
    idPrefix,
    diagnosticPath,
    diagnostics,
    validateRow(row, id) {
      if (normalizeCell(row[1] ?? '') !== 'passed') {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.status`,
          diagnosticPath,
          `${id} must have status passed.`,
        );
      }
      if (row.slice(2).some((cell) => normalizeCell(cell).length === 0)) {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.evidence`,
          diagnosticPath,
          `${id} requires non-empty evidence cells.`,
        );
      }
      const canonical = canonicalRows?.find((item) => item.id === id);
      if (
        canonical &&
        (normalizeCell(row[2] ?? '') !== canonical.evidencePath ||
          normalizeCell(row[3] ?? '') !== canonical.evidenceHash)
      ) {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.canonical-value`,
          diagnosticPath,
          `${id} must preserve its canonical evidence path and hash.`,
        );
      }
      const expectedPaths = canonicalEvidenceById?.get(id);
      if (
        expectedPaths &&
        normalizeCell(row[2] ?? '') !== expectedPaths.join(', ')
      ) {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.canonical-evidence`,
          diagnosticPath,
          `${id} must list only its canonical evidence paths in order.`,
        );
      }
    },
  });
}

function validateExecutedChecks(
  document,
  section,
  expected,
  canonicalChecks,
  idPrefix,
  diagnosticPath,
  diagnostics,
) {
  const checks = Array.isArray(expected) ? expected : [];
  const table = findTable(
    document,
    section,
    ['id', 'command', 'status', 'exitCode', 'outputPath', 'outputHash'],
    idPrefix,
    diagnosticPath,
    diagnostics,
  );
  validateRowsById({
    table,
    expected: checks,
    idPrefix,
    diagnosticPath,
    diagnostics,
    validateRow(row, check) {
      if (
        normalizeCell(row[1] ?? '') !== check.command ||
        normalizeCell(row[2] ?? '') !== 'passed' ||
        normalizeCell(row[3] ?? '') !== '0'
      ) {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.value`,
          diagnosticPath,
          `Check ${check.id} must preserve its exact command, passed status, and exitCode 0.`,
        );
      }
      if (normalizeCell(row[4] ?? '').length === 0 || normalizeCell(row[5] ?? '').length === 0) {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.evidence`,
          diagnosticPath,
          `Check ${check.id} requires outputPath and outputHash.`,
        );
      }
      const canonical = canonicalChecks?.find((item) => item.id === check.id);
      if (
        canonical &&
        (normalizeCell(row[4] ?? '') !== canonical.outputPath ||
          normalizeCell(row[5] ?? '') !== canonical.outputHash)
      ) {
        addDiagnostic(
          diagnostics,
          `${idPrefix}.canonical-value`,
          diagnosticPath,
          `Check ${check.id} must preserve its canonical output path and hash.`,
        );
      }
    },
  });
}

export function validateFinalReportMarkdown({
  source,
  task,
  capture,
  implementationHash,
  captureContractHash,
  designContextManifest,
  sourceManifest,
  implementationManifest,
  verificationRecord,
  recordHashes,
  environmentFingerprint: expectedEnvironmentFingerprint,
  evidenceEvents,
  currentSequence,
  finalResults,
  diagnostics = [],
  path = defaultPath(task, 'final-report.md'),
} = {}) {
  const document = validateSourceInput(source, 'final-report', path, diagnostics);
  if (!document) return diagnostics;
  validateTemplateShape(document, requirements.finalReport, 'final-report', path, diagnostics);

  requireExactField(document, 'Задача:', task?.taskId ?? '', 'final-report', path, diagnostics);
  requireExactField(
    document,
    '`implementationHash`:',
    implementationHash ?? '',
    'final-report',
    path,
    diagnostics,
  );
  const taskRoot = `artifacts/visual/${task?.taskId ?? ''}`;
  const implementationId = implementationHash?.replace(/^sha256:/u, '') ?? '';
  const versionRoot = `${taskRoot}/implementations/${implementationId}`;
  requireExactField(
    document,
    'Манифест:',
    `${taskRoot}/implementation-manifest.json`,
    'final-report.implementation',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Идентификатор реализации:',
    implementationId,
    'final-report.implementation',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Каталог версии:',
    versionRoot,
    'final-report.implementation',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Неизменяемая копия:',
    `${versionRoot}/implementation-manifest.json`,
    'final-report.implementation',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Результат:',
    'G8 passed',
    'final-report',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Figma:',
    `${task?.source?.figmaUrl ?? ''}, ${task?.source?.fileKey ?? ''}, ${contractScalar(task?.source?.fileVersion)}, ${task?.source?.nodeId ?? ''}`,
    'final-report.identity',
    path,
    diagnostics,
  );

  requireExactField(
    document,
    'Контекст Figma:',
    `${taskRoot}/design-context-manifest.json (${recordHashes?.designContext ?? ''})`,
    'final-report.source',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Источники:',
    `${taskRoot}/source-manifest.json (${recordHashes?.sourceManifest ?? ''})`,
    'final-report.source',
    path,
    diagnostics,
  );
  requireNonEmptyField(
    document,
    'Изменения модели во время работы — ручная запись:',
    'final-report.source',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'База Git:',
    `${task?.baseline?.repositoryRoot ?? ''}, ${task?.baseline?.profile ?? ''}, ${task?.baseline?.revision ?? ''}`,
    'final-report.implementation',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Хеш контракта задачи:',
    implementationManifest?.taskContractHash ?? '',
    'final-report.implementation',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Исходные изменения:',
    serializeIssuesForMarkdown(task?.baseline?.preExistingChanges ?? []),
    'final-report.implementation',
    path,
    diagnostics,
  );

  const requestTable = findTable(
    document,
    'Источник и модель',
    ['requestId', 'operation', 'responseFormat', 'nodeId', 'path', 'checksum'],
    'final-report.requests',
    path,
    diagnostics,
  );
  validateRowsById({
    table: requestTable,
    expected: (designContextManifest?.requests ?? []).map((request) => ({
      ...request,
      id: request.requestId,
    })),
    idPrefix: 'final-report.requests',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, request) {
      const expected = [
        request.operation,
        request.responseFormat,
        request.nodeId,
        request.path,
        request.checksum,
      ];
      if (expected.some((value, index) => normalizeCell(row[index + 1] ?? '') !== value)) {
        addDiagnostic(
          diagnostics,
          'final-report.requests.value',
          path,
          `Request ${request.requestId} must preserve every design-context field.`,
        );
      }
    },
  });

  const sourceTable = findTable(
    document,
    'Источник и модель',
    [
      'sourceId',
      'purpose',
      'nodeId',
      'caseId',
      'mediaKind',
      'logicalDimensions',
      'pixelDimensions',
      'path',
      'checksum',
      'origin',
      'derivations',
      'runtime',
    ],
    'final-report.sources',
    path,
    diagnostics,
  );
  validateRowsById({
    table: sourceTable,
    expected: (sourceManifest?.sources ?? []).map((item) => ({ ...item, id: item.sourceId })),
    idPrefix: 'final-report.sources',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, item) {
      const scalarValues = [
        item.purpose,
        item.nodeId,
        contractScalar(item.caseId),
        item.mediaKind,
        serializeIssuesForMarkdown(item.logicalDimensions),
        serializeIssuesForMarkdown(item.pixelDimensions),
        item.path,
        item.checksum,
      ];
      const runtime = `${contractScalar(item.runtimePath)}, ${contractScalar(item.runtimeChecksum)}`;
      if (
        scalarValues.some((value, index) => normalizeCell(row[index + 1] ?? '') !== value) ||
        normalizeOpaqueCell(row[9] ?? '') !== serializeIssuesForMarkdown(item.origin) ||
        normalizeOpaqueCell(row[10] ?? '') !== serializeIssuesForMarkdown(item.derivations) ||
        normalizeCell(row[11] ?? '') !== runtime
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.sources.value',
          path,
          `Source ${item.sourceId} must preserve identity, provenance, derivations, and runtime mapping.`,
        );
      }
    },
  });

  const implementationTable = findTable(
    document,
    'Реализация',
    ['path', 'kind', 'mode', 'hash'],
    'final-report.implementation-files',
    path,
    diagnostics,
  );
  validateRowsById({
    table: implementationTable,
    expected: (implementationManifest?.files ?? []).map((file) => ({ ...file, id: file.path })),
    idPrefix: 'final-report.implementation-files',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, file) {
      if (
        normalizeCell(row[1] ?? '') !== file.kind ||
        normalizeCell(row[2] ?? '') !== contractScalar(file.mode) ||
        normalizeCell(row[3] ?? '') !== contractScalar(file.hash)
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.implementation-files.value',
          path,
          `Implementation file ${file.path} must preserve kind, mode, and hash.`,
        );
      }
    },
  });

  const dependencyTable = findTable(
    document,
    'Реализация',
    ['Пакет', 'Статус', 'Назначение', 'Версия', 'package.json', 'Файл блокировки', 'Проверка блокировки', 'Профиль проверки'],
    'final-report.dependencies',
    path,
    diagnostics,
  );
  validateRowsById({
    table: dependencyTable,
    expected: (task?.provisioning?.dependencies ?? []).map((dependency) => ({
      ...dependency,
      id: dependency.packageName,
    })),
    idPrefix: 'final-report.dependencies',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, dependency) {
      if (
        normalizeCell(row[1] ?? '') !== dependency.status ||
        normalizeCell(row[2] ?? '') !== dependency.purpose ||
        normalizeCell(row[3] ?? '') !== dependency.specifier ||
        normalizeCell(row[4] ?? '') !== dependency.packageJsonPath ||
        normalizeCell(row[5] ?? '') !== dependency.lockfilePath ||
        normalizeCell(row[6] ?? '') !== contractScalar(dependency.lockfileCheckId) ||
        normalizeCell(row[7] ?? '') !== contractScalar(dependency.lockfileCheckProfile)
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.dependencies.value',
          path,
          `Dependency ${dependency.packageName} must preserve its status, purpose, specifier, paths, and lock-file check ID.`,
        );
      }
    },
  });
  requireExactField(
    document,
    'Адрес проекта:',
    task?.target?.origin ?? '',
    'final-report.identity',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Маршрут и модуль:',
    `${task?.target?.route ?? ''}, ${task?.target?.featureModule ?? ''}`,
    'final-report.identity',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Разрешённые корни реализации:',
    serializeIssuesForMarkdown(task?.target?.allowedImplementationRoots ?? []),
    'final-report.identity',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Включено:',
    serializeIssuesForMarkdown(valuesFromTask(task, ['scope', 'include'])),
    'final-report.scope',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Исключено:',
    serializeIssuesForMarkdown(valuesFromTask(task, ['scope', 'exclude'])),
    'final-report.scope',
    path,
    diagnostics,
  );

  const captureCases = Array.isArray(capture?.cases) ? capture.cases : [];
  const visualCases = captureCases.filter(
    ({ evidenceMode }) => evidenceMode === 'visual-reference',
  );
  const nonVisualCases = captureCases.filter(
    ({ evidenceMode }) => evidenceMode !== 'visual-reference',
  );
  const canonicalGateEvidence = new Map([
    ['G0', [`${taskRoot}/compatibility.md`]],
    ['G1', [`${taskRoot}/task-contract.json`]],
    [
      'G2',
      [`${taskRoot}/design-context-manifest.json`, `${taskRoot}/source-manifest.json`],
    ],
    ['G3', [`${taskRoot}/capture-contract.json`, `${taskRoot}/pre-code-evidence.md`]],
    ['G4', [`${versionRoot}/implementation-manifest.json`]],
    [
      'G5',
      ['q1', 'q2', 'q3', 'q4'].map((id) => `${versionRoot}/checks/${id}.md`),
    ],
    [
      'G6',
      (task?.acceptance?.projectChecks ?? []).map(
        ({ id }) => `${versionRoot}/checks/${id}.txt`,
      ),
    ],
    [
      'G7',
      [
        `${versionRoot}/checks/q5.md`,
        `${versionRoot}/checks/q6.md`,
        ...(task?.acceptance?.browserChecks ?? []).map(
          ({ id }) => `${versionRoot}/checks/${id}.txt`,
        ),
        ...nonVisualCases.map(
          ({ caseId }) => `${versionRoot}/cases/${caseId}/evidence.json`,
        ),
        ...(visualCases.length > 0
          ? [
              `${versionRoot}/comparator-conformance.json`,
              `${versionRoot}/conformance/reference.png`,
              `${versionRoot}/conformance/actual.png`,
              `${versionRoot}/conformance/raw.json`,
              `${versionRoot}/conformance/diff.png`,
              `${versionRoot}/conformance/overlay.png`,
            ]
          : []),
      ],
    ],
    ['G8', [`${taskRoot}/verification-record.json`, `${taskRoot}/final-report.md`]],
  ]);

  validateStatusTable({
    document,
    section: 'Этапы G0-G8',
    header: ['Этап', 'Статус', 'Каноническое подтверждение'],
    ids: gateIds,
    canonicalEvidenceById: canonicalGateEvidence,
    idPrefix: 'final-report.gates',
    diagnosticPath: path,
    diagnostics,
  });
  validateStatusTable({
    document,
    section: 'Проверки Q1-Q6',
    header: ['Проверка', 'Статус', 'Путь', 'SHA-256'],
    ids: qualityIds,
    canonicalRows: verificationRecord?.qualityChecks,
    idPrefix: 'final-report.quality',
    diagnosticPath: path,
    diagnostics,
  });
  validateExecutedChecks(
    document,
    'Проверки проекта',
    task?.acceptance?.projectChecks ?? [],
    verificationRecord?.projectChecks,
    'final-report.project-checks',
    path,
    diagnostics,
  );

  const behaviorEvidencePaths = nonVisualCases
    .filter(({ evidenceMode }) => evidenceMode === 'behavior-only')
    .map(({ evidencePath }) => evidencePath);
  const responsiveEvidencePaths = nonVisualCases
    .filter(({ evidenceMode }) => evidenceMode === 'responsive-only')
    .map(({ evidencePath }) => evidencePath);
  requireExactField(
    document,
    '`keyboard`, `focus`, `accessible-name`, `contrast`:',
    behaviorEvidencePaths.length > 0 ? behaviorEvidencePaths.join(', ') : 'не применимо',
    'final-report.browser',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    '`overflow`, `reading-order`, `reflow`, `zoom`:',
    responsiveEvidencePaths.length > 0 ? responsiveEvidencePaths.join(', ') : 'не применимо',
    'final-report.browser',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Команда снимка:',
    task?.provisioning?.visualCaptureCommand ?? '',
    'final-report.browser',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Команда сравнения:',
    task?.provisioning?.visualCompareCommand ?? '',
    'final-report.browser',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Хеш контракта захвата:',
    captureContractHash ?? '',
    'final-report.browser',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Единый отпечаток среды случаев:',
    expectedEnvironmentFingerprint ?? '',
    'final-report.browser',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Ошибки консоли и страницы:',
    `нет; ${nonVisualCases.length > 0 ? nonVisualCases.map(({ evidencePath }) => evidencePath).join(', ') : 'не применимо'}`,
    'final-report.browser',
    path,
    diagnostics,
  );
  validateExecutedChecks(
    document,
    'Проверки браузера',
    task?.acceptance?.browserChecks ?? [],
    verificationRecord?.browserChecks,
    'final-report.browser-checks',
    path,
    diagnostics,
  );

  const hasVisualCases = visualCases.length > 0;
  requireExactField(
    document,
    'Запись:',
    hasVisualCases ? `${versionRoot}/comparator-conformance.json` : 'не применимо',
    'final-report.comparator',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Данные:',
    hasVisualCases ? `${versionRoot}/conformance/` : 'не применимо',
    'final-report.comparator',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Профиль:',
    'rgba-exact-v1',
    'final-report.comparator',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Канонический результат:',
    '1 / 4 = 25',
    'final-report.comparator',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Статус:',
    hasVisualCases ? 'passed' : 'не применимо',
    'final-report.comparator',
    path,
    diagnostics,
  );
  const visualIterationTable = findTable(
    document,
    'Визуальные итерации',
    ['caseId', 'iteration', 'viewport', 'differenceRatio', 'status', 'issues', 'approval'],
    'final-report.visual-iterations',
    path,
    diagnostics,
  );
  validateRowsById({
    table: visualIterationTable,
    expected: visualCases.map((captureCase) => ({
      ...captureCase,
      id: captureCase.caseId,
    })),
    idPrefix: 'final-report.visual-iterations',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, captureCase) {
      const expectedViewport =
        `${captureCase.viewport.width}x${captureCase.viewport.height}`;
      const canonical = finalResults?.get(captureCase.caseId);
      if (
        !/^\d{3}$/u.test(normalizeCell(row[1] ?? '')) ||
        normalizeCell(row[2] ?? '') !== expectedViewport ||
        !['pixel-perfect', 'strict-visual-accepted'].includes(
          normalizeCell(row[4] ?? ''),
        )
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.visual-iterations.value',
          path,
          `Case ${captureCase.caseId} must preserve its viewport and use a three-digit iteration with an accepted status.`,
        );
      }
      if (
        normalizeCell(row[3] ?? '').length === 0 ||
        normalizeCell(row[5] ?? '').length === 0
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.visual-iterations.evidence',
          path,
          `Case ${captureCase.caseId} requires differenceRatio and issues.`,
        );
      }
      if (
        canonical &&
        (normalizeCell(row[1] ?? '') !== String(canonical.iteration).padStart(3, '0') ||
          normalizeCell(row[2] ?? '') !== canonical.viewport ||
          normalizeCell(row[3] ?? '') !== String(canonical.differenceRatio) ||
          normalizeCell(row[4] ?? '') !== canonical.status)
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.visual-iterations.canonical-value',
          path,
          `Case ${captureCase.caseId} must preserve the final result iteration, viewport, ratio, and status.`,
        );
      }
      if (
        canonical &&
        normalizeOpaqueCell(row[5] ?? '') !== serializeIssuesForMarkdown(canonical.issues)
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.visual-iterations.canonical-issues',
          path,
          `Case ${captureCase.caseId} must preserve the exact ordered issues array from its final result.`,
        );
      }
      const expectedApproval = canonical?.approval === null
        ? 'null'
        : isObject(canonical?.approval)
          ? `${canonical.approval.path} (${canonical.approval.checksum})`
          : undefined;
      if (expectedApproval !== undefined && normalizeCell(row[6] ?? '') !== expectedApproval) {
        addDiagnostic(
          diagnostics,
          'final-report.visual-iterations.approval',
          path,
          `Case ${captureCase.caseId} must preserve its exact approval reference.`,
        );
      }
    },
  });

  const viewports = Array.isArray(task?.viewports) ? task.viewports : [];
  const states = Array.isArray(task?.states) ? task.states : [];
  const viewportTable = findTable(
    document,
    'Области просмотра',
    ['id', 'Размер и DPR', 'Обязательные states', 'Подтверждения'],
    'final-report.viewports',
    path,
    diagnostics,
  );
  const requiredStateIds = states
    .filter(({ applicability }) => applicability === 'required')
    .map(({ id }) => id);
  validateRowsById({
    table: viewportTable,
    expected: viewports,
    idPrefix: 'final-report.viewports',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, viewport) {
      if (normalizeCell(row[1] ?? '') !== `${viewport.width}x${viewport.height}@${viewport.dpr}`) {
        addDiagnostic(
          diagnostics,
          'final-report.viewports.dimensions',
          path,
          `Viewport ${viewport.id} must preserve its exact width, height, and DPR.`,
        );
      }
      const expectedStates = requiredStateIds.length > 0 ? requiredStateIds.join(', ') : 'нет';
      if (normalizeCell(row[2] ?? '') !== expectedStates) {
        addDiagnostic(
          diagnostics,
          'final-report.viewports.states',
          path,
          `Viewport ${viewport.id} must list only the required states in contract order.`,
        );
      }
      const viewportCases = captureCases.filter(
        (captureCase) =>
          captureCase?.viewport?.width === viewport.width &&
          captureCase?.viewport?.height === viewport.height &&
          captureCase?.viewport?.dpr === viewport.dpr &&
          requiredStateIds.includes(captureCase.state),
      );
      const expectedEvidencePaths = viewportCases
        .map((captureCase) => finalCaseEvidencePath(task, captureCase, finalResults))
        .filter((evidencePath) => typeof evidencePath === 'string');
      const expectedEvidence =
        expectedEvidencePaths.length > 0 ? expectedEvidencePaths.join(', ') : 'нет';
      if (
        expectedEvidencePaths.length !== viewportCases.length ||
        normalizeCell(row[3] ?? '') !== expectedEvidence
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.viewports.evidence',
          path,
          `Viewport ${viewport.id} must list its canonical case evidence paths in capture order.`,
        );
      }
    },
  });

  const stateTable = findTable(
    document,
    'Состояния',
    ['id', 'applicability', 'Области просмотра', 'Подтверждения'],
    'final-report.states',
    path,
    diagnostics,
  );
  validateRowsById({
    table: stateTable,
    expected: states,
    idPrefix: 'final-report.states',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, state) {
      if (normalizeCell(row[1] ?? '') !== state.applicability) {
        addDiagnostic(
          diagnostics,
          'final-report.states.applicability',
          path,
          `State ${state.id} must preserve applicability ${state.applicability}.`,
        );
      }
      if (state.applicability === 'required') {
        const expectedViewports = viewports.map(({ id }) => id).join(', ');
        if (normalizeCell(row[2] ?? '') !== expectedViewports) {
          addDiagnostic(
            diagnostics,
            'final-report.states.viewports',
            path,
            `Required state ${state.id} must list every viewport in contract order.`,
          );
        }
        const stateCases = captureCases.filter((captureCase) => captureCase.state === state.id);
        const expectedEvidencePaths = stateCases
          .map((captureCase) => finalCaseEvidencePath(task, captureCase, finalResults))
          .filter((evidencePath) => typeof evidencePath === 'string');
        if (
          expectedEvidencePaths.length !== stateCases.length ||
          normalizeCell(row[3] ?? '') !== expectedEvidencePaths.join(', ')
        ) {
          addDiagnostic(
            diagnostics,
            'final-report.states.evidence',
            path,
            `State ${state.id} must list its canonical case evidence paths in capture order.`,
          );
        }
      } else {
        if (normalizeCell(row[2] ?? '').toLowerCase() !== 'не применимо') {
          addDiagnostic(
            diagnostics,
            'final-report.states.viewports',
            path,
            `Not-applicable state ${state.id} must use "не применимо" for viewports.`,
          );
        }
        if (normalizeCell(row[3] ?? '') !== (state.evidence ?? '')) {
          addDiagnostic(
            diagnostics,
            'final-report.states.evidence',
            path,
            `Not-applicable state ${state.id} must preserve its contract evidence.`,
          );
        }
      }
    },
  });

  const caseTable = findTable(
    document,
    'Случаи без эталона',
    ['caseId', 'evidenceMode', 'viewport', 'state', 'Текущий файл', 'Неизменяемая копия'],
    'final-report.cases',
    path,
    diagnostics,
  );
  validateRowsById({
    table: caseTable,
    expected: nonVisualCases.map((captureCase) => ({ ...captureCase, id: captureCase.caseId })),
    idPrefix: 'final-report.cases',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, captureCase) {
      const expectedViewport =
        `${captureCase.viewport.width}x${captureCase.viewport.height}@${captureCase.viewport.dpr}`;
      if (
        normalizeCell(row[1] ?? '') !== captureCase.evidenceMode ||
        normalizeCell(row[2] ?? '') !== expectedViewport ||
        normalizeCell(row[3] ?? '') !== captureCase.state
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.cases.value',
          path,
          `Case ${captureCase.caseId} must preserve its mode, viewport, and state.`,
        );
      }
      if (normalizeCell(row[4] ?? '').length === 0 || normalizeCell(row[5] ?? '').length === 0) {
        addDiagnostic(
          diagnostics,
          'final-report.cases.evidence',
          path,
          `Case ${captureCase.caseId} requires current and immutable evidence paths.`,
        );
      }
      const immutablePath = implementationId
        ? `artifacts/visual/${task.taskId}/implementations/${implementationId}/cases/${captureCase.caseId}/evidence.json`
        : '';
      if (
        normalizeCell(row[4] ?? '') !== captureCase.evidencePath ||
        normalizeCell(row[5] ?? '') !== immutablePath
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.cases.canonical-path',
          path,
          `Case ${captureCase.caseId} must preserve its canonical current and immutable evidence paths.`,
        );
      }
    },
  });

  const failedPreDiffEvents = (evidenceEvents ?? [])
    .filter((event) => event?.eventType === 'failed-pre-diff')
    .map((event) => ({ ...event, id: String(event.sequence) }));
  const failureRows = failedPreDiffEvents.length > 0
    ? failedPreDiffEvents
    : [{ id: 'нет', caseId: 'нет', evidencePath: 'нет' }];
  const failureTable = findTable(
    document,
    'Сбои до сравнения',
    ['sequence', 'caseId', 'evidencePath'],
    'final-report.failures',
    path,
    diagnostics,
  );
  validateRowsById({
    table: failureTable,
    expected: failureRows,
    idPrefix: 'final-report.failures',
    diagnosticPath: path,
    diagnostics,
    validateRow(row, event) {
      if (
        normalizeCell(row[1] ?? '') !== event.caseId ||
        normalizeCell(row[2] ?? '') !== event.evidencePath
      ) {
        addDiagnostic(
          diagnostics,
          'final-report.failures.value',
          path,
          `Failure ${event.id} must preserve its case and evidence path.`,
        );
      }
    },
  });

  requireNonEmptyField(
    document,
    'Прочие согласованные отклонения, не заменяющие `approval` визуальной итерации:',
    'final-report.deviations',
    path,
    diagnostics,
  );
  requireNonEmptyField(
    document,
    'Оставшиеся допущения:',
    'final-report.deviations',
    path,
    diagnostics,
  );

  requireExactField(
    document,
    'Запись проверки:',
    `${taskRoot}/verification-record.json (${recordHashes?.verificationRecord ?? ''})`,
    'final-report.outcome',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Журнал:',
    `${taskRoot}/evidence-log.jsonl (${currentSequence ?? ''}, ${implementationHash ?? ''})`,
    'final-report.outcome',
    path,
    diagnostics,
  );
  requireExactField(
    document,
    'Условие завершения:',
    'обе команды возвращают код 0',
    'final-report.outcome',
    path,
    diagnostics,
  );
  return diagnostics;
}
