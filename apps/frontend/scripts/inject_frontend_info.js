const path = require('path');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
const childProcess = require('child_process');

const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
});

const prettier = require('prettier');
const { getPackagesSync } = require('@manypkg/get-packages');
const minimist = require('minimist');

async function createCommit({ owner, repo, message, content, branch, filepath }) {
  const currentBranchRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });

  const currentCommit = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: currentBranchRef.data.object.sha,
  });

  const { data: commitData } = await octokit.git.createCommit({
    owner,
    repo,
    message,
    tree: currentCommit.data.tree.sha,
    parents: [currentCommit.data.sha],
  });

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commitData.sha,
  });
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const [branch, nextVersion] = args._;
  const appPkgJson = require('../package.json');
  const workspace = path.join(__dirname, '../../../');
  const versions = {
    version: nextVersion || appPkgJson.version,
    deps: {},
  };

  if (nextVersion) {
    appPkgJson.version = nextVersion;
    fs.writeFileSync(path.join(__dirname, '../package.json'), JSON.stringify(appPkgJson, null, 2), 'utf-8');
    console.log('update package.json version success!');

    createCommit({
      owner: 'opendatalab',
      repo: 'labelU-Kit',
      message: `chore: update package.json version to ${nextVersion} [skip ci]`,
      content: Buffer.from(JSON.stringify(appPkgJson, null, 2), 'utf-8').toString('base64'),
      branch,
      filepath: path.join(__dirname, '../package.json'),
    });
  }

  console.log('next version is', nextVersion);

  const getCode = (info) => {
    return `
    (function () {
      window.__frontend = ${JSON.stringify(info, null, 2)};
    })();
    `;
  };

  const { packages } = getPackagesSync(workspace);

  packages.forEach((pkg) => {
    const pkgInFrontend = appPkgJson.dependencies[pkg.packageJson.name];
    if (pkgInFrontend) {
      versions.deps[pkg.packageJson.name] = pkg.packageJson.version;
    }
  });

  fs.writeFileSync(
    path.join(__dirname, '../dist/frontend_version.js'),
    prettier.format(getCode(versions), {
      singleQuote: true,
      trailingComma: 'all',
      proseWrap: 'never',
      endOfLine: 'lf',
      tabWidth: 2,
      printWidth: 120,
    }),
    'utf-8',
  );

  console.log('Inject frontend info success!');
}

main();
