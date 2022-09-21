import { FC } from 'react';

interface SvgProps {
  name: string;
  prefix?: string;
  color?: string;
  [key: string]: any;
}

const SvgIcon: FC<SvgProps> = ({ name, prefix = 'icon', color = '#333', ...props }) => {
  const symbolId = `#${prefix}-${name}`;

  return (
    <svg {...props} aria-hidden="true" style={{ width: 14, height: 14, display: 'inlineBlock' }}>
      <use href={symbolId} fill={color} />
    </svg>
  );
};

export default SvgIcon;
