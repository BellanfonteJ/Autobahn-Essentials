const assert = require('node:assert/strict');
const { test } = require('node:test');
const YAML = require('yaml');
const { read } = require('./helpers/theme.cjs');

test('release checks use pinned read-only actions, enforce quality gates and never deploy', () => {
  const workflow = YAML.parse(read('.github/workflows/theme-quality.yml'));
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
  assert.equal(Object.hasOwn(workflow.on, 'pull_request_target'), false);
  const job = workflow.jobs.quality;
  assert.ok(job['timeout-minutes'] <= 15);
  const actions = job.steps.filter((step) => step.uses);
  for (const action of actions) assert.match(action.uses, /^actions\/[\w-]+@[a-f0-9]{40}$/);
  assert.equal(actions.find((step) => step.uses.startsWith('actions/checkout@')).with['persist-credentials'], false);
  const commands = job.steps.filter((step) => step.run).map((step) => step.run).join('\n');
  for (const gate of ['--frozen-lockfile', 'pnpm test', 'pnpm theme:check', 'pnpm theme:package', 'pnpm audit --audit-level high']) assert.ok(commands.includes(gate), gate);
  assert.doesNotMatch(commands, /theme\s+(?:publish|push)|git\s+push|secrets\./i);
  assert.equal(job.environment, undefined);
});
