import type { BBox } from 'rbush';
import RBush from 'rbush';

import uid from '@/utils/uid';
import type { AllShape } from '@/shapes/types';

import type { AxisPoint, Shape } from '../shapes';
import { Line, Point, ShapeText } from '../shapes';
import type { Group } from '../shapes/Group';
import { axis, eventEmitter } from '../singletons';
import { EInternalEvent } from '../enums';
import { getDistanceToLine, getLatestPointOnLine, isBBoxIntersect } from '../shapes/math.util';

export interface RBushItem extends BBox {
  id: string;
  _shape?: Shape<any>;
  _group?: Group;
  /** 标注顺序，目前只在group当中有这个值 */
  _order?: number;
}

export class CustomRBush extends RBush<RBushItem> {
  private _nearestPoint: Point | null = null;

  private _mapping: Map<string, RBushItem> = new Map();

  /**
   * 待应用的包围盒更新队列
   *
   * @description
   * 图形坐标高频变化（平移、缩放、拖拽）时不立即更新空间索引，只将 item 入队；
   * 在下一次查询（search/all/collides）前统一应用。
   * 新包围盒在 flush 时才从 item 的宿主（_shape/_group）读取，
   * 因此同一图形在一个查询周期内的多次变更会自动合并为一次索引操作。
   */
  private _pendingUpdates: Set<RBushItem> = new Set();

  constructor() {
    super();

    eventEmitter.on(EInternalEvent.Render, this._onRender);
  }

  public insert(item: RBushItem): RBush<RBushItem> {
    if (this._mapping.has(item.id)) {
      this.remove(item);
    }

    this._mapping.set(item.id, item);

    super.insert(item);

    return this;
  }

  public remove(item: RBushItem, _equals?: ((a: RBushItem, b: RBushItem) => boolean) | undefined): RBush<RBushItem> {
    const { _group, _shape } = item;

    this._mapping.delete(item.id);
    this._pendingUpdates.delete(item);

    if (_group && _shape) {
      _group.remove(_shape as AllShape);
    }

    super.remove(item);

    return this;
  }

  /**
   * 将 item 的包围盒更新排入队列，延迟到下一次查询前统一应用
   *
   * @description 入树期间 item 的包围盒字段必须与树结构保持一致，所以这里不改动 item 本身
   */
  public queueUpdate(item: RBushItem) {
    const existing = this._mapping.get(item.id);

    if (existing && existing !== item) {
      this.remove(existing);
    }

    this._mapping.set(item.id, item);
    this._pendingUpdates.add(item);
  }

  private _flushPendingUpdates() {
    const pending = this._pendingUpdates;

    if (pending.size === 0) {
      return;
    }

    this._pendingUpdates = new Set();

    const applyBBox = (item: RBushItem) => {
      const bbox = item._shape?.bbox ?? item._group?.bbox;

      if (bbox) {
        item.minX = bbox.minX;
        item.minY = bbox.minY;
        item.maxX = bbox.maxX;
        item.maxY = bbox.maxY;
      }
    };

    // 大批量变更（平移/缩放结束后）时整树重建：bulk-load 比逐条 remove/insert 快且树质量更高
    const inTree = pending.size >= 200 ? super.all() : null;

    if (inTree && pending.size * 4 >= inTree.length) {
      const union = new Set(inTree);

      pending.forEach((item) => union.add(item));
      pending.forEach(applyBBox);

      super.clear();
      super.load(Array.from(union));
    } else {
      pending.forEach((item) => {
        // item 未入过树时 remove 是安全的空操作
        super.remove(item);
        applyBBox(item);
        super.insert(item);
      });
    }
  }

  public search(bbox: BBox): RBushItem[] {
    this._flushPendingUpdates();

    return super.search(bbox);
  }

  public collides(bbox: BBox): boolean {
    this._flushPendingUpdates();

    return super.collides(bbox);
  }

  public all(): RBushItem[] {
    this._flushPendingUpdates();

    return super.all();
  }

  public clear(): RBush<RBushItem> {
    // RBush 基类构造函数会调用 clear()，此时子类字段尚未初始化
    this._pendingUpdates?.clear();
    this._mapping?.clear();

    return super.clear();
  }

  private _onRender = () => {
    const { _nearestPoint } = this;

    if (!axis || !axis.renderer) {
      return;
    }

    if (_nearestPoint) {
      // NOTE: rbush是在创建画布前就已创建的一个全局实例，需要在clear画布后再渲染
      Promise.resolve().then(() => {
        _nearestPoint.render(axis!.renderer!.ctx);
      });
    }
  };

  /**
   * 扫描给定坐标点附近的图形元素
   *
   * @param coordinate 坐标点
   * @param threshold 阈值
   */
  public scanCanvasObject(coordinate: AxisPoint, threshold = 0) {
    return this.search({
      minX: coordinate.x - threshold,
      minY: coordinate.y - threshold,
      maxX: coordinate.x + threshold,
      maxY: coordinate.y + threshold,
    });
  }

