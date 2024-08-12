import { ArrowRightOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';
import _ from 'lodash';

import { ReactComponent as LabelLLM } from '@/assets/svg/labelllm.svg';
import { ReactComponent as MinerU } from '@/assets/svg/mineru.svg';
import { ReactComponent as OpenDataLab } from '@/assets/svg/opendatalab.svg';

import styles from './index.module.css';

interface AppLink {
  name: string;
  title: string;
  links: {
    name: string;
    link: string;
  }[];
  icon: JSX.Element;
  description: string;
}

const apps = [
  {
    name: 'OpenDataLab',
    links: [{ name: '立即前往', link: 'https://opendatalab.com' }],
    icon: <OpenDataLab />,
    description: '一个引领 AI 大模型时代的开放数据平台，提供了海量的、多模态的优质数据集，助力 AI 开发落地',
  },
  {
    name: 'LabelLLM',
    links: [
      {
        name: 'Github',
        link: 'https://github.com/opendatalab/LabelLLM?tab=readme-ov-file#labelllm-the-open-source-data-annotation-platform',
      },
    ],
    icon: <LabelLLM />,
    description: '专业致力于 LLM 对话标注，通过灵活的工具配置与多种数据模态的广泛兼容，为大模型打造高质量数据',
  },
  {
    name: 'MinerU',
    links: [
      { name: 'Github', link: 'https://github.com/opendatalab/MinerU' },
      { name: '在线体验', link: 'https://opendatalab.com/OpenSourceTools/Extractor/PDF' },
    ],
    icon: <MinerU />,
    description: '一站式开源高质量数据提取工具，支持多格式（PDF/网页/电子书），智能萃取，生成高质量语料',
  },
];

export default function AppPanel() {
  const handleGoApp = (app: AppLink) => {
    window.open(app.links[0].link, '_blank');
  };

  return (
    <div>
      <div className={styles.title}>欢迎使用 OpenDataLab 开源工具 🎉</div>
      <div className={styles.panel}>
        {_.map(apps, (app) => {
          return (
            <div key={app.name} className={styles.appWrapper}>
              <div className={styles.appContainer}>
                <div className={styles.header} onClick={() => handleGoApp(app)}>
                  <Avatar shape="square" className={styles.avatar} src={app.icon} />
                  <div className={styles.appInfo}>
                    {app.name}
                    <div className={styles.description}>{app.description}</div>
                  </div>
                </div>
                <div className={styles.links}>
                  {_.map(app.links, (link) => {
                    return (
                      <a href={link.link} key={link.name} target="_blank" rel="noreferrer" className={styles.link}>
                        {link.name}
                        <ArrowRightOutlined className={styles.arrow} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
