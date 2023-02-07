const minimist = require('minimist');
const { Octokit } = require("@octokit/rest");
const nodeFetch = require('node-fetch');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
});

const wechatRobotUrl = process.env.WEBHOOK_URL;

async function main() {
  const args = minimist(process.argv.slice(2));
  const [branchName, releaseNotes] = args._;

  if (!wechatRobotUrl) {
    console.log('wechat robot url is not set');
    return;
  }

  if (!branchName) {
    console.log('current branch is not set');
    return;
  }

  nodeFetch(wechatRobotUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      msgtype:"markdown",
      markdown: {
        content: releaseNotes
      }
    }),
  }).then(() => {
    console.log('send wechat robot success');
  }).catch((err) => {
    console.log('send wechat robot failed', err);
  });

  console.log('Create a pull request');

  octokit.rest.pulls.create({
    owner: 'opendatalab',
    repo: 'labelU-Kit',
    ref: branchName,
    base: 'main',
    body: releaseNotes,
  }).then(() => {
    console.log('Create a pull request success');
  }).catch((err) => {
    console.log('Create a pull request failed', err);
  });
}

main();
