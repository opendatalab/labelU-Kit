const shell = require('shelljs');
const minimist = require('minimist');

function main() {
  const args = minimist(process.argv.slice(2));
  const [branch, nextVersion] = args._;
  console.log(branch, nextVersion);
  shell.exec(`zip -r frontend_${nextVersion}.zip ./dist`);

  // TODO: trigger labelu workflow
}

main();
