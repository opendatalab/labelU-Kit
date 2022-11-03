import img1 from './images/10.jpg';
import img2 from './images/19.jpg';
import img3 from './images/20.jpg';
import img4 from './images/66.jpg';

// const MOCK_URL = 'http://bee-sdk-demo.sensebee.xyz/images/';
// export const fileList = ['10', '19', '20', '66'].map((i) => `${MOCK_URL}${i}.jpg`);
export const fileList = [img1, img2, img3, img4];
// export const fileList = ['https://images.unsplash.com/photo-1653122952207-f20ba3c64f35?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80']
export const videoList = [
  'https://pjlab-label-data.oss-cn-shanghai.aliyuncs.com/test4/obj/2ffdfe12-b10b-4d9b-a036-0a7b323f84b8.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI5tSmKP8Yi6KfdRCy6omN%2F20220817%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220817T062222Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=2eddbd9b33705efda600c94e199700b101f4a46ee08fa61f62006b61f30c18fd',
  'https://pjlab-label-data.oss-cn-shanghai.aliyuncs.com/test4/obj/2ffdfe12-b10b-4d9b-a036-0a7b323f84b8.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI5tSmKP8Yi6KfdRCy6omN%2F20220817%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220817T062222Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=2eddbd9b33705efda600c94e199700b101f4a46ee08fa61f62006b61f30c18fd',
  'https://pjlab-label-data.oss-cn-shanghai.aliyuncs.com/test4/obj/2ffdfe12-b10b-4d9b-a036-0a7b323f84b8.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI5tSmKP8Yi6KfdRCy6omN%2F20220817%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220817T062222Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=2eddbd9b33705efda600c94e199700b101f4a46ee08fa61f62006b61f30c18fd',
  'https://pjlab-label-data.oss-cn-shanghai.aliyuncs.com/test4/obj/2ffdfe12-b10b-4d9b-a036-0a7b323f84b8.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI5tSmKP8Yi6KfdRCy6omN%2F20220817%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220817T062222Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=2eddbd9b33705efda600c94e199700b101f4a46ee08fa61f62006b61f30c18fd'
];

const data = Array(5)
  .fill('')
  .map((v, i) => ({
    id: i + 1,
    sourceID: '',
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    width: 100,
    height: 50,
    order: i + 1,
    attribute: '',
    valid: true
  }));

const polygonData = [];
// Array(1)
//   .fill('')
//   .map((v, i) => ({
//     id: i + 1,
//     sourceID: '',
//     pointList: Array(1000)
//       .fill('')
//       .map((_) => ({
//         x: Math.random() * 300,
//         y: Math.random() * 400,
//       })),
//     order: i + 1,
//     attribute: '',
//     valid: true,
//   }));

export const rectDefaultResult = JSON.stringify({
  height: 200,
  width: 100,
  rotate: 0,
  rectTool: {
    dataSourceStep: 0,
    toolName: 'rectTool',
    result: []
  }
});

export const polygonDefaultResult = JSON.stringify({
  height: 200,
  width: 100,
  rotate: 0,
  polygonTool: {
    dataSourceStep: 0,
    toolName: 'polygonTool',
    result: []
  }
});

export const tagDefaultResult = JSON.stringify({
  height: 200,
  width: 100,
  rotate: 0,
  tagTool: {
    dataSourceStep: 0,
    toolName: 'tagTool',
    result: []
  }
});

export const videoTagDefaultResult = JSON.stringify({
  videoTagTool: {
    dataSourceStep: 0,
    toolName: 'videoTagTool',
    result: []
  }
});

export const getMockResult = tool => {
  if (tool === 'rectTool') {
    return rectDefaultResult;
  }
  if (tool === 'tagTool') {
    return tagDefaultResult;
  }

  if (tool === 'polygonTool') {
    return polygonDefaultResult;
  }

  if (tool === 'videoTagTool') {
    return videoTagDefaultResult;
  }

  return '';
};

