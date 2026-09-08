import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual, promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const maximumFileBytes = 64 * 1024 * 1024;
const maximumGitOutputBytes = 16 * 1024 * 1024;

function addIssue(issues, id, issuePath, message) {
  if (
    !issues.some(
      (issue) => issue.id === id && issue.path === issuePath && issue.message === message,
    )
  ) {
    issues.push({ id, path: issuePath, message });
  }
}

function compareUtf8Text(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

function isSamePathOrDescendant(candidate, root) {
  return candidate === root || candidate.startsWith(`${root}/`);
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function isNormalizedGitPath(filePath) {
  return (
    typeof filePath === 'string' &&
    filePath.length > 0 &&
    !filePath.includes('\0') &&
    !filePath.includes('\\') &&
    !path.posix.isAbsolute(filePath) &&
    filePath === path.posix.normalize(filePath) &&
    filePath !== '.' &&
    !filePath.startsWith('../')
  );
}

async function hasSymlinkComponent(root, candidate) {
  if (!isContained(root, candidate)) return false;
  const relative = path.relative(root, candidate);
  if (relative.length === 0) return false;
  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function runGit(projectRoot, args, issues) {
  try {
    const { stdout } = await execFile('git', ['-C', projectRoot, ...args], {
      encoding: 'buffer',
      env: {
        ...process.env,
        GIT_LITERAL_PATHSPECS: '1',
        GIT_OPTIONAL_LOCKS: '0',
        LC_ALL: 'C',
      },
      maxBuffer: maximumGitOutputBytes,
      shell: false,
      windowsHide: true,
    });
    return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
  } catch {
    addIssue(
      issues,
      'git-command',
      '$.baseline',
      'Git baseline inspection failed; use a readable repository root and full commit ID.',
    );
    return undefined;
  }
}

function nulSeparatedValues(buffer, issues, issuePath) {
  if (!Buffer.isBuffer(buffer)) return [];
  try {
    return new TextDecoder('utf-8', { fatal: true })
      .decode(buffer)
      .split('\0')
      .filter((value) => value.length > 0);
  } catch {
    addIssue(issues, 'git-path', issuePath, 'Git paths must be valid UTF-8.');
    return [];
  }
}

async function currentEntry(projectRoot, filePath, issues) {
  const issuePath = `$.baseline.changes[${JSON.stringify(filePath)}]`;
  if (!isNormalizedGitPath(filePath)) {
    addIssue(issues, 'git-path', issuePath, 'Git returned a non-normalized project path.');
    return undefined;
  }
  const candidate = path.resolve(projectRoot, filePath);
  if (!isContained(projectRoot, candidate) || await hasSymlinkComponent(projectRoot, candidate)) {
    addIssue(
      issues,
      'git-file',
      issuePath,
      'Changed paths must stay inside the repository and contain no symbolic links.',
    );
    return undefined;
  }
  let stats;
  try {
    stats = await lstat(candidate);
  } catch {
    return { path: filePath, kind: 'deleted', mode: null, hash: null };
  }
  if (!stats.isFile()) {
    addIssue(
      issues,
      'git-file',
      issuePath,
      'Changed paths must be regular files or deletions.',
    );
    return undefined;
  }
  if (stats.size > maximumFileBytes) {
    addIssue(
      issues,
      'git-file',
      issuePath,
      'Changed file exceeds the 64 MiB safety limit.',
    );
    return undefined;
  }
  try {
    const mode = stats.mode & 0o111 ? '100755' : '100644';
    const hash = `sha256:${createHash('sha256').update(await readFile(candidate)).digest('hex')}`;
    return { path: filePath, kind: 'file', mode, hash };
  } catch {
    addIssue(issues, 'git-file', issuePath, 'Changed file is unreadable.');
    return undefined;
  }
}

async function readSnapshot(projectRoot, revision, excludedRoots, issues, suffix = '') {
  const [head, tracked, untracked, unmerged, flags] = await Promise.all([
    runGit(projectRoot, ['rev-parse', '--verify', 'HEAD^{commit}'], issues),
    runGit(
      projectRoot,
      [
        'diff',
        '--name-only',
        '-z',
        '--no-renames',
        '--no-ext-diff',
        '--ignore-submodules=none',
        revision,
        '--',
      ],
      issues,
    ),
    runGit(projectRoot, ['ls-files', '--others', '--exclude-standard', '-z', '--'], issues),
    runGit(projectRoot, ['ls-files', '-u', '-z'], issues),
    runGit(projectRoot, ['ls-files', '-v', '-z'], issues),
  ]);
  if (!head || !tracked || !untracked || !unmerged || !flags) return undefined;
  if (unmerged.length > 0) {
    addIssue(
      issues,
      'git-unmerged',
      '$.baseline',
      'Unmerged Git index entries are not supported.',
    );
  }
  const trackedFlags = nulSeparatedValues(flags, issues, `$.baseline.trackedFlags${suffix}`);
  if (trackedFlags.some((entry) => entry[0] === 'S' || /^[a-z]/u.test(entry))) {
    addIssue(
      issues,
      'git-hidden',
      '$.baseline',
      'Git skip-worktree and assume-unchanged entries are not supported.',
    );
  }
  const paths = [
    ...new Set([
      ...nulSeparatedValues(tracked, issues, `$.baseline.trackedChanges${suffix}`),
      ...nulSeparatedValues(untracked, issues, `$.baseline.untrackedChanges${suffix}`),
    ]),
  ]
    .filter(
      (filePath) =>
        !excludedRoots.some((root) => isSamePathOrDescendant(filePath, root)),
    )
    .sort(compareUtf8Text);
  const entries = [];
  for (const filePath of paths) {
    const entry = await currentEntry(projectRoot, filePath, issues);
    if (entry) entries.push(entry);
  }
  return {
    head: head.toString('utf8').trim(),
    entries,
    unmerged: unmerged.length > 0,
    hidden: trackedFlags.some((entry) => entry[0] === 'S' || /^[a-z]/u.test(entry)),
  };
}

export async function inspectGitBaseline({ projectRoot, revision, excludedRoots = [] } = {}) {
  const issues = [];
  let canonicalRoot;
  try {
    canonicalRoot = await realpath(projectRoot);
    if (!(await lstat(canonicalRoot)).isDirectory()) throw new Error('not a directory');
  } catch {
    addIssue(issues, 'git-root', '$.baseline.repositoryRoot', 'Repository root is unreadable.');
    return { issues };
  }

  const [topLevel, resolvedRevision] = await Promise.all([
    runGit(canonicalRoot, ['rev-parse', '--show-toplevel'], issues),
    runGit(canonicalRoot, ['rev-parse', '--verify', `${revision}^{commit}`], issues),
  ]);
  if (!topLevel || !resolvedRevision) return { projectRoot: canonicalRoot, issues };

  let gitRoot;
  try {
    gitRoot = await realpath(topLevel.toString('utf8').trim());
  } catch {
    addIssue(issues, 'git-root', '$.baseline.repositoryRoot', 'Git returned an unreadable root.');
  }
  if (gitRoot !== canonicalRoot) {
    addIssue(
      issues,
      'git-root',
      '$.baseline.repositoryRoot',
      'projectRoot must be the exact Git repository root.',
    );
  }
  const resolvedRevisionText = resolvedRevision.toString('utf8').trim();
  if (resolvedRevisionText !== revision) {
    addIssue(
      issues,
      'git-revision',
      '$.baseline.revision',
      'Baseline revision must be the full object ID returned by Git.',
    );
  }

  const first = await readSnapshot(canonicalRoot, revision, excludedRoots, issues);
  if (!first) return { projectRoot: canonicalRoot, issues };
  if (first.head !== revision) {
    addIssue(
      issues,
      'git-head',
      '$.baseline.revision',
      'Git HEAD must equal the baseline revision.',
    );
  }
  const second = await readSnapshot(canonicalRoot, revision, excludedRoots, issues, 'After');
  if (
    second &&
    (second.head !== first.head ||
      second.unmerged !== first.unmerged ||
      second.hidden !== first.hidden ||
      !isDeepStrictEqual(second.entries, first.entries))
  ) {
    addIssue(
      issues,
      'git-race',
      '$.baseline',
      'Git-visible state changed while the baseline was being inspected.',
    );
  }
  return {
    projectRoot: canonicalRoot,
    revision: resolvedRevisionText,
    head: first.head,
    entries: first.entries,
    issues,
  };
}
