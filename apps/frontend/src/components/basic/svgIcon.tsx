import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { loadImg } from '../../pages/createTask/partials/annotationConfig/configTemplate/config';
interface SvgProps {
  name: string;
  prefix?: string;
  color?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

const SvgIcon: FC<SvgProps> = ({ name, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string>();
  useEffect(() => {
    const shortImgSrc = name.split('-').join('/');
    new Promise(async () => {
      const src = await loadImg(shortImgSrc + '.svg');
      if (src) {
        setImgSrc(src);
      }
    });
  }, [name]);

  return (
    <img
      alt="tupian"
      {...props}
      style={{
        width: props.width ? props.width : 14,
        height: props.height ? props.height : 14,
        display: 'inlineBlock',
      }}
      src={imgSrc}
    />
  );
};

export default SvgIcon;
