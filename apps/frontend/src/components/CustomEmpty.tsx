import React from 'react';

import { ReactComponent as EmptyElement } from '@/assets/svg/empty.svg';

export default function CustomEmpty({ description }: { description?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center items-center py-4">
      <EmptyElement className="w-20 h-20" />
      <p className="text-[var(--color-text-secondary)]">{description ?? '暂无数据'}</p>
    </div>
  );
}
