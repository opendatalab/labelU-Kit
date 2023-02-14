import React, { FC, useEffect, useState } from 'react';
import { Checkbox, Form } from 'antd';
import { useDispatch, useSelector } from '@/store/ctx';
import {
  UpdateIsShowAttribute,
  UpdateIsShowAttributeText,
  UpdateIsShowDirection,
  UpdateIsShowOrder,
} from '@/store/annotation/actionCreators';
import { AppState } from '@/store';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';

interface LabelShowConfigItems {
  isShowAttributeText: boolean;
  isShowAttribute: boolean;
  isShowOrder: boolean;
  isShowDirection: boolean;
}

const LabelShowSetArea: FC = () => {
  const dispatch = useDispatch();
  const { isShowOrder, isShowDirection, isShowAttribute, isShowAttributeText } = useSelector(
    (state: AppState) => state.annotation,
  );
  const [initValue, setInitialValue] = useState<LabelShowConfigItems>({
    isShowAttributeText: false,
    isShowAttribute: false,
    isShowOrder: false,
    isShowDirection: false,
  });
  const labelShowFormConfig = [
    {
      name: '显示标签信息',
      key: 'isShowAttributeText',
      onChange: (value: CheckboxChangeEvent) => {
        dispatch(UpdateIsShowAttribute(value.target.checked));
      },
    },
    {
      name: '显示属性信息',
      key: 'isShowAttribute',
      onChange: (value: CheckboxChangeEvent) => {
        dispatch(UpdateIsShowAttributeText(value.target.checked));
      },
    },
    {
      name: '显示标记顺序',
      key: 'isShowOrder',
      onChange: (value: CheckboxChangeEvent) => {
        dispatch(UpdateIsShowOrder(value.target.checked));
      },
    },
    {
      name: '显示标记方向',
      key: 'isShowDirection',
      onChange: (value: CheckboxChangeEvent) => {
        dispatch(UpdateIsShowDirection(value.target.checked));
      },
    },
  ];

  useEffect(() => {
    setInitialValue({
      isShowAttributeText: isShowAttributeText,
      isShowAttribute: isShowAttribute,
      isShowOrder: isShowOrder,
      isShowDirection: isShowDirection,
    });
  }, [isShowOrder, isShowDirection, isShowAttribute, isShowAttributeText]);

  return (
    <Form name='basic' layout='vertical' autoComplete='off' initialValues={initValue}>
      {labelShowFormConfig &&
        labelShowFormConfig.length > 0 &&
        labelShowFormConfig.map((item) => {
          return (
            <Form.Item key={item.key} valuePropName='checked' name={item.key}>
              <Checkbox onChange={item.onChange}>{item.name}</Checkbox>
            </Form.Item>
          );
        })}
    </Form>
  );
};

export default LabelShowSetArea;
