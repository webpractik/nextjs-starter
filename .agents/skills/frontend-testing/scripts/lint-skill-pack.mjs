#!/usr/bin/env node

import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredFiles = [
  'SKILL.md',
  'references/react-18-19-testing.md',
  'references/next-app-router-testing.md',
  'references/next-pages-router-testing.md',
  'references/test-data-network-and-boundaries.md',
  'references/allure-labels.md',
  'references/diagnosis-performance-and-verification.md',
  'scripts/lint-skill-pack.mjs',
];

const allureTokens = [
  'allure-js-commons',
  'await allure.labels',
  'layer',
  'feature',
  'story',
  'severity',
];

const specialistTokens = [
  'skill vitest',
  'skill playwright-best-practices',
  'version-specific writes',
  'missing',
];

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

function lineCount(source) {
  const normalized = normalizeLf(source);
  if (normalized.length === 0) return 0;
  return normalized.endsWith('\n')
    ? normalized.split('\n').length - 1
    : normalized.split('\n').length;
}

function addDiagnostic(diagnostics, id, diagnosticPath, message) {
  diagnostics.push({ id, path: diagnosticPath, message });
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..'
    && !relative.startsWith('..' + path.sep)
    && !path.isAbsolute(relative);
}

async function isRegularFile(candidate) {
  try {
    const stats = await lstat(candidate);
    return stats.isFile() && !stats.isSymbolicLink();
  } catch {
    return false;
  }
}

function validFrontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/u.exec(normalizeLf(source));
  if (match === null) return false;

  const entries = [];
  for (const line of match[1].split('\n')) {
    if (/^\s+/u.test(line)) continue;
    const entry = /^([a-z][a-z0-9-]*):\s*(.*)$/u.exec(line);
    if (entry === null) return false;
    entries.push({ key: entry[1], value: entry[2] });
  }

  if (entries.length !== 2) return false;
  const name = entries.find(({ key }) => key === 'name');
  const description = entries.find(({ key }) => key === 'description');
  return name?.value === 'frontend-testing'
    && description !== undefined
    && validDescriptionScalar(description.value);
}

function validDescriptionScalar(value) {
  if (/^[>|][+-]?$/u.test(value)) return true;
  if (/^"(?:[^"\\]|\\.)*"$/u.test(value)) return true;
  if (/^'(?:[^']|'')*'$/u.test(value)) return true;
  return value.length > 0 && !/:\s|(?:^|\s)#/u.test(value);
}

function markdownTargets(source) {
  const targets = [];
  for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/gu)) {
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

function externalTarget(target) {
  return target.startsWith('#')
    || target.startsWith('//')
    || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(target);
}

async function resolveRoot(skillRoot) {
  if (typeof skillRoot !== 'string' || skillRoot.length === 0) {
    throw new PackInputError('input.arguments', 'Skill root is required.');
  }
  try {
    const root = await realpath(skillRoot);
    const stats = await lstat(root);
    if (!stats.isDirectory()) throw new Error('not a directory');
    return root;
  } catch {
    throw new PackInputError(
      'input.unreadable',
      'Skill root is missing or unreadable.',
    );
  }
}

async function validateLinks(root, relativePath, source, diagnostics) {
  for (const rawTarget of markdownTargets(source)) {
    if (externalTarget(rawTarget)) continue;
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
        'Invalid local Markdown link: ' + rawTarget,
      );
      continue;
    }

    const candidate = path.resolve(root, path.dirname(relativePath), decoded);
    if (!isContained(root, candidate)) {
      addDiagnostic(
        diagnostics,
        'pack.link',
        relativePath,
        'Local Markdown link escapes the pack: ' + rawTarget,
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
        'Local Markdown link does not resolve: ' + rawTarget,
      );
    }
  }
}

export async function lintSkillPack(skillRoot) {
  const root = await resolveRoot(skillRoot);
  const diagnostics = [];
  const sources = new Map();

  for (const relativePath of requiredFiles) {
    const absolute = path.resolve(root, relativePath);
    if (!await isRegularFile(absolute)) {
      addDiagnostic(
        diagnostics,
        'pack.inventory',
        relativePath,
        'Required regular file is missing.',
      );
      continue;
    }
    if (relativePath.endsWith('.md')) {
      sources.set(relativePath, await readFile(absolute, 'utf8'));
    }
  }

  const core = sources.get('SKILL.md');
  if (core !== undefined) {
    if (!validFrontmatter(core)) {
      addDiagnostic(
        diagnostics,
        'pack.frontmatter',
        'SKILL.md',
        'Frontmatter must contain only frontend-testing name and description.',
      );
    }

    if (lineCount(core) > 220 || Buffer.byteLength(core, 'utf8') > 16 * 1024) {
      addDiagnostic(
        diagnostics,
        'pack.core-budget',
        'SKILL.md',
        'SKILL.md exceeds 220 lines or 16 KiB.',
      );
    }

    if (/\b(?:Vue|Svelte|Angular|framework-agnostic)\b/iu.test(core)) {
      addDiagnostic(
        diagnostics,
        'pack.scope',
        'SKILL.md',
        'Core scope must remain React and Next.js specific.',
      );
    }

    const compactCore = core.replace(/\s+/gu, ' ');
    if (allureTokens.some((token) => !compactCore.includes(token))) {
      addDiagnostic(
        diagnostics,
        'pack.allure-gate',
        'SKILL.md',
        'Core is missing the mandatory per-test Allure gate.',
      );
    }
    if (specialistTokens.some((token) => !compactCore.includes(token))) {
      addDiagnostic(
        diagnostics,
        'pack.specialist-gate',
        'SKILL.md',
        'Core is missing a mandatory runner specialist-skill gate.',
      );
    }
  }

  for (const [relativePath, source] of sources) {
    await validateLinks(root, relativePath, source, diagnostics);
  }

  return diagnostics.sort((left, right) => (
    left.id.localeCompare(right.id, 'en')
    || left.path.localeCompare(right.path, 'en')
    || left.message.localeCompare(right.message, 'en')
  ));
}

export async function runCli(argv, io = process) {
  if (argv.length > 1) {
    io.stderr.write('input.arguments\n');
    return 2;
  }

  const defaultRoot = fileURLToPath(new URL('..', import.meta.url));
  let diagnostics;
  try {
    diagnostics = await lintSkillPack(argv[0] ?? defaultRoot);
  } catch (error) {
    if (error instanceof PackInputError) {
      io.stderr.write(error.id + '\n');
      return 2;
    }
    throw error;
  }

  if (diagnostics.length > 0) {
    for (const diagnostic of diagnostics) {
      io.stdout.write(
        diagnostic.id + ' ' + diagnostic.path + ' ' + diagnostic.message + '\n',
      );
    }
    return 1;
  }

  io.stdout.write('frontend-testing skill pack: pass\n');
  return 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCli(process.argv.slice(2));
}