  /**
   * 判断点是否在画布图形的任一包围盒中（文字除外）
   *
   * @param coordinate 坐标点
   * @returns 是否在包围盒中
   */
  public getRBushItemsByPointInBBox(coordinate: AxisPoint) {
    const rbushItems = this.scanCanvasObject(coordinate, 0);

    return rbushItems.filter((item) => {
      const _bbox = item._group?.getBBoxByFilter((shape) => !(shape instanceof ShapeText));

      if (!_bbox) {
        return false;
      }

      // 创建一个以coordinate为中心的极小bbox来检测点是否在_bbox内
      const pointBBox: BBox = {
        minX: coordinate.x,
        minY: coordinate.y,
        maxX: coordinate.x,
        maxY: coordinate.y,
      };

      return isBBoxIntersect(pointBBox, _bbox);
    });
  }

  /**
   * 扫描多边形并设置最近的点
   *
   * @param dynamicCoordinate 动态坐标
   * @param threshold 阈值
   * @param excludeGroupIds 排除的组id
   * @returns 最近的点
   */
  public scanPolygonsAndSetNearestPoint(
    dynamicCoordinate: AxisPoint,
    threshold: number,
    excludeGroupIds: string[] | undefined = [],
  ) {
    if (threshold === 0) {
      console.warn('threshold is 0');
    }

    if (!threshold) {
      return;
    }

    const { _nearestPoint } = this;

    let nearestPoint;
    const rbushItems = this.scanCanvasObject(dynamicCoordinate, threshold);
    const groups =
      rbushItems
        ?.filter((item) => item._group && !excludeGroupIds.includes(item._group.id))
        .map((item) => item._group) ?? [];

    // 找到距离最近的那条边
    for (const group of groups) {
      if (!group) {
        continue;
      }

      const points = group.shapes[0].dynamicCoordinate;
      const fullPoints = [...points, points[0]];

      for (let i = 1; i < fullPoints.length; i++) {
        const distance = getDistanceToLine(dynamicCoordinate, fullPoints[i - 1], fullPoints[i]);

        if (distance < threshold) {
          nearestPoint = getLatestPointOnLine(dynamicCoordinate, fullPoints[i - 1], fullPoints[i]);
          break;
        }
      }
    }

    // 创建预设点
    if (nearestPoint) {
      const latestPointUnscaled = axis!.getOriginalCoord(nearestPoint);

      if (_nearestPoint) {
        _nearestPoint.coordinate[0].x = latestPointUnscaled.x;
        _nearestPoint.coordinate[0].y = latestPointUnscaled.y;
      } else {
        this._nearestPoint = new Point({
          id: uid(),
          style: { fill: '#fff', radius: 3, strokeWidth: 0, stroke: '#000' },
          coordinate: latestPointUnscaled,
        });
      }
    } else {
      this._nearestPoint?.destroy();
      this._nearestPoint = null;
    }

    return this._nearestPoint?.coordinate[0];
  }

  /**
   * 扫描线段并设置最近的点
   *
   * @param dynamicCoordinate 动态坐标
   * @param threshold 阈值
   * @param excludeGroupIds 排除的组id
   * @returns 最近的点
   */
  public scanLinesAndSetNearestPoint(
    dynamicCoordinate: AxisPoint,
    threshold: number,
    excludeGroupIds: string[] | undefined = [],
  ) {
    if (threshold === 0) {
      console.warn('threshold is 0');
    }

    if (!threshold) {
      return;
    }

    const { _nearestPoint } = this;

    let nearestPoint;
    const rbushItems = this.scanCanvasObject(dynamicCoordinate, threshold);
    const groups =
      rbushItems
        ?.filter((item) => item._group && !excludeGroupIds.includes(item._group.id))
        .map((item) => item._group) ?? [];

    // 找到距离最近的那条边
    for (const group of groups) {
      if (!group) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-loop-func
      group.each((shape) => {
        if (shape instanceof Line) {
          const distance = getDistanceToLine(dynamicCoordinate, shape.dynamicCoordinate[0], shape.dynamicCoordinate[1]);

          if (distance < threshold) {
            nearestPoint = getLatestPointOnLine(
              dynamicCoordinate,
              shape.dynamicCoordinate[0],
              shape.dynamicCoordinate[1],
            );
            return;
          }
        }
      });
    }

    // 创建预设点
    if (nearestPoint) {
      const latestPointUnscaled = axis!.getOriginalCoord(nearestPoint);

      if (_nearestPoint) {
        _nearestPoint.coordinate[0].x = latestPointUnscaled.x;
        _nearestPoint.coordinate[0].y = latestPointUnscaled.y;
      } else {
        this._nearestPoint = new Point({
          id: uid(),
          style: { fill: '#fff', radius: 3, strokeWidth: 0, stroke: '#000' },
          coordinate: latestPointUnscaled,
        });
      }
    } else {
      this._nearestPoint?.destroy();
      this._nearestPoint = null;
    }

    return this._nearestPoint?.coordinate[0];
  }

  public get nearestPoint() {
    return this._nearestPoint;
  }

  public set nearestPoint(value: Point | null) {
    this._nearestPoint = value;
  }

  public destroy() {
    eventEmitter.off(EInternalEvent.Render, this._onRender);
  }
}
