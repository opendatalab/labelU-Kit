const minimist = require('minimist');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.PERSONAL_TOKEN,
});

function uploadAssets(version) {
  const file = fs.readFileSync(path.join(__dirname, '../frontend.zip'));
  const options = {
    hostname: 'static-files.shlab.tech',
    path: `/upload/labelU-Kit/releases/download/${version}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': file.length,
      Authorization: `${process.env.STATIC_SERVER_TOKEN}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);

      res.on('data', (d) => {
        process.stdout.write(d);
      });

      res.on('end', () => {
        console.log('upload success!');
        resolve();
      });

      if (res.statusCode && res.statusCode >= 400) {
        reject(res);
      }
    });

    req.write(file);
    req.end();
    req.on('error', (e) => {
      reject(e);
    });
  });
}

function gitlabCiTrigger(nextVersion) {
  // aliyun ecs 访问github有问题
  const url = `https://static-files.shlab.tech/download/labelU-Kit/releases/download/${nextVersion}/frontend.zip`;
  const gitlabTriggerUrl = new URL(
    `https://gitlab.shlab.tech/api/v4/projects/${process.env.GI_LABELU_PROJECT_ID}/trigger/pipeline?token=${process.env.GL_TRIGGER_TOKEN}&ref=test`,
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
  const [branch, nextVersion, releaseTime, releaseNotes] = args._;
  const version = `v${nextVersion}`;

  if (branch === 'online') {
    // 上传zip到静态服务器
    await uploadAssets(version);
    await gitlabCiTrigger(version);
  }
}

main();
