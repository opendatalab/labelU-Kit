import { css } from '@emotion/react';

import type { MyFormProps } from '@/components/core/form';
import MyForm from '@/components/core/form';
import MyButton from '@/components/basic/button';

interface SearchProps<T> extends MyFormProps<T> {
  onSearch: (values: T) => void;
}

const styles = css`
  padding: 20px;
  background-color: #ffffff;
  .ant-form-item {
    margin-bottom: 20px;
  }
`;

// @ts-ignore
const BaseSearch = <T extends Record<string, unknown>>(props: SearchProps<T>) => {
  const { children, onSearch, ...rest } = props;
  const [form] = MyForm.useForm<T>();

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (values) {
      onSearch(values);
    }
  };

  return (
    // eslint-disable-next-line react/no-unknown-property
    <div css={styles}>
      <MyForm {...rest} form={form} layout="inline">
        {children}
        <MyForm.Item>
          <MyButton type="primary" onClick={onSubmit}>
            查询
          </MyButton>

          <MyButton onClick={() => form.resetFields()}>重置</MyButton>
        </MyForm.Item>
      </MyForm>
    </div>
  );
};

BaseSearch.Item = MyForm.Item;

export default BaseSearch;