export const mockFileList = [
  {
    id: 1,
    url: 'http://bee-sdk-demo.sensebee.xyz/images/10.jpg',
    result:
      '{"width":720,"height":1280,"valid":true,"rotate":0,"step_1":{"dataSourceStep":0,"toolName":"rectTool","result":[{"x":272.47863247863245,"y":397.4928774928775,"width":288.0911680911681,"height":346.4387464387464,"attribute":"","valid":true,"id":"AwL2kecs","sourceID":"","textAttribute":"","order":1}]}}'
  },
  {
    id: 2,
    url: 'http://bee-sdk-demo.sensebee.xyz/images/19.jpg',
    result:
      '{"width":720,"height":1280,"valid":true,"rotate":0,"step_1":{"dataSourceStep":0,"toolName":"rectTool","result":[{"x":137.54985754985753,"y":262.56410256410254,"width":492.30769230769226,"height":525.1282051282051,"attribute":"","valid":true,"id":"iCXb9Lat","sourceID":"","textAttribute":"","order":1},{"x":133.9031339031339,"y":627.2364672364672,"width":357.3789173789174,"height":353.7321937321937,"attribute":"","valid":true,"id":"siLd255B","sourceID":"","textAttribute":"","order":2},{"x":640.7977207977208,"y":1061.196581196581,"width":79.2022792022792,"height":200.56980056980055,"attribute":"","valid":true,"id":"udXxQJou","sourceID":"","textAttribute":"","order":3}]}}'
  },
  {
    id: 3,
    url: 'http://bee-sdk-demo.sensebee.xyz/images/20.jpg',
    result:
      '{"width":720,"height":1280,"valid":true,"rotate":0,"step_1":{"dataSourceStep":0,"toolName":"rectTool","result":[{"x":144.84330484330485,"y":506.8945868945869,"width":324.55840455840456,"height":368.3190883190883,"attribute":"","valid":true,"id":"NFN0vzGW","sourceID":"","textAttribute":"","order":1},{"x":301.65242165242165,"y":328.2051282051282,"width":350.0854700854701,"height":386.5527065527065,"attribute":"","valid":true,"id":"t91AA81j","sourceID":"","textAttribute":"","order":2}]}}'
  },
  {
    id: 4,
    url: 'http://bee-sdk-demo.sensebee.xyz/images/66.jpg',
    result:
      '{"width":720,"height":1280,"valid":true,"rotate":0,"step_1":{"dataSourceStep":0,"toolName":"rectTool","result":[]}}'
  }
];

export const cloudMockFileList = [
  {
    mappingImgList: [
      {
        url: 'http://localhost:3000/cloudpoint/1565685654060904.jpg',
        calib: {
          P: [
            [664.2713623046875, 0, 966.8039735557395, 0],
            [0, 673.2572021484375, 557.292600044435, 0],
            [0, 0, 1, 0]
          ],
          R: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
          ],
          T: [
            [-0.99986, 0.0138869, -0.009277, -0.18942],
            [0.00942274, 0.0105122, -0.9999, -0.0724215],
            [-0.0137894, -0.999848, -0.0106419, 0.420832]
          ]
        }
      },
      {
        url: 'http://10.152.32.16:8080/image_undistort/center_camera_fov30/2022-02-20-12-21-03-100.png',
        calib: {
          P: [
            [4454.6, 0, 954.3, 0],
            [0, 4459, 616.6, 0],
            [0, 0, 1, 0]
          ],
          R: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
          ],
          T: [
            [-0.999925, -0.000707111, -0.0122273, 0.0962923],
            [0.0122155, 0.0140593, -0.999826, -0.0991715],
            [0.000877471, -0.9999, -0.0140499, 1.48935]
          ]
        }
      },
      {
        url: 'http://10.152.32.16:8080/image_undistort/left_front_camera/2022-02-20-12-21-03-100.png',
        calib: {
          P: [
            [1231.7, 0, 964.3, 0],
            [0, 1234.6, 572.7, 0],
            [0, 0, 1, 0]
          ],
          R: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
          ],
          T: [
            [-0.604101, -0.796899, 0.00388006, -0.821921],
            [-0.0384692, 0.024299, -0.998964, -1.0657],
            [0.795979, -0.603624, -0.0453359, -1.45241]
          ]
        }
      },
      {
        url: 'http://10.152.32.16:8080/image_undistort/left_rear_camera/2022-02-20-12-21-03-100.png',
        calib: {
          P: [
            [1255.3, 0, 952.9, 0],
            [0, 1257.3, 539.3, 0],
            [0, 0, 1, 0]
          ],
          R: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
          ],
          T: [
            [0.568373, -0.822005, -0.0354856, -1.73776],
            [-0.0376153, 0.0171236, -0.999146, -1.39336],
            [0.82191, 0.569223, -0.0211873, 0.583955]
          ]
        }
      },
      {
        url: 'http://10.152.32.16:8080/image_undistort/rear_camera/2022-02-20-12-21-03-100.png',
        calib: {
          P: [
            [2109.75, 0, 984.6, 0],
            [0, 2365.9, 631.1, 0],
            [0, 0, 1, 0]
          ],
          R: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
          ],
          T: [
            [0.999947, -0.00513728, -0.00884364, -0.0994936],
            [-0.00885675, -0.00250621, -0.999958, -0.388493],
            [0.00511496, 0.999983, -0.00255124, 0.346432]
          ]
        }
      }
    ],
    id: 1,
    url: 'http://localhost:3000/cloudpoint/1565685654060904.pcd',
    result: '{}'
  }
];

