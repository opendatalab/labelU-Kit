/**
 * This script will be executed before release frontend app
 * update frontend app deps version
 */
const path = require('path');
const fs = require('fs');
const { getPackagesSync } = require('@manypkg/get-packages');
const workspace = path.join(__dirname, '../');

function updateAppDepsVersion() {
  const appPkgJson = require(path.join(workspace, 'apps/frontend/package.json'));
  const { packages } = getPackagesSync(workspace);

  let isNotChanged = true;

  packages.forEach((pkg) => {
    const pkgInFrontend = appPkgJson.dependencies[pkg.packageJson.name];
    if (pkgInFrontend && pkgInFrontend !== pkg.packageJson.version) {
      isNotChanged = false;
      console.log(`update ${pkg.packageJson.name} version from ${pkgInFrontend} to ${pkg.packageJson.version}`);
      appPkgJson.dependencies[pkg.packageJson.name] = pkg.packageJson.version;
    }
  });

  if (isNotChanged) {
    console.log('app deps version is not changed');
  } else {
    fs.writeFileSync(path.join(workspace, 'apps/frontend/package.json'), JSON.stringify(appPkgJson, null, 2), 'utf-8');
  }
}

async function main() {
  updateAppDepsVersion();
}

main();
