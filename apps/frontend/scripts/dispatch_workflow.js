const minimist = require('minimist');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
});

function findLatestVersion(versions) {
  const versionNumbers = versions.map((version) => {
    const versionParts = version.split('.');
    return versionParts.reduce((total, part, index) => {
      return total + parseInt(part.replace('release/v', '')) * Math.pow(10, (versionParts.length - index - 1) * 3);
    }, 0);
  });

  return versions[versionNumbers.indexOf(Math.max(...versionNumbers))];
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const [branch, nextVersion] = args._;
  const version = `v${nextVersion}`;
  const url = `https://github.com/opendatalab/labelU-Kit/releases/download/${version}/frontend.zip`;

  const inputs = {
    version: version,
    branch,
    name: 'frontend',
    assets_url: url,
  };

  console.log('inputs', inputs);

  const labelUBranches = await octokit.request('GET /repos/opendatalab/labelU/branches', {
    owner: 'opendatalab',
    repo: 'labelU',
  });

  const releaseBranches = (labelUBranches.data || [])
    .filter((branch) => branch.name.startsWith('release/'))
    .map((branch) => branch.name);
  const latestReleaseVersion = findLatestVersion(releaseBranches);

  console.log('labelu latest release version is', latestReleaseVersion);

  octokit.actions
    .createWorkflowDispatch({
      owner: 'opendatalab',
      repo: 'labelU',
      workflow_id: `${branch === 'release' ? 'release_' : ''}cicd_pipeline.yml`,
      ref: branch === 'release' ? latestReleaseVersion : 'dev',
      inputs,
    })
    .then((res) => {
      console.log(res);
      console.log('trigger labelu workflow success');
    })
    .catch((err) => {
      console.log('trigger labelu workflow failed', err);
    });
}

main();
