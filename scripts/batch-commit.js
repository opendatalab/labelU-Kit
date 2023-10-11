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
    childProcess.execSync(`git add ${pkgDir}`, { stdio: 'inherit' });
    console.log(`git add ${pkgDir}`);
    const commitMsg = `git commit -m '${type}(${path.basename(pkg.dir)}): ${msg}'`;
    console.log(commitMsg);
    childProcess.execSync(commitMsg, { stdio: 'inherit' });
  }
}

main();
