const minimist = require('minimist');
const path = require('path');
const childProcess = require('child_process');
const { getPackagesSync } = require('@manypkg/get-packages');

const workspace = path.join(__dirname, '../');

async function main() {
  const args = minimist(process.argv.slice(2));
  const { packages } = getPackagesSync(workspace);
  const [type, msg] = args._;

  for (const pkg of packages) {
    const pkgDir = path.join(pkg.dir);
    const status = childProcess.execSync(`git status ${pkgDir}`, { encoding: 'utf-8' });

    if (status && status.split('\n').includes('nothing to commit, working tree clean')) {
      console.log(status);
      continue;
    }

    childProcess.execSync(`git add ${pkgDir}`);

    console.log(`git add ${pkgDir}`);
    const commitMsg = `git commit -m '${type}(${path.basename(pkg.dir)}): ${msg}'`;
    console.log(commitMsg);
    childProcess.execSync(commitMsg, { stdio: 'inherit' });
  }
}

main();
