import currentStyles from './index.module.scss';

const HelpLink = 'https://github.com/opendatalab/labelU/blob/main/docs/GUIDE.md';
const LinkColor = 'rgba(0, 0, 0, 0.85)';

const HelpTips = (props: any) => {
  return (
    <div className={currentStyles.outerFrame}>
      <a href={HelpLink} target="_blank" style={{ color: LinkColor }} rel="noreferrer">
        帮助文档&nbsp;&nbsp;
        <img src="/src/icons/helpText.svg" />
      </a>
    </div>
  );
};

export default HelpTips;
