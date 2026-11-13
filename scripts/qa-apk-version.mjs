/**
 * Names QA APKs using the package version and the successful-build sequence.
 * Historic builds are pinned in .github/qa-build-history.json. New successful
 * builds are persisted as lightweight qa/vX.Y.Z[-N] Git tags so artifact expiry
 * does not reset the sequence.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const mode = process.argv[2];
const sha = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(sha ?? '')) {
  throw new Error('GITHUB_SHA must be a full commit SHA.');
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Invalid QA package version: ${version}`);
}

const prefix = `qa/v${version}`;
const tagFor = (revision) => `${prefix}${revision === 0 ? '' : `-${revision}`}`;
const tagPattern = new RegExp(`^${prefix.replaceAll('.', '\\.')}(?:-([1-9]\\d*))?$`);

function getExistingTags() {
  const output = git('ls-remote', '--refs', '--tags', 'origin', `refs/tags/${prefix}*`);
  if (!output) return [];
  return output.split('\n').flatMap((line) => {
    const [tagSha, ref] = line.split(/\s+/);
    const tag = ref?.replace(/^refs\/tags\//, '');
    const match = tag?.match(tagPattern);
    if (!match) return [];
    return [{ version, sha: tagSha, revision: match[1] === undefined ? 0 : Number(match[1]) }];
  });
}

if (mode === 'plan') {
  const history = JSON.parse(readFileSync('.github/qa-build-history.json', 'utf8'));
  const entries = [...history.builds.filter((entry) => entry.version === version), ...getExistingTags()];
  const byRevision = new Map();
  const bySha = new Map();

  for (const entry of entries) {
    if (!Number.isSafeInteger(entry.revision) || entry.revision < 0 ||
        !/^[a-f0-9]{40}$/.test(entry.sha)) {
      throw new Error('Invalid historical QA build record.');
    }
    if (byRevision.has(entry.revision) && byRevision.get(entry.revision) !== entry.sha) {
      throw new Error(`Conflicting QA revision: ${entry.revision}`);
    }
    if (bySha.has(entry.sha) && bySha.get(entry.sha) !== entry.revision) {
      throw new Error(`Conflicting QA commit: ${entry.sha}`);
    }
    byRevision.set(entry.revision, entry.sha);
    bySha.set(entry.sha, entry.revision);
  }

  const revision = bySha.get(sha) ?? Math.max(-1, ...byRevision.keys()) + 1;
  const label = `v${version}${revision === 0 ? '' : `-${revision}`}`;
  const filename = `easy-do-qa-${label}.apk`;
  const tag = tagFor(revision);
  const output = process.env.GITHUB_OUTPUT;
  if (!output) throw new Error('GITHUB_OUTPUT is required.');
  appendFileSync(output, `filename=${filename}\nartifact_name=easy-do-qa-${label}\ntag=${tag}\n`);
  console.log(`QA build name: ${filename} (commit ${sha.slice(0, 7)})`);
} else if (mode === 'record') {
  const tag = process.env.QA_TAG;
  if (!tag || !tagPattern.test(tag)) {
    throw new Error(`Invalid QA_TAG for version ${version}: ${tag}`);
  }
  const existing = git('ls-remote', '--refs', '--tags', 'origin', `refs/tags/${tag}`);
  if (existing) {
    const [tagSha, tagRef] = existing.split(/\s+/);
    if (tagRef !== `refs/tags/${tag}` || tagSha !== sha) {
      throw new Error(`QA build tag ${tag} already points to another commit.`);
    }
    console.log(`QA build tag already exists: ${tag}`);
  } else {
    git('tag', tag, sha);
    git('push', 'origin', `refs/tags/${tag}`);
    console.log(`Saved successful QA build as tag: ${tag}`);
  }
} else {
  throw new Error('Usage: node scripts/qa-apk-version.mjs plan|record');
}
