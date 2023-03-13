const fs = require('fs');
const path = require('path');

const _ = require('lodash');
let codeTemplate;
const targetPath = path.join(__dirname, '../src/styles/global-variables.scss');
const tokenPath = path.join(__dirname, '../src/styles/theme.json');

try {
  const theme = {
    ...require(tokenPath).token,
  };

  console.log('theme', theme);

  const result = _.chain(theme)
    .keys()
    .map((key) => {
      const newKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `--${newKey}: ${theme[key]};`;
    })
    .value();

  codeTemplate = `
  /**
   * 此文件由apps/frontend/scripts/generate_css_variables_from_antd_theme_token.js脚本生成
   * 请勿直接修改此文件
   * */
    :root {
      ${result.join('\n')}
    }
  `;

  fs.unlinkSync(targetPath);
} catch (err) {
} finally {
  if (codeTemplate) {
    fs.writeFile(targetPath, codeTemplate, 'utf-8', () => {
      console.log(`🎉 ${targetPath}已生成`);
    });
  }
}
