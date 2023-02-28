const path = require('path');
const fs = require('fs');

const prettier = require('prettier');
const { getPackagesSync } = require('@manypkg/get-packages');
const minimist = require('minimist');

async function main() {
  const args = minimist(process.argv.slice(2));
  const [nextVersion] = args._;
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
