import { FC, useEffect, useState } from 'react';
import { loadImg } from '../../pages/annotationConfig/configTemplate/config';
interface SvgProps {
  name: string;
  prefix?: string;
  color?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

const SvgIcon: FC<SvgProps> = ({ name, prefix = 'icon', color = '#333', ...props }) => {
  const [imgSrc, setImgSrc] = useState<string>();
  useEffect(() => {
    let shortImgSrc = name.split('-').join('/');
    new Promise(async (resolve, reject) => {
      let src = await loadImg(shortImgSrc + '.svg');
      if (src) {
        setImgSrc(src);
      }
    });
  }, []);

  return (
    <img
      alt="tupian"
      {...props}
      style={{
        width: props.width ? props.width : 14,
        height: props.height ? props.height : 14,
        display: 'inlineBlock'
      }}
      src={imgSrc}
    />
  );
};

export default SvgIcon;
