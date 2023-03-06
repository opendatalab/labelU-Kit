import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Button, Form } from 'antd';
import { useForm } from 'antd/es/form/Form';
import type { OneTag } from '@label-u/annotation';

import scrollIntoEventTarget from '@/utils/scrollIntoEventTarget';
import { addInputList, changeInputList, deleteInputList } from '@/utils/tool/editTool';

import TagInput from '../../components/TagInput';

export interface AttributeItem {
  key: string;
  value: string;
}
interface FormTagConfig {
  tagList: OneTag[];
}

const TagConfigForm: FC<FormTagConfig & { name: string }> = (props) => {
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
            isDefault: true,
          },
          {
            key: '选项2-2',
            value: 'option2-2',
            isDefault: false,
          },
        ],
      },
    ],
  } as FormTagConfig);

  useMemo(() => {
    if (props) {
      const initV = {
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
                      isDefault: true,
                    },
                    {
                      key: '选项2-2',
                      value: 'option2-2',
                      isDefault: false,
                    },
                  ],
                },
              ],
      };
      setInitVal(initV);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-ignore
  const formSubmitThrottle = window.throttle(() => {
    form.submit();
  }, 1);

  // 更改标签工具里面的对应值
  const changeInputInfo = (
    e: any,
    target: 'key' | 'value' | 'isMulti' | 'isDefault',
    index: number,
    subIndex?: number,
  ) => {
    // 这个是什么情况才有 ？
    if (e?.target?.value?.indexOf('@') > -1 && !['isMulti', 'isDefault'].includes(target)) {
      return;
    }
    const tagList = form?.getFieldValue('tagList');
    const newTagList = changeInputList(e, target, tagList, index, subIndex);
    form?.setFieldsValue({ tagList: newTagList });
    setInitVal({
      tagList: newTagList,
    });
  };
  // add inputList
  const addInputInfo = (i: number | undefined, e: React.MouseEvent) => {
    const tagList = form?.getFieldValue('tagList');
    form?.setFieldsValue({
      tagList: addInputList(tagList, EDIT_SUBSELECTED, i, {
        isMulti: true,
        lang: 'cn',
      }),
    });
    setInitVal({
      tagList: addInputList(tagList, EDIT_SUBSELECTED, i, {
        isMulti: true,
        lang: 'cn',
      }),
    });
    formSubmitThrottle();
    // fix: https://project.feishu.cn/bigdata_03/issue/detail/3528090?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
    scrollIntoEventTarget(e, 'button', '#lefeSiderId');
  };
  // 删除对应输入
  const deleteInputInfo = (i: number, subIndex?: number) => {
    const tagList = form?.getFieldValue('tagList');

    const newTagList = deleteInputList(tagList, i, subIndex);
    form?.setFieldsValue({ tagList: newTagList });
    setInitVal({
      tagList: newTagList,
    });
    formSubmitThrottle();
  };

  const { children } = props;

  return (
    <div className="selectedMain" style={{ paddingLeft: 24 }}>
      <Form name={props.name} form={form} onBlur={formSubmitThrottle}>
        <Form.Item label="" name="tagList" shouldUpdate initialValue={initVal.tagList}>
          {initVal.tagList?.map((info, i) => (
            <TagInput
              key={i}
              inputInfo={info}
              isAllReadOnly={false}
              changeInputInfo={changeInputInfo}
              addInputInfo={addInputInfo}
              deleteInputInfo={deleteInputInfo}
              inputIndex={i}
              // key={info.value}
            />
          ))}

          <Button
            type="primary"
            style={{ marginTop: 16, borderRadius: 4 }}
            onClick={(e) => addInputInfo(undefined, e)}
            ghost
          >
            新建
          </Button>
        </Form.Item>
      </Form>
      {children}
    </div>
  );
};

export default TagConfigForm;
