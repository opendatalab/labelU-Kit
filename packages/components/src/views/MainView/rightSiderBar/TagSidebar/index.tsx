import { Checkbox, Radio, Tree } from 'antd';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { cloneDeep, get, isEmpty, omit, set, update } from 'lodash-es';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OneTag } from '@label-u/annotation';
import { TagUtils, uuid } from '@label-u/annotation';
import { dfsEach, objectEach } from '@label-u/utils';
import { connect, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

import type { AppState } from '@/store';
import type { IFileItem } from '@/types/data';
import { ChangeSave, UpdateImgList } from '@/store/annotation/actionCreators';

interface IProps {
  imgIndex: number;
  tagConfigList: OneTag[];
  imgList: IFileItem[];
  isPreview: boolean;
}

interface ITagResult {
  id?: string;
  values: Record<string, string[]>;
}

export const expandIconFuc = ({ isActive }: any) => (
  <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ color: 'rgba(0, 0, 0, 0.36)' }} />
);

const TagSidebar: React.FC<IProps> = ({ imgList, tagConfigList, imgIndex, isPreview }) => {
  const defaultTagInjected = useRef(false);
  const [tagResult, setTagResult] = useState<ITagResult>({
    values: {},
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const clearTag = () => {
    const parentNode = document.getElementById('toolContainer');
    const oldDom = window.self.document.getElementById('tagToolTag');
    if (oldDom && parentNode && parentNode.contains(oldDom)) {
      parentNode?.removeChild(oldDom);
    }
  };

  const renderTag = useCallback(() => {
    clearTag();
    if (isEmpty(tagResult.values)) {
      return;
    }

    // TODO: 此处的dom操作与TagToolOperation中的dom操作重复，需要优化
    const parentNode = document.getElementById('toolContainer');
    const dom = document.createElement('div');
    const tagValuesInString = cloneDeep(tagResult.values);
    objectEach(tagValuesInString, (value, keyPath) => {
      if (Array.isArray(value)) {
        set(tagValuesInString, keyPath, value.join(';'));
      }
    });
    const tagInfoList = TagUtils.getTagNameList(tagValuesInString ?? {}, tagConfigList);

    dom.innerHTML =
      tagInfoList.reduce((acc: string, cur: { keyName: string; value: string[] }) => {
        return `${acc}${cur.keyName}: ${cur.value.join(` 、 `)}\n`;
      }, '') ?? '';

    dom.setAttribute('id', 'tagToolTag');
    dom.setAttribute(
      'style',
      `
        position: absolute;
        top: 0;
        right: 0;
        z-index: 5;
        padding: 0 20px;
        font-size: 15px;
        color: white;
        text-align: right;
        line-height: 32px;
        white-space: pre;
        background: rgba(102, 111, 255, 1);
        opacity: 0.6;
        clear: both;
      `,
    );
    const preTagToolTag = document.getElementById('tagToolTag');
    if (!parentNode?.contains(preTagToolTag)) {
      parentNode?.appendChild(dom);
    }
  }, [tagConfigList, tagResult]);

  useEffect(() => {
    renderTag();
  }, [renderTag, imgList]);

  const syncToStore = useCallback(
    (newTagResult) => {
      // 保存至store
      if (isEmpty(newTagResult)) {
        return;
      }

      const tagsInString = cloneDeep(newTagResult);
      objectEach(tagsInString, (value, keyPath) => {
        if (Array.isArray(value)) {
          set(tagsInString, keyPath, value.join(';'));
        }
      });

      const oldImgResult = JSON.parse(imgList[imgIndex].result as string);
      const currentImgResult = {
        ...oldImgResult,
        tagTool: {
          toolName: 'tagTool',
          result: [
            {
              id: tagResult.id,
              result: tagsInString,
            },
          ],
        },
      };
      imgList[imgIndex].result = JSON.stringify(currentImgResult);
      dispatch(UpdateImgList(imgList));
      dispatch(ChangeSave);
    },
    [dispatch, imgIndex, imgList, tagResult.id],
  );

  const tagValues = useMemo(() => {
    const stateValue: ITagResult = {
      id: uuid(8, 62),
      values: {},
    };

    // 填入默认选中的值
    dfsEach(
      tagConfigList,
      (item, path) => {
        if (item.isDefault) {
          const fieldPath = [];

          const walkedPath = [];
          // 末尾的值不需要设置到 fieldPath 中
          for (let i = 0; i < path.length - 1; i++) {
            walkedPath.push(path[i]);

            if (typeof path[i] === 'number') {
              const configItem = get(tagConfigList, walkedPath);
              fieldPath.push(configItem.value);
            }
          }

          if (get(stateValue.values, fieldPath)) {
            update(stateValue.values, fieldPath, (items) => {
              return [...items, item.value];
            });
          } else {
            set(stateValue.values, fieldPath, [item.value]);
          }
        }
      },
      {
        childrenField: 'options',
      },
    );

    if (!imgList || imgList.length === 0) {
      return stateValue;
    }

    try {
      const currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      const tagResult_ = currentImgResult?.tagTool ? currentImgResult?.tagTool?.result : [];

      if (tagResult_.length === 0) {
        return stateValue;
      }

      const result: Record<string, string[]> = {};
      Object.keys(tagResult_[0].result).forEach((item) => {
        result[item] = tagResult_[0].result[item].split(';');
      });

      stateValue.id = tagResult_[0].id;
      stateValue.values = result;

      return stateValue;
    } catch (err) {
      return stateValue;
    }
  }, [imgIndex, imgList, tagConfigList]);

  useEffect(() => {
    setTagResult(tagValues);

    if (!defaultTagInjected.current) {
      syncToStore(tagValues.values);
      defaultTagInjected.current = true;
    }
  }, [syncToStore, tagValues]);

  useEffect(() => {
    defaultTagInjected.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgList[0].id]);

  const handleOnChange = useCallback(
    (type: 'tuple' | 'enum', path: string[]) => (e: CheckboxChangeEvent) => {
      let newTagResult = cloneDeep(tagResult.values);

      if (type === 'enum') {
        if (get(newTagResult, [...path, 0]) === e.target.value) {
          // @ts-ignore
          newTagResult = omit(newTagResult, [[...path, 0]]);
        } else {
          set(newTagResult, [...path, 0], e.target.value);
        }
      } else {
        const index = get(newTagResult, path, []).indexOf(e.target.value);
        if (index > -1) {
          update(newTagResult, path, (items) => {
            return items.filter((item: any) => item !== e.target.value);
          });

          if (get(newTagResult, path, []).length === 0) {
            // @ts-ignore
            newTagResult = omit(newTagResult, [path]);
          }
        } else {
          update(newTagResult, path, (items = []) => {
            return [...items, e.target.value];
          });
        }
      }

      setTagResult((pre) => ({
        ...pre,
        values: newTagResult,
      }));
      syncToStore(newTagResult);
    },
    [syncToStore, tagResult.values],
  );

  const makeTreeData = useCallback(
    (inputs, optionType: 'enum' | 'tuple' | undefined, path: string[] = []) => {
      return inputs.map((input: any) => {
        const { options, value, key, type } = input;
        if (Array.isArray(options) && options.length > 0) {
          return {
            title: key,
            value,
            key: value,
            children: makeTreeData(options, type, [...path, value]),
          };
        }

        let leaf = key;

        if (optionType === 'enum') {
          leaf = (
            <Radio
              value={value}
              checked={get(tagResult.values, [...path, 0]) === value}
              onChange={handleOnChange('enum', path)}
            >
              {key}
            </Radio>
          );
        } else if (optionType === 'tuple') {
          leaf = (
            <Checkbox
              value={value}
              checked={get(tagResult.values, path, []).includes(value)}
              onChange={handleOnChange('tuple', path)}
            >
              {key}
            </Checkbox>
          );
        }

        return {
          title: leaf,
          value,
          key: value,
        };
      });
    },
    [handleOnChange, tagResult.values],
  );

  const treeData = useMemo(() => {
    return makeTreeData(tagConfigList, undefined, undefined);
  }, [makeTreeData, tagConfigList]);

  return (
    <div
      className={classNames({
        tagOperationMenu: true,
        tagOperationMenuPreview: isPreview,
      })}
      ref={sidebarRef}
    >
      {tagConfigList?.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center' }}>{t('NoConfiguration')}</div>
      ) : (
        <Tree selectable={false} switcherIcon={<CaretDownOutlined />} blockNode defaultExpandAll treeData={treeData} />
      )}
    </div>
  );
};

function mapStateToProps(state: AppState) {
  return {
    imgList: state.annotation.imgList,
    tagConfigList: state.annotation.tagConfigList,
    imgIndex: state.annotation.imgIndex,
  };
}

export default connect(mapStateToProps)(TagSidebar);
