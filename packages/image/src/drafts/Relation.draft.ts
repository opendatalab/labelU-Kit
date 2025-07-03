import cloneDeep from 'lodash.clonedeep';

import uid from '@/utils/uid';
import { VALID_RELATION_TOOLS } from '@/constant';

import type { LineStyle } from '../shapes/Line.shape';
import { Line } from '../shapes/Line.shape';
import { AnnotationRelation, type RelationData } from '../annotations';
import type { PointStyle, AxisPoint } from '../shapes';
import { ShapeText } from '../shapes';
import { axis, rbush } from '../singletons';
import type { AnnotationParams } from '../annotations/Annotation';
import { Annotation } from '../annotations/Annotation';
import { ControllerPoint } from './ControllerPoint';
import { Draft } from './Draft';

export interface RelationDraftParams extends AnnotationParams<RelationData, LineStyle> {
  getAnnotation: (id: string) => Annotation<any, any> | undefined;
  isDuplicatedRelation: (sourceId: string, targetId: string) => boolean;
}

export class DraftRelation extends Draft<RelationData, LineStyle | PointStyle> {
  private _isDuplicatedRelation: (sourceId: string, targetId: string) => boolean;

  private _getAnnotation: (id: string) => Annotation<any, any> | undefined;

  private _effectedLines: [Line | undefined, Line | undefined] | null = null;

  private _tempPoint: (AxisPoint & { annotationId: string }) | null = null;

  constructor(options: RelationDraftParams) {
    const { isDuplicatedRelation, getAnnotation, ...params } = options;
    super({
      ...params,
      name: 'relation',
      labelColor: AnnotationRelation.labelStatic.getLabelColor(params.data.label),
      movable: false,
    });

    this._isDuplicatedRelation = isDuplicatedRelation;
    this._getAnnotation = getAnnotation;
    this._setupShapes();
    this.finishSetup();
  }

  /**
   * 设置图形
   */
  private _setupShapes() {
    const { data, group, style, strokeColor } = this;

    const sourceAnnotation = this._getAnnotation(data.sourceId);
    const targetAnnotation = this._getAnnotation(data.targetId);
    const sourceCenter = sourceAnnotation?.getCenter();
    const targetCenter = targetAnnotation?.getCenter();

    if (!sourceCenter || !targetCenter) {
      console.error('sourceAnnotation or targetAnnotation is not found');
      return;
    }

    const line = new Line({
      id: uid(),
      coordinate: [
        {
          x: axis!.getOriginalX(sourceCenter.x),
          y: axis!.getOriginalY(sourceCenter.y),
        },
        {
          x: axis!.getOriginalX(targetCenter.x),
          y: axis!.getOriginalY(targetCenter.y),
        },
      ],
      style: {
        ...style,
        stroke: strokeColor,
        strokeWidth: Annotation.strokeWidth,
      },
    });

    group.add(line);

    // 点要覆盖在线上
    for (let i = 0; i < line.coordinate.length; i++) {
      const pointItem = line.coordinate[i];
      const point = new ControllerPoint({
        id: uid(),
        name: i === 0 ? 'source' : 'target',
        disabled: !this.requestEdit('update'),
        outOfImage: true,
        // 深拷贝，避免出现引用问题
        coordinate: { ...pointItem },
      });

      point.onMouseDown(this._onControllerPointDown);
      point.onMove(this._onControllerPointMove);
      point.onMouseUp(this._onControllerPointUp);

      group.add(point);
    }
  }

  /**
   * 按下控制点
   * @param point
   * @description 按下控制点时，记录受影响的线段
   */
  private _onControllerPointDown = (point: ControllerPoint) => {
    this._effectedLines = [undefined, undefined];

    this.group.each((shape) => {
      if (shape instanceof Line) {
        if (
          shape.dynamicCoordinate[0].x === point.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[0].y === point.dynamicCoordinate[0].y
        ) {
          // 线段的起点
          this._effectedLines![0] = shape;
        }
        if (
          shape.dynamicCoordinate[1].x === point.dynamicCoordinate[0].x &&
          shape.dynamicCoordinate[1].y === point.dynamicCoordinate[0].y
        ) {
          // 线段的终点
          this._effectedLines![1] = shape;
        }
      }
    });
  };

