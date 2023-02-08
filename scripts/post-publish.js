const minimist = require('minimist');
const { Octokit } = require('@octokit/rest');
const nodeFetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
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
  }).then(() => {
    console.log('send wechat robot success');
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
    });
}

function updateAppDepsVersion() {
  const appPkgJson = require(path.join(workspace, 'apps/frontend/package.json'));
  const { packages } = getPackagesSync(workspace);

  let isNotChanged = true;

  packages.forEach((pkg) => {
    const pkgInFrontend = appPkgJson.dependencies[pkg.packageJson.name];
    if (pkgInFrontend && pkgInFrontend !== pkg.packageJson.version) {
      isNotChanged = false;
      appPkgJson.dependencies[pkg.packageJson.name] = pkg.packageJson.version;
    }
  });

  if (!isNotChanged) {
    fs.writeFileSync(path.join(workspace, 'apps/frontend/package.json'), JSON.stringify(appPkgJson, null, 2), 'utf-8');
  } else {
    console.log('app deps version is not changed');
  }
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const [branchName, releaseNotes] = args._;

  try {
    await sendMessageToWechat(releaseNotes);

    await createPullRequest({
      branchName,
      body: releaseNotes,
      base: 'main',
      title: 'Update package version',
    });
  } catch (err) {
    console.log(err);
  } finally {
    updateAppDepsVersion();
  }
}

main();
