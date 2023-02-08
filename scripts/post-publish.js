const minimist = require('minimist');
const { Octokit } = require('@octokit/rest');
const nodeFetch = require('node-fetch');
const path = require('path');
const { getPackagesSync } = require('@manypkg/get-packages');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
});

const workspace = path.join(__dirname, '../');

function sendMessageToWechat(content) {
  const wechatRobotUrl = process.env.WEBHOOK_URL;

  if (!wechatRobotUrl) {
    return Promise.reject('wechat robot url is not set');
  }

  return nodeFetch(wechatRobotUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        content,
      },
    }),
  })
    .then(() => {
      console.log('send wechat robot success');
    })
    .catch((err) => {
      console.log('send wechat robot failed', err);
    });
}

function createPullRequest({ branchName, body, title = branchName, base = 'main' }) {
  if (!branchName) {
    return Promise.reject('branch name is not set');
  }

  console.log('Create a pull request');

  return octokit.rest.pulls
    .create({
      owner: 'opendatalab',
      repo: 'labelU-Kit',
      head: branchName,
      title,
      base,
      body,
    })
    .then(() => {
      console.log('Create a pull request success');
    })
    .catch((err) => {
      console.log('Create a pull request failed', err);
    });
}

function updateAppDepsVersion() {
  const appPkgJson = require(path.join(workspace, 'apps/frontend/package.json'));
  const packages = getPackagesSync(workspace);

  packages.forEach((pkg) => {
    if (appPkgJson.dependencies[pkg.packageJson.name]) {
      appPkgJson.dependencies[pkg.packageJson.name] = pkg.packageJson.version;
    }
  });
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const [branchName, releaseNotes] = args._;

  sendMessageToWechat(releaseNotes);

  createPullRequest({
    branchName,
    body: releaseNotes,
    base: 'main',
    title: 'Update package version',
  });
}

main();
