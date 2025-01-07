const https = require('https');

const minimist = require('minimist');

function gitlabCiTrigger(nextVersion) {
  const url = `https://github.com/opendatalab/labelU-Kit/releases/download/${nextVersion}/frontend.zip`;
  const gitlabTriggerUrl = new URL(
    `https://gitlab.shlab.tech/api/v4/projects/${process.env.GI_LABELU_PROJECT_ID}/trigger/pipeline?token=${process.env.GL_TRIGGER_TOKEN}&ref=self-host`,
  );

  const formData = new URLSearchParams();

  formData.append('variables[frontend_url]', url);

  const options = {
    hostname: gitlabTriggerUrl.hostname,
    path: `${gitlabTriggerUrl.pathname}${gitlabTriggerUrl.search}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode < 300) {
      console.log('trigger labelu workflow success');
    } else {
      console.log('trigger labelu workflow failed', res);
    }
  });

  req.on('error', (e) => {
    console.log('trigger labelu workflow error', e);
  });
  req.write(formData.toString());
  req.end();
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const [branch, nextVersion] = args._;
  const version = `v${nextVersion}`;

  if (branch === 'online') {
    await gitlabCiTrigger(version);
  }
}

main();
