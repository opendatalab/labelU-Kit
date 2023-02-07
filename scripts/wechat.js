const minimist = require('minimist');

process.env.WEBHOOK_URL = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=62a1598b-a069-4865-b6d6-118a9c2c4edd';

const wechatRobotUrl = process.env.WEBHOOK_URL;

async function main() {
  const args = minimist(process.argv.slice(2));
  const [releaseNotes] = args._;

  fetch(wechatRobotUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      msgtype:"markdown",
      markdown: {
        content: releaseNotes
      }
    }),
  })
}

main();