  /**
   * 移动控制点
   * @param changedCoordinate
   * @description 控制点移动时，更新线段的端点
   */
  private _onControllerPointMove = ({ coordinate, name }: ControllerPoint) => {
    const { _effectedLines } = this;
    let x = coordinate[0].x;
    let y = coordinate[0].y;

    if (!_effectedLines) {
      return;
    }

    const rbushItems = rbush.getRBushItemsByPointInBBox({ x, y }).filter((item) => {
      const annotation = this._getAnnotation(item._group!.id);

      if (!annotation || !VALID_RELATION_TOOLS.includes(annotation.name as any)) {
        return false;
      }

      if (name === 'source') {
        return item._group?.id !== this.group.id && item._group?.id !== this.data.targetId;
      }

      if (name === 'target') {
        return item._group?.id !== this.group.id && item._group?.id !== this.data.sourceId;
      }

      return false;
    });

    if (rbushItems.length > 0) {
      const targetBBox = rbushItems[0]._group?.getBBoxByFilter((shape) => !(shape instanceof ShapeText));

      if (name === 'source' && this._isDuplicatedRelation(rbushItems[0]._group!.id, this.data.targetId)) {
        return;
      }

      if (name === 'target' && this._isDuplicatedRelation(this.data.sourceId, rbushItems[0]._group!.id)) {
        return;
      }

      if (targetBBox) {
        // 获取中心点
        x = axis!.getOriginalX(targetBBox.minX + (targetBBox.maxX - targetBBox.minX) / 2);
        y = axis!.getOriginalY(targetBBox.minY + (targetBBox.maxY - targetBBox.minY) / 2);
      }

      this._tempPoint = {
        annotationId: rbushItems[0]._group!.id,
        x,
        y,
      };
    } else {
      this._tempPoint = null;
    }

    // 更新受影响的线段端点
    if (_effectedLines[1] === undefined && _effectedLines[0]) {
      _effectedLines[0].coordinate = [{ x, y }, { ..._effectedLines[0].coordinate[1] }];
    } else if (_effectedLines[0] === undefined && _effectedLines[1]) {
      _effectedLines[1].coordinate = [{ ..._effectedLines[1].coordinate[0] }, { x, y }];
    } else if (_effectedLines[0] && _effectedLines[1]) {
      // 更新下一个线段的起点
      _effectedLines[0].coordinate = [{ x, y }, { ..._effectedLines[0].coordinate[1] }];
      // 更新前一个线段的终点
      _effectedLines[1].coordinate = [{ ..._effectedLines[1].coordinate[0] }, { x, y }];
    }

    // 手动更新组合的包围盒
    this.group.update();
  };

  /**
   * 释放控制点
   */
  private _onControllerPointUp = ({ coordinate }: ControllerPoint) => {
    const { _effectedLines, data, _tempPoint } = this;

    if (!_effectedLines || !_tempPoint) {
      return;
    }

    // 根据受影响的线段确定是更新source还是target
    if (_effectedLines[0] && !_effectedLines[1]) {
      // 只有起点受影响，说明是source端
      _effectedLines[0].coordinate = [
        {
          x: _tempPoint.x,
          y: _tempPoint.y,
        },
        { ..._effectedLines[0].coordinate[1] },
      ];

      if (_tempPoint.annotationId !== data.targetId) {
        data.sourceId = _tempPoint.annotationId;
      }
    } else if (!_effectedLines[0] && _effectedLines[1]) {
      // 只有终点受影响，说明是target端
      _effectedLines[1].coordinate = [
        { ..._effectedLines[1].coordinate[0] },
        {
          x: _tempPoint.x,
          y: _tempPoint.y,
        },
      ];

      if (_tempPoint.annotationId !== data.sourceId) {
        data.targetId = _tempPoint.annotationId;
      }
    }

    coordinate[0].x = _tempPoint.x;
    coordinate[0].y = _tempPoint.y;
    this._tempPoint = null;
    axis?.rerender();
  };

  protected getDynamicCoordinates() {
    return this.group.shapes.map((shape) => cloneDeep(shape.dynamicCoordinate));
  }

  public isUnderCursor(mouseCoord: AxisPoint) {
    // 坐标在线条上
    return this.group.shapes.some((shape) => shape.isUnderCursor(mouseCoord));
  }

  public destroy() {
    super.destroy();
    this._effectedLines = null;
  }

  public render(ctx: CanvasRenderingContext2D) {
    super.render(ctx);
  }
}
