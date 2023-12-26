// 控制点与控制边、其他控制点、连接线的坐标的影响关系
export const controllerBoundRelation = {
  'front-tr': {
    edge: [
      {
        name: 'front-top',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'front-right',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-bottom',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-left',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-tl',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-br',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
  },
  'front-tl': {
    edge: [
      {
        name: 'front-top',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-left',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'front-bottom',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-right',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-bl',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-tr',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'bl',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
  },
  'front-bl': {
    edge: [
      {
        name: 'front-bottom',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'front-left',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-top',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-right',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-br',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-tl',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'bl',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
  },
  'front-br': {
    edge: [
      {
        name: 'front-bottom',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-right',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'front-top',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-left',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-bl',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-tr',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'bl',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
  },
};

export const controllerSyncBackRelation = {
  'front-tr': {
    edge: [
      {
        name: 'back-top',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-right',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-bottom',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-left',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'back-tr',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-tl',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'back-br',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
    ],
  },
  'front-tl': {
    edge: [
      {
        name: 'back-top',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'back-left',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-bottom',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-right',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'back-tl',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-bl',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-tr',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'bl',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
    ],
  },
  'front-bl': {
    edge: [
      {
        name: 'back-bottom',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-left',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-top',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-right',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'back-bl',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-br',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'back-tl',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'bl',
        coordinates: [
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
    ],
  },
  'front-br': {
    edge: [
      {
        name: 'back-bottom',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'back-right',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-top',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'back-left',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'back-br',
        coordinates: [
          {
            index: 0,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'back-bl',
        coordinates: [
          {
            index: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'back-tr',
        coordinates: [
          {
            index: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'bl',
        coordinates: [
          {
            index: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 1,
            fields: ['x', 'y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 1,
            fields: ['x'],
          },
        ],
      },
    ],
  },
};

export const edgeBoundRelation = {
  'front-top': {
    edge: [
      {
        name: 'front-left',
        coordinates: [
          {
            index: 1,
            edgeCoordIndex: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-right',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-tl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-tr',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'tr',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['y'],
          },
        ],
      },
    ],
  },
  'front-right': {
    edge: [
      {
        name: 'front-top',
        coordinates: [
          {
            index: 1,
            edgeCoordIndex: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-bottom',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-tr',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-br',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tr',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
    ],
  },
  'front-bottom': {
    edge: [
      {
        name: 'front-right',
        coordinates: [
          {
            index: 1,
            edgeCoordIndex: 0,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-left',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['y'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-bl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'front-br',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['y'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'bl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['y'],
          },
        ],
      },
      {
        name: 'br',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['y'],
          },
        ],
      },
    ],
  },
  'front-left': {
    edge: [
      {
        name: 'front-top',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-bottom',
        coordinates: [
          {
            index: 1,
            edgeCoordIndex: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    controller: [
      {
        name: 'front-tl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'front-bl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['x'],
          },
        ],
      },
    ],
    line: [
      {
        name: 'tl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 1,
            fields: ['x'],
          },
        ],
      },
      {
        name: 'bl',
        coordinates: [
          {
            index: 0,
            edgeCoordIndex: 0,
            fields: ['x'],
          },
        ],
      },
    ],
  },
};
