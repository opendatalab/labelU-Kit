import axiosProxy from './axiosProxy';
import commonController from '../utils/common/common';
import { generateAttributeMapFromConfig } from '../utils/generateAttributeMapFromConfig';
import _ from 'lodash';
import { jsonParse } from '../utils';
const { axiosInstance } = axiosProxy;

/**
 * 将result中的label由attribute中的key转换为value
 * 修正
 * - https://project.feishu.cn/bigdata_03/issue/detail/3786802?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
 * - https://project.feishu.cn/bigdata_03/issue/detail/3572846?parentUrl=%2Fbigdata_03%2FissueView%2FXARIG5p4g
 */
function changeKeyToValue(data: any, attributeMap: ReturnType<typeof generateAttributeMapFromConfig>) {
  const newData = _.cloneDeep(data);

  for (const dataItem of newData) {
    if (!dataItem.result) {
      continue;
    }

    const result = jsonParse(dataItem.result);

    result.annotations = (_.chain(result).get('annotations') as any)
      .map((annotation: any) => {
        return {
          ...annotation,
          result: _.map(annotation?.result, (resultItem) => {
            return {
              ...resultItem,
              label: attributeMap.get(resultItem.label),
            };
          }),
        };
      })
      .value();

    dataItem.result = JSON.stringify(result);
  }

  return newData;
}

const createSamples = async function (taskId: number, data: any) {
  // try {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples`,
    method: 'POST',
    data,
  });
  return res;
  // }catch (e) {
  //     CommonController.notificationErrorMessage(e, 5);
  // }
};

const getTask = async function (taskId: number) {
  if (taskId === 0) {
    return {};
  }
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}`,
    method: 'GET',
    params: {
      task_id: taskId,
    },
  });
  return res;
};

const getSamples = async function (taskId: number, params: any) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples`,
    method: 'GET',
    params,
  });
  return res;
};

const getPrevSamples = async function (taskId: number, params: any) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples`,
    method: 'GET',
    params,
  });
  return res;
};

const getSample = async function (taskId: number, sampleId: number) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples/${sampleId}`,
    method: 'GET',
  });
  return res;
};

const updateSampleState = async function (taskId: number, sampleId: number, data: any, state?: string) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples/${sampleId}`,
    method: 'PATCH',
    params: {
      sample_id: sampleId,
    },
    data: {
      state: state,
      data,
    },
  });
  return res;
};

const updateSampleAnnotationResult = async function (taskId: number, sampleId: number, data: any) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples/${sampleId}`,
    method: 'PATCH',
    params: {
      sample_id: sampleId,
    },
    data: {
      data: data.data,
      state: data.state,
      annotated_count: data.annotated_count,
      // state : data.state
    },
  });
  return res;
};
const outputSample = async function (taskId: number, sampleIds: any, activeTxt: string) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples/export`,
    method: 'POST',
    params: {
      task_id: taskId,
      export_type: activeTxt,
    },
    data: {
      sample_ids: sampleIds,
    },
  });
  if (activeTxt === 'MASK') {
    res = await axiosInstance({
      url: `/api/v1/tasks/${taskId}/samples/export`,
      method: 'POST',
      params: {
        task_id: taskId,
        export_type: activeTxt,
      },
      data: {
        sample_ids: sampleIds,
      },
      responseType: 'blob',
    });
  }
  let data = res;
  // @ts-ignore
  // res.blob().then(blob=>console.log(blob));
  // res.blob().then(blob => {
  // let afString = res.headers['content-disposition'].split(';')[1].split('=')[1];
  // afString = afString.slice(1,-1);
  // let blobUrl = 'blob:'+window.location.origin + '/'+ afString;
  let taskRes: any = await getTask(taskId);
  // 导出结果中需要将key换成value导出
  const attributeMap = generateAttributeMapFromConfig(taskRes.data.data.config);
  const dataWithAttributeValue = changeKeyToValue(data.data, attributeMap);
  let blobData = new Blob([JSON.stringify(dataWithAttributeValue)]);
  let url = window.URL.createObjectURL(blobData);
  const a = document.createElement('a');
  let filename = taskRes.data.data.name;
  switch (activeTxt) {
    case 'JSON':
      filename = filename + '.json';
      break;
    case 'COCO':
      filename = filename + '.json';
      break;
    case 'MASK':
      // @ts-ignore
      blobData = new Blob([data.data], { type: 'application/zip' });
      filename = filename + '.zip';
      url = window.URL.createObjectURL(blobData);
      break;
  }
  a.download = filename;
  a.href = url;
  a.click();

  // @ts-ignore
  // window.saveAs(blobData, 'dataTimestamp' + ".json");
  //     // const url = window.URL.createObjectURL(blobUrl);
  //     a.href = url;
  //     a.download = 'filename';
  //     a.click();
  // window.URL.revokeObjectURL(blobUrl);
  // })
  // commonController.downloadToFile(data, activeTxt);
  // return res;
};

const outputSamples = async function (taskId: number, activeTxt: string) {
  try {
    let samplesRes = await getSamples(taskId, { pageNo: 0, pageSize: 100000 });
    let sampleIdArrays = samplesRes.data.data;
    let sampleIds = [];
    for (let sample of sampleIdArrays) {
      sampleIds.push(sample['id']);
    }
    if (sampleIds.length === 0) {
      commonController.notificationErrorMessage({ message: '后端返回数据出现问题' }, 1);
      return;
    }
    let outputSamplesRes = await outputSample(taskId, sampleIds, activeTxt);
    console.log(outputSamplesRes);
    return true;
  } catch (error) {
    commonController.notificationErrorMessage({ message: error }, 1);
    return false;
  }
};

const deleteSamples = async function (taskId: number, sampleIds: number[]) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples`,
    method: 'DELETE',
    data: {
      sample_ids: sampleIds,
    },
  });
  return res;
};

const getPreSample = async function (taskId: number, sampleId: number) {
  let res = await axiosInstance({
    url: `/api/v1/tasks/${taskId}/samples/${sampleId}/pre`,
    method: 'GET',
  });
  return res;
};

export {
  createSamples,
  getTask,
  getSamples,
  getSample,
  getPrevSamples,
  updateSampleState,
  updateSampleAnnotationResult,
  outputSample,
  outputSamples,
  deleteSamples,
  getPreSample,
};
