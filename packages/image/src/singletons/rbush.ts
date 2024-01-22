import { CustomRBush } from '../core/CustomRBush';

/**
 * 以 R-Tree 为基础的空间索引
 * 使用 rbush，用于吸附和高亮等交互
 *
 * @see https://github.com/mourner/rbush#readme
 */
export const rbush = new CustomRBush();