export const DEFAULT_ANNOTATIONS = [
  {
    type: 'rect',
    annotation: {
      id: '123123',
      x: 123,
      y: 23,
      width: 100,
      height: 100,
      stroke: 'pink',
      // thickness: 10,
      label: 'laoluo',
      attribute: 'asdasd',
      order: 1
      // hiddenText: true
    }
  },
  {
    type: 'polygon',
    annotation: {
      id: '3',
      // thickness: 10,
      stroke: 'green',
      lineType: 1,
      pointList: [
        {
          x: 12,
          y: 123
        },
        {
          x: 122,
          y: 123
        },
        {
          x: 2,
          y: 3
        }
      ]
    }
  },
  {
    type: 'line',
    annotation: {
      stroke: 'yellow',
      thickness: 5,
      id: '4',
      pointList: [
        {
          x: 123,
          y: 12
        },
        {
          x: 2,
          y: 12
        },
        {
          x: 34,
          y: 132
        }
      ]
    }
  },
  {
    type: 'point',
    annotation: {
      id: '5',
      x: 10,
      y: 10,
      fill: 'green',
      stroke: 'blue',
      thickness: '20',
      radius: 10
    }
  },
  {
    type: 'rect',
    annotation: {
      id: '10',
      x: 13,
      y: 3,
      width: 1020,
      height: 100
    }
  },
  {
    type: 'text',
    annotation: {
      position: 'rt',
      id: '11',
      x: 223,
      y: 23,
      textMaxWidth: 416,
      color: 'yellow',
      text: '标签1: 测试1LoooooooooooooooooooooooooooooooooogLoooooooooooooooooooooooooooooooooogLoooooooooooooooooooooooooooooooooogLoooooooooooooooooooooooooooooooooogLoooooooooooooooooooooooooooooooooog\n标签2: 测试2sdasdas\n\n\n标签1: 测试1asdasdasd\n标签2: 测试2标签1: 测试1\n标签2: 测试2sdasdas\n标签1: 测试1asdasdasd\n标签2: 测试2标签1: 测试1\n标签2: 测试2sdasdas\n标签1: 测试1asdasdasd\n标签2: 测试2标签1: 测试1\n标签2: 测试2sdasdas\n标签1: 测试1asdasdasd\n标签2: 测试2标签1: 测试1\n标签2: 测试2sdasdas\n标签1: 测试1asdasdasd\n标签2: 测试2标签1: 测试1\n标签2: 测试2sdasdas\n标签1: 测试1asdasdasd\n标签2: 测试2'
    }
  },
  {
    type: 'text',
    annotation: {
      id: '12',
      x: 12,
      y: 123,
      textMaxWidth: 500,
      lineHeight: 25,
      text: 'Key: Loooooooooooooooooooooooooooooooooog value\nSecond One: short value'
    }
  },
  {
    type: 'rect',
    annotation: {
      id: '1231999923999',
      x: 60,
      y: 260,
      width: 100,
      height: 100,
      stroke: 'pink',
      name: 'Bag',
      renderEnhance: params => {
        console.log(params);
        const {
          ctx,
          data: { annotation },
          zoom,
          currentPos
        } = params;

        ctx.fillStyle = annotation.stroke;

        ctx.fillRect(
          annotation.x * zoom + currentPos.x - 2,
          annotation.y * zoom + currentPos.y - 20 * zoom,
          40 * zoom,
          20 * zoom
        );
        ctx.strokeStyle = 'white';
        ctx.strokeText(
          annotation.name,
          annotation.x * zoom + currentPos.x + 6 * zoom,
          annotation.y * zoom + currentPos.y - 7 * zoom
        );
      }
    }
  }
];
