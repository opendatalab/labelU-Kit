const minimist = require('minimist');
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
});
function main() {
  const args = minimist(process.argv.slice(2));
  const [branch, nextVersion] = args._;
  console.log(branch, nextVersion);
  const url = `https://github.com/opendatalab/labelU-Kit/releases/download/${nextVersion}/frontend.zip`;
  console.log('trigger labelu workflow', url);
  const inputs = {
    version: nextVersion,
    branch,
    name: 'frontend',
    assets_url: url,
  };

  console.log('inputs', inputs);
  octokit.actions.createWorkflowDispatch({
    owner: 'opendatalab',
    repo: 'labelU',
    workflow_id: `${branch === 'release' ? 'main_' : ''}cicd_pipeline.yml`,
    ref: branch === 'release' ? 'main' : 'dev',
    inputs,
  }).then((res) => {
    console.log(res)
    console.log('trigger labelu workflow success');
  }).catch(err => {
    console.log('trigger labelu workflow failed', err);
  });
}

main();
