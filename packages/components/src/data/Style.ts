export const COLORS_ARRAY = [
  // 'rgba(27, 103, 255, 1)', // 6
  // 'rgba(255, 136, 0, 1)', // 3
  // 'rgba(245, 72, 59, 1)', // 7
  // 'rgba(109, 200, 236, 1)', // 2
  // 'rgba(153, 148, 255, 1)', // 8
  // 'rgba(246, 189, 22, 1)', // 5
  // 'rgba(238, 150, 163, 1)', // 1
  // 'rgba(0, 255, 234, 1)', // 4
  'rgba(153, 51, 255, 1)',
  'rgba(51, 254, 51, 1)',
  'rgba(255, 51, 255, 1)',
  'rgba(204, 255, 51, 1)',
  'rgba(51, 153, 255, 1)',
  'rgba(255, 153, 51, 1)',
  'rgba(51, 255, 238, 1)',
  'rgba(255, 221, 51, 1)',
];

export const COLORS_ARRAY_LIGHT = [
  'rgba(153, 51, 255, 0.1)',
  'rgba(51, 254, 51, 0.1)',
  'rgba(255, 51, 255, 0.1)',
  'rgba(204, 255, 51, 0.1)',
  'rgba(51, 153, 255, 0.1)',
  'rgba(255, 153, 51, 0.1)',
  'rgba(51, 255, 238, 0.1)',
  'rgba(255, 221, 51, 0.1)',
];

export const NULL_COLOR = 'rgba(204, 204, 204, 1)';

export const DEFAULT_COLOR = {
  valid: {
    stroke: 'rgba(102, 111, 255, 0.6)',
    fill: 'rgba(102, 111, 255, 0.3)',
  },
  invalid: {
    stroke: 'rgba(255, 153, 102,1)',
    fill: 'rgba(255, 153, 102, 0.5)',
  },
  validSelected: {
    stroke: 'rgba(0, 15, 255, 0.8)',
    fill: 'rgba(0, 15, 255, 0.4)',
  },
  invalidSelected: {
    stroke: 'rgba(255,153,102,0.8)',
    fill: 'rgba(255,153,102,0.3)',
  },
  validHover: {
    stroke: 'rgba(0, 15, 255, 1)',
    fill: 'rgba(0, 15, 255, 0.5)',
  },

  invalidHover: {
    stroke: 'rgba(255,153,102,1)',
    fill: 'rgba(255,153,102,0.5)',
  },
};

export const CHANGE_COLOR: Record<number, any> = {
  1: {
    valid: 'rgba(0, 0, 255, 0.5)',
    select: {
      stroke: 'rgba(0, 15, 255, 1)',
      fill: 'rgba(0,15,255, 1)',
    },
    hover: 'rgba(0, 15, 255, 0.8)',
    line: 'rgba(102, 111, 255, 1 )',
  },
  3: {
    valid: 'rgba(0, 255, 255, 0.5)',
    select: {
      stroke: 'rgba(0, 212, 255,  1)',
      fill: 'rgba(0,212,255, 1)',
    },
    hover: 'rgba(0, 212, 255, 0.8)',
    line: 'rgba(102, 230, 255, 1)',
  },
  5: {
    valid: 'rgba(0, 255, 0, 0.5)',
    select: {
      stroke: 'rgba(149, 255, 1)',
      fill: 'rgba(149,255,0, 1)',
    },
    hover: 'rgba(149, 255, 0, 0.8)',
    line: 'rgba(191, 255, 102, 1)',
  },
  7: {
    valid: 'rgba(255, 255, 0, 0.5)',
    select: {
      stroke: 'rgba(255, 230, 102, 1)',
      fill: 'rgba(255,213,0, 1)',
    },
    hover: 'rgba(255, 230, 102, 0.8)',
    line: 'rgba(255, 230, 102, 1)',
  },
  9: {
    valid: 'rgba(255, 0, 255, 0.5)',
    select: {
      stroke: 'rgba(230, 102, 255, 1)',
      fill: 'rgba(213,0,255, 1)',
    },
    hover: 'rgba(230, 102, 255, 0.8)',
    line: 'rgba(230, 102, 255, 1)',
  },
};

export const BORDER_OPACITY_LEVEL: Record<number, number> = {
  1: 0.2,
  3: 0.4,
  5: 0.6,
  7: 0.8,
  9: 1.0,
};

export const FILL_OPACITY_LEVEL: Record<number, number> = {
  1: 0,
  3: 0.2,
  5: 0.4,
  7: 0.6,
  9: 0.8,
};
