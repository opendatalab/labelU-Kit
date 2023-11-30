import type { BBox } from 'rbush';
import RBush from 'rbush';

import type { Shape } from '@/shape';
import type { Group } from '@/shape/Group';

export interface RBushItem extends BBox {
  id: string;
  _shape?: Shape<any>;
  _group?: Group<Shape<any>, any>;
  /** 标注顺序，目前只在group当中有这个值 */
  _order?: number;
}

/**
 * 以 R-Tree 为基础的空间索引
 * 使用 rbush，用于吸附和高亮等交互
 *
 * @see https://github.com/mourner/rbush#readme
 */
export const rbush = new RBush<RBushItem>();
