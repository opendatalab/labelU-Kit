import { cloneDeep } from 'lodash-es';

// export const DEFAULT_LINK = '@@';
// const DEFAULT_TOOL_ATTRIBUTE = ['valid', 'invalid'];

/**
 * 添加步骤单元
 * @param inputList 原步骤信息
 * @param isInitSubSelected 是否需要添加 subSelected
 * @param i 是否是 subSelected 进行创建
 * @param specialState // 是否需要创建一个顶层的默认属性
 */
export const addInputList = (
  inputList: any,
  isInitSubSelected: boolean,
  i?: number,
  specialState?: {
    isMulti?: boolean;
    isDefault?: boolean;
    lang: 'cn' | 'en';
  },
) => {
  const newInputList = cloneDeep(inputList);
  // TODO：声明了但是没用到
  // let baseClassName = '类别';
  let baseOptionName = '选项';

  switch (specialState?.lang) {
    case 'en':
      // baseClassName = 'className';
      baseOptionName = 'optionName';
      break;
    default: {
      //
      break;
    }
  }

  if (i !== undefined) {
    if (newInputList[i].subSelected) {
      const len = newInputList[i].subSelected.length + 1;
      newInputList[i].subSelected.push({
        key: `${baseOptionName}${i + 1}-${len}`,
        value: `option${i + 1}-${len}`,
        isDefault: false,
      });
    } else {
      newInputList[i].subSelected = [
        { key: `${baseOptionName}${i + 1}-1`, value: `option${i + 1}-1`, isDefault: false },
      ];
    }
  } else {
    const len = newInputList.length + 1;
    // TODO：声明了但是没用到
    // const id = uuid(2, 62);
    const newData = {
      // key: `${baseClassName}${id}`,
      // value: `class-${id}`
      key: ``,
      value: ``,
    };

    if (specialState?.isMulti === true) {
      Object.assign(newData, { isMulti: true });
    }

    if (specialState?.isDefault === true) {
      Object.assign(newData, { isDefault: true });
    }

    if (isInitSubSelected) {
      Object.assign(newData, {
        subSelected: [{ key: `${baseOptionName}${len}-1`, value: `option${len}-1`, isMulti: true }],
      });
    }
    newInputList.push(newData);
  }

  return newInputList;
};

/**
 * 清除标签的配置中的所有 default 状态
 *
 * @export
 * @param {IInputList[]} inputList
 * @param {number} index
 * @return
 */
export function clearTagDefault(inputList: any[], index: number) {
  const newInputList = cloneDeep(inputList);

  if (!newInputList[index]?.subSelected) {
    return newInputList;
  }

  newInputList[index].subSelected = newInputList[index].subSelected?.map((v: any) => ({
    ...v,
    isDefault: false,
  }));

  return newInputList;
}

// 更改标签工具里面的对应值
export const changeInputList = (
  e: any,
  target: 'key' | 'value' | 'isMulti' | 'isDefault',
  inputList: any[],
  index: number,
  subIndex?: number,
) => {
  let newInputList = cloneDeep(inputList);

  switch (target) {
    case 'key':
      if (subIndex !== undefined && newInputList[index].subSelected) {
        newInputList[index].subSelected[subIndex].key = e.target.value;
      } else {
        newInputList[index].key = e.target.value;
      }
      break;

    case 'value':
      if (subIndex !== undefined && newInputList[index].subSelected) {
        newInputList[index].subSelected[subIndex].value = e.target.value;
      } else {
        newInputList[index].value = e.target.value;
      }
      break;

    case 'isMulti': {
      const isMulti = !newInputList[index].isMulti;
      newInputList[index].isMulti = isMulti;

      // 初始化所有 subSelected 的值
      if (isMulti === false) {
        newInputList = clearTagDefault(newInputList, index);
      }
      break;
    }

    case 'isDefault':
      if (subIndex !== undefined && newInputList[index].subSelected) {
        const isDefault = !newInputList[index].subSelected[subIndex].isDefault;

        if (isDefault === true && newInputList[index].isMulti !== true) {
          // 仅为一个 isDefault
          newInputList = clearTagDefault(newInputList, index);
        }

        newInputList[index].subSelected[subIndex].isDefault = isDefault;
      } else {
        const newIsDefault = !newInputList[index].isDefault;

        // 顶层更新数据更新
        newInputList = newInputList.map((v) => ({ ...v, isDefault: false }));
        newInputList[index].isDefault = newIsDefault;
      }
      break;
  }
  return newInputList;
};

// 删除对应输入
export const deleteInputList = (inputList: any[], i: number, subIndex?: number) => {
  let newInputList = cloneDeep(inputList);
  if (subIndex !== undefined) {
    if (newInputList[i].subSelected.length <= 1) {
      return newInputList;
    }

    newInputList[i].subSelected = [
      ...newInputList[i].subSelected.slice(0, subIndex),
      ...newInputList[i].subSelected.slice(subIndex + 1, newInputList[i].subSelected.length),
    ];
  } else {
    newInputList = [...newInputList.slice(0, i), ...newInputList.slice(i + 1, newInputList.length)];
  }
  return newInputList;
};

/**
 * 判断是否含有 key value 两个属性
 *
 * @param {Object} object
 * @returns
 */
export function isHasKeyValue(object: any) {
  if (typeof object?.key === 'string' && typeof object?.value === 'string') {
    return object?.key && object?.value;
  }

  return false;
}

/**
 * 判断是否符合标签工具的配置 IInputList
 * @param config
 */
export function judgeIsTagConfig(inputList: any) {
  if (Array.isArray(inputList)) {
    let formatNum = 0;
    for (const info of inputList) {
      if (isHasKeyValue(info)) {
        if (info?.subSelected) {
          if (Array.isArray(info?.subSelected)) {
            let num = 0;
            for (const d of info.subSelected) {
              if (isHasKeyValue(d)) {
                num++;
              }
            }

            if (num === info.subSelected.length) {
              formatNum++;
            }
          }
        }
      }
    }

    return formatNum === inputList.length;
  }
  return false;
}
