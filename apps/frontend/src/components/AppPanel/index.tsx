import { ArrowRightOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import _ from 'lodash';

import { ReactComponent as LabelLLM } from '@/assets/svg/labelllm.svg';
import { ReactComponent as MinorU } from '@/assets/svg/minoru.svg';
import { ReactComponent as OpenDataLab } from '@/assets/svg/opendatalab.svg';

import styles from './index.module.css';

interface AppLink {
  name: string;
  title: string;
  link: string;
  icon: JSX.Element;
  description: string;
}

const apps = [
  {
    name: 'OpenDataLab',
    title: '立即前往',
    link: 'https://opendatalab.com',
    icon: <OpenDataLab />,
    description: '一个引领 AI 大模型时代的开放数据平台，提供了海量的、多模态的优质数据集，助力 AI 开发落地',
  },
  {
    name: 'LabelLLM',
    title: 'Github',
    link: 'https://labelllm.com',
    icon: <LabelLLM />,
    description: '专业致力于 LLM 对话标注，通过灵活的工具配置与多种数据模态的广泛兼容，为大模型打造高质量数据',
  },
  {
    name: 'MinorU',
    title: 'Github',
    link: 'https://minoru.com',
    icon: <MinorU />,
    description: '一站式开源高质量数据提取工具，支持多格式（PDF/网页/电子书），智能萃取，生成高质量语料',
  },
];

export default function AppPanel() {
  const handleGoApp = (app: AppLink) => {
    window.open(app.link, '_blank');
  };

  return (
    <div>
      <div className={styles.title}>欢迎使用 OpenDataLab 开源工具 🎉</div>
      <div className={styles.panel}>
        {_.map(apps, (app) => {
          return (
            <div key={app.title} className={styles.appWrapper}>
              <div className={styles.appContainer}>
                <div className={styles.header} onClick={() => handleGoApp(app)}>
                  <Avatar shape="square" className={styles.avatar} src={app.icon} />
                  <div className={styles.appInfo}>
                    {app.name}
                    <div className={styles.description}>{app.description}</div>
                  </div>
                </div>
                <div className={styles.links}>
                  <a href={app.link} target="_blank" rel="noreferrer" className={styles.link}>
                    {app.title}
                    <ArrowRightOutlined className={styles.arrow} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
