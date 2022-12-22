import React, { FC, useEffect, useMemo, useState } from 'react';
import { Button, Form } from 'antd';
import TagInput from '../../components/TagInput';
import { OneTag } from '../../../../interface/toolConfig';
import { useForm } from 'antd/es/form/Form';
import { addInputList, changeInputList, deleteInputList } from '../../../../utils/tool/editTool';
import { delayTime } from '../constants';
export interface AttributeItem {
  key: string;
  value: string;
}
interface FormTagConfig {
  tagList: OneTag[];
}

const TagConfigForm: FC<FormTagConfig & { name: string }> = props => {
  const [form] = useForm();
  const EDIT_SUBSELECTED = true;
  const [initVal, setInitVal] = useState<FormTagConfig>({
    tagList: [
      {
        key: '类别2',
        value: 'class2',
        isMulti: false,
        subSelected: [
          {
            key: '选项2',
            value: 'option2',
            isDefault: true
          },
          {
            key: '选项2-2',
            value: 'option2-2',
            isDefault: false
          }
        ]
      }
    ]
  } as FormTagConfig);

  useMemo(() => {
    if (props) {
      let initV = {
        // @ts-ignore
        tagList:
          props.tagList && props.tagList.length > 0
            ? // @ts-ignore
              props.tagList
            : [
                {
                  key: '类别2',
                  value: 'class2',
                  isMulti: true,
                  subSelected: [
                    {
                      key: '选项2',
                      value: 'option2',
                      isDefault: true
                    },
                    {
                      key: '选项2-2',
                      value: 'option2-2',
                      isDefault: false
                    }
                  ]
                }
              ]
      };
      setInitVal(initV);
    }
  }, []);

  // 更改标签工具里面的对应值
  const changeInputInfo = (
    e: any,
    target: 'key' | 'value' | 'isMulti' | 'isDefault',
    index: number,
    subIndex?: number
  ) => {
    // 这个是什么情况才有 ？
    if (e?.target?.value?.indexOf('@') > -1 && !['isMulti', 'isDefault'].includes(target)) {
      return;
    }
    const tagList = form?.getFieldValue('tagList');
    const newTagList = changeInputList(e, target, tagList, index, subIndex);
    form?.setFieldsValue({ tagList: newTagList });
    setInitVal({
      tagList: newTagList
    });
  };
  // add inputList
  const addInputInfo = (i?: number) => {
    const tagList = form?.getFieldValue('tagList');
    form?.setFieldsValue({
      tagList: addInputList(tagList, EDIT_SUBSELECTED, i, {
        isMulti: true,
        lang: 'cn'
      })
    });
    setInitVal({
      tagList: addInputList(tagList, EDIT_SUBSELECTED, i, {
        isMulti: true,
        lang: 'cn'
      })
    });
  };
  // 删除对应输入
  const deleteInputInfo = (i: number, subIndex?: number) => {
    const tagList = form?.getFieldValue('tagList');

    let newTagList = deleteInputList(tagList, i, subIndex);
    form?.setFieldsValue({ tagList: newTagList });
    setInitVal({
      tagList: newTagList
    });
  };

  // @ts-ignore
  const formSubmitThrottle = window.throttle(() => {
    form.submit();
  }, 10);

  // 表单提交处理
  // useEffect(() => {
  //   formSubmitThrottle();
  // }, [initVal]);
  const { children } = props;

  return (
    <div className="selectedMain" style={{ paddingLeft: 24 }}>
      <Form name={props.name} form={form} onBlur={formSubmitThrottle}>
        <Form.Item label="" name="tagList" shouldUpdate initialValue={initVal.tagList}>
          {initVal.tagList?.map((info, i) => (
            <TagInput
              inputInfo={info}
              isAllReadOnly={false}
              changeInputInfo={changeInputInfo}
              addInputInfo={addInputInfo}
              deleteInputInfo={deleteInputInfo}
              inputIndex={i}
              key={info.value}
            />
          ))}

          <Button type="primary" style={{ marginTop: 16, borderRadius: 4 }} onClick={() => addInputInfo()} ghost>
            新建
          </Button>
        </Form.Item>
      </Form>
      {children}
    </div>
  );
};

export default TagConfigForm;
