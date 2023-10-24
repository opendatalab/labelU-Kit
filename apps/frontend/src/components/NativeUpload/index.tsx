import type { HTMLAttributes, PropsWithChildren } from 'react';
import React, { createRef, useEffect } from 'react';
import type { RcFile } from 'antd/lib/upload/interface';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;
  overflow: hidden;
  display: inline;
  cursor: pointer;
  > input {
    opacity: 0;
    position: absolute;
    height: 100%;
    width: 100%;
    z-index: 10;
    top: 0;
    left: 0;
    cursor: pointer;
  }
`;

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
    <Wrapper>
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
    </Wrapper>
  );
};

export default NativeUpload;
