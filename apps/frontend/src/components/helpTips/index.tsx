import { BellOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import currentStyles from './index.module.scss';

const HelpLink = 'https://github.com/opendatalab/labelU/blob/main/docs/GUIDE.md';

const HelpTips = () => {
  return (
    <div className={currentStyles.outerFrame}>
      <Button
        type="link"
        icon={<BellOutlined />}
        href={HelpLink}
        style={{ color: 'rgba(0, 0, 0, 0.85)' }}
        target="_blank"
        rel="noreferrer"
      >
        帮助文档
      </Button>
    </div>
  );
};

export default HelpTips;
