import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { createRef, useEffect } from 'react';
import type { RcFile } from 'antd/lib/upload/interface';

import styles from './index.module.scss';

type IProps = HTMLAttributes<HTMLDivElement> & {
  accept?: string;
  directory?: boolean; // 是否开启文件夹上传
  multiple?: boolean; // 多文件上传
  onChange?: (files: RcFile[]) => void;
};

const NativeUpload: React.FC<PropsWithChildren<IProps>> = (props) => {
  const inputRef = createRef<any>();
  const { children, directory, multiple, ...req } = props;
  useEffect(() => {
    inputRef.current.webkitdirectory = directory;
    inputRef.current.multiple = multiple;
  }, [directory, inputRef, multiple]);
  return (
    <div className={styles.upload}>
      <input
        ref={inputRef}
        type="file"
        name="fileList"
        {...req}
        onChange={(e) => {
          props.onChange?.(Array.from(e.target.files || []) as RcFile[]);
          e.target.value = '';
        }}
      />
      {children}
    </div>
  );
};

export default NativeUpload;
