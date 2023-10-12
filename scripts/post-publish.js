const minimist = require('minimist');
const nodeFetch = require('node-fetch');

function sendMessageToWechat(content) {
  const wechatRobotUrl = process.env.WEBHOOK_URL;

  if (!wechatRobotUrl) {
    return Promise.reject('wechat robot url is not set');
  }

  return nodeFetch(wechatRobotUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        content,
      },
    }),
  }).then(() => {
    console.log('send wechat robot success');
  });
}

async function main() {
  const args = minimist(process.argv.slice(2));
  const [, releaseNotes] = args._;

  try {
    await sendMessageToWechat(releaseNotes);
  } catch (err) {
    console.log(err);
  }
}

main();
