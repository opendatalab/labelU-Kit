const path = require('path');
const childProcess = require('child_process');

const minimist = require('minimist');
const { getPackagesSync } = require('@manypkg/get-packages');

const workspace = path.join(__dirname, '../');

/**
 * 批量提交packages下scope下相同的 commit message
 * --tag: 是否打tag，用于semantic-release跨版本号发布
 * --notes 是否添加notes，用于semantic-release跨版本号发布
 * 用法：
 * 1. cd 到项目根目录
 * 2. node scripts/batch-commit.js 'fix' 'commit message'
 */
async function main() {
  const args = minimist(process.argv.slice(2));
  const { packages } = getPackagesSync(workspace);
  const [type, msg] = args._;
  const { tag, notes } = args;

  const branch = childProcess.execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' });

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

    if (tag) {
      const tagCmd = `git tag ${pkg.packageJson.name}@${pkg.packageJson.version} ${branch.trim()}`;
      console.log(tagCmd);
      childProcess.execSync(tagCmd, { stdio: 'inherit' });
      childProcess.execSync(`git push origin ${pkg.packageJson.name}@${pkg.packageJson.version}`, { stdio: 'inherit' });
    }

    if (notes) {
      const commitHash = childProcess.execSync('git rev-parse HEAD', { encoding: 'utf-8' });
      const notesCmd = `git notes --ref semantic-release add -f -m '{"channels":["alpha"]}' ${commitHash}`;
      console.log(notesCmd);
      childProcess.execSync(notesCmd, { stdio: 'inherit' });
    }
  }
}

main();
