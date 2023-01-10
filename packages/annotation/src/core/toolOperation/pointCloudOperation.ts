import { PointCloud, PointCloudIProps } from '../pointCloud';
import * as THREE from 'three';
import utils from '../pointCloud/uitils';
import { MOUSE, Object3D, Scene, ShapeUtils, Vector3 } from 'three';
import MathUtils from '@/utils/MathUtils';
import { IPointCloudBox, IPolygonData } from '@label-u/utils';
import uuid from '@/utils/uuid';
import { Attribute, ToolConfig } from '@/interface/conbineTool';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import { COLORS_ARRAY } from '@/constant/style';
import AttributeUtils from '@/utils/tool/AttributeUtils';
import { styleDefaultConfig } from '@/constant/defaultConfig';
import HighlightWorker from 'web-worker:../pointCloud/highlightWorker.js';
// import {message} from 'antd';

interface PointCloudOperationProps {
  BoxList?: IPointCloudBox[];
  attribute: string;
  config?: ToolConfig;
}

class PointCloudOperation extends PointCloud {
  public boxList!: IPointCloudBox[];
  public attribute: string;
  public backgroundColorOp: number = 0x000000;
  public config: any;
  public style: any;
  public color: number;
  public selectedId?: string;

  constructor(props: PointCloudIProps & PointCloudOperationProps) {
    super(props);
    if (props.BoxList && props.BoxList.length > 0) {
      this.boxList = props.BoxList;
    } else {
      this.boxList = [];
    }
    this.style = {
      strokeColor: COLORS_ARRAY[4],
      fillColor: COLORS_ARRAY[4],
      strokeWidth: 2 * window?.devicePixelRatio,
      opacity: 1,
    };
    this.color = 0xffff00;
    this.config = props.config;
    this.attribute = props.attribute;
    this.initPointCloudOperation();
  }

  public setSelectedId(selectedId: string) {
    this.selectedId = selectedId;
  }

  public setDefaultAttribute(attribute: string) {
    this.attribute = attribute;
    const color = new THREE.Color(this.getColor(attribute).valid.stroke).getHex();
    // this.color = 0x00ff00;
    this.color = color;
  }

  public setStyle(toolStyle: any) {
    this.style = toolStyle;
  }

  public setBoxList(boxList: IPointCloudBox[]) {
    this.boxList = boxList;
  }

  public initPointCloudOperation() {
    this.initGroundMesh();
    this.initLight();
    this.initChooseEvent();
  }

  public setConfig(config: ToolConfig) {
    this.config = CommonToolUtils.jsonParser(config);
  }

  public getColor(attribute = '', config = this.config) {
    if (config?.attributeConfigurable === true && this.style.attributeColor) {
      const attributeIndex = AttributeUtils.getAttributeIndex(attribute, config?.attributeList ?? []);
      return this.style.attributeColor[attributeIndex];
    }
    const { color, toolColor } = this.style;
    if (toolColor) {
      return toolColor[color];
    }
    return styleDefaultConfig.toolColor['1'];
  }

  public initGroundMesh() {
    let groundGeometry = new THREE.PlaneGeometry(this.containerWidth, this.containerHeight);
    let groundMaterial = new THREE.MeshBasicMaterial({
      color: this.backgroundColorOp,
      wireframe: true,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    let groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.name = 'ground';
    this.scene.add(groundMesh);
  }

  public renderBoxList() {
    if (!this.boxList) {
      return;
    }

    console.log(this.boxList);
  }

  public getBoxArrowByRectAndZinfo(
    rect: ICoordinate[],
    zInfo: {
      maxZ: number;
      minZ: number;
    },
    color: number = 0xffffff,
  ) {
    let triangleWidthRite = 0.3;
    let triangleHeightRite = 0.3;
    let arrowLenghtRate = 0.2;
    let object3d = new THREE.Object3D();
    let zMiddle = (zInfo.maxZ + zInfo.minZ) / 2;
    // 箭头中心点
    let centerPoint = new THREE.Vector3((rect[2].x + rect[3].x) / 2, (rect[2].y + rect[3].y) / 2, zMiddle);
    // 箭头方向向量
    let arrowVector = new THREE.Vector3(
      (rect[2].x - rect[1].x) * arrowLenghtRate,
      (rect[2].y - rect[1].y) * arrowLenghtRate,
      0,
    );
    // 三角形三点确认
    let parallelVector = new THREE.Vector3(
      (rect[0].x - rect[1].x) * triangleWidthRite,
      (rect[0].y - rect[1].y) * triangleWidthRite,
      0,
    );

    let trianglePoints = [
      new THREE.Vector3(centerPoint.x + parallelVector.x, centerPoint.y + parallelVector.y, 0),
      new THREE.Vector3(centerPoint.x - parallelVector.x, centerPoint.y - parallelVector.y, 0),
      new THREE.Vector3(
        centerPoint.x + arrowVector.x * triangleHeightRite,
        centerPoint.y + arrowVector.y * triangleHeightRite,
        0,
      ),
    ];

    let points = [
      centerPoint,
      {
        x: centerPoint.x + arrowVector.x,
        y: centerPoint.y + arrowVector.y,
        z: centerPoint.z + arrowVector.z,
      },
    ];
    let sharpPoints = trianglePoints.map((item) => {
      return {
        0: item.x,
        1: item.y,
      };
    });
    let sharpGeo = utils.makeShapeGeometry([...sharpPoints, sharpPoints[0]]);
    let triangleMaterail = new THREE.MeshBasicMaterial({
      color: color,
      // transparent: true,
      // opacity: 0.5,
    });
    let triangleMesh = new THREE.Mesh(sharpGeo, triangleMaterail);
    triangleMesh.translateX(arrowVector.x);
    triangleMesh.translateY(arrowVector.y);
    triangleMesh.position.z = centerPoint.z;

    let meshLine = utils.getMeshLine(points, color, 10);

    object3d.add(meshLine);
    object3d.add(triangleMesh);
    // object3d.lookAt(this.camera.position)
    return object3d;
  }

  public setTransparencyByName(name: string, opacity: number) {
    let objectMesh = this.scene.getObjectByName(name) as THREE.Mesh;
    if (objectMesh) {
      //@ts-ignore
      objectMesh.children[0].material.opacity = opacity;
    }
  }

  // draw cubebox by four points and zinfo
  public getBox(
    sharpRect: { 0: number; 1: number }[],
    zInfo: {
      maxZ: number;
      minZ: number;
    },
    color: number = 0xffffff,
  ) {
    let object3d = new THREE.Object3D();
    let deep = zInfo.maxZ - zInfo.minZ;
    let zMiddle = (zInfo.maxZ + zInfo.minZ) / 2;
    let sharp = utils.makeShape([...sharpRect, sharpRect[0]]);
    let sharpGeometry = utils.makeExtrudeGeometry(sharp, deep, false);
    let boxMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
    });
    let boxEdgeGeometry = new THREE.EdgesGeometry(sharpGeometry, 1);
    let boxEdgeMaterial = new THREE.LineBasicMaterial({ color: color });

    let boxEdgeMesh = new THREE.LineSegments(boxEdgeGeometry, boxEdgeMaterial);
    boxEdgeMesh.translateZ(zMiddle - deep / 2);

    let boxMesh = new THREE.Mesh(sharpGeometry, boxMaterial);
    boxMesh.translateZ(zMiddle - deep / 2);
    object3d.add(boxMesh);
    object3d.add(boxEdgeMesh);
    return object3d;
  }

  // get BoxFormmat from points and zinfo
  public getBoxFormmat(
    points: [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
    zInfo: {
      maxZ: number;
      minZ: number;
    },
    order: number,
    paramsId?: string,
  ): IPointCloudBox {
    let id = paramsId ? paramsId : uuid(8, 62);
    // const centerPoint = MathUtils.getLineCenterPoint([points[0], points[2]]);
    const height = MathUtils.getLineLength(points[0], points[1]);
    const width = MathUtils.getLineLength(points[1], points[2]);
    const rotation = MathUtils.getRadiusFromQuadrangle(points);

    return {
      attribute: this.attribute,
      center: {
        x: (points[0].x + points[2].x) / 2,
        y: (points[0].y + points[2].y) / 2,
        z: (zInfo.maxZ + zInfo.minZ) / 2,
      },
      id: id,
      rotation: rotation,
      valid: true,
      width: width,
      height: height,
      depth: zInfo.maxZ - zInfo.minZ,
      order: order,
      zInfo: zInfo,
      rect: points,
    };
  }

  public updateBoxInSene = (
    rectPoints: ICoordinate[],
    zInfo: { maxZ: number; minZ: number },
    attribute: string,
    paramId?: string,
  ) => {
    let box = this.scene.getObjectByName(paramId + 'box');

    if (box) {
      let boxList: IPointCloudBox[] = this.boxList;
      let order = boxList.length + 1;
      let boxInfo = this.getBoxFormmat(
        rectPoints as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
        zInfo,
        order,
        paramId,
      );
      let newbox = this.addBoxInScene(rectPoints, zInfo, attribute, paramId);
      this.emit('selectPolygonChange', newbox.id, rectPoints);
      this.emit('savePcResult', [...boxList, boxInfo]);
    }
  };

  public addBoxInScene = (
    rectPoints: ICoordinate[],
    zInfo: { maxZ: number; minZ: number },
    attribute: string,
    paramId?: string,
  ) => {
    const color = new THREE.Color(this.getColor(attribute).valid.stroke).getHex();
    // delete prevOne
    let boxList: IPointCloudBox[] = this.boxList;
    if (paramId) {
      let boxName = paramId + 'box';
      let boxArrName = paramId + 'boxArrow';
      this.removeObjectByName(boxName);
      this.removeObjectByName(boxArrName);
      boxList = this.boxList.filter((item) => {
        return item.id !== paramId;
      });
    }
    let order = boxList.length + 1;
    // add new one
    let boxInfo = this.getBoxFormmat(
      rectPoints as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
      zInfo,
      order,
      paramId,
    );
    boxInfo.attribute = attribute;
    this.setBoxList([...boxList, boxInfo]);

    if (rectPoints.length > 0) {
      let sharpRect = rectPoints.map((item) => {
        return {
          0: item.x,
          1: item.y,
        };
      });
      if (this.selectedId) {
        this.setTransparencyByName(this.selectedId + 'box', 0);
      }
      let boxMesh = this.getBox(sharpRect, zInfo, color);
      boxMesh.name = boxInfo.id + 'box';
      this.setSelectedId(boxInfo.id);

      let boxArrowMesh = this.getBoxArrowByRectAndZinfo(rectPoints, zInfo, color);
      boxArrowMesh.name = boxInfo.id + 'boxArrow';
      this.scene.add(boxMesh);
      this.scene.add(boxArrowMesh);

      utils.getSvgTextMesh(attribute, color).then((fmesh) => {
        let position = {...fmesh.position}
        const Rz = new THREE.Matrix4().makeRotationZ(-boxInfo.rotation);
        const Tt = new THREE.Matrix4().makeTranslation(boxInfo.center.x + position.x,boxInfo.center.y + position.y,0);
        const Tb = new THREE.Matrix4().makeTranslation(-position.x,-position.y,boxInfo.zInfo.maxZ + 2);
        const tranlateMatrix = new THREE.Matrix4().multiply(Tb).multiply(Tt);
        fmesh.applyMatrix4(Rz)
        fmesh.applyMatrix4(tranlateMatrix);
        fmesh.name = boxInfo.id + 'attribute';
        this.removeObjectByName(fmesh.name);
        this.scene.add(fmesh);
      });
    }
    this.render();
    return boxInfo;
  };

  // get webgl coordinates by screen event
  public getWebglPositionFromEvent(
    container: HTMLElement,
    camera: THREE.Camera,
    scene: THREE.Scene,
    event: THREE.Event,
  ) {
    let mouseWord: {
      x: number;
      y: number;
    } = { x: 0, y: 0 };
    let raycaster = new THREE.Raycaster();
    let containerInfo = container.getBoundingClientRect();
    let containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;

    mouseWord.x = ((event.clientX - containerInfo.left) / containerWidth) * 2 - 1;
    mouseWord.y = -((event.clientY - containerInfo.top) / containerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseWord, camera);
    let groundMesh = scene.getObjectByName('ground') as THREE.Object3D<THREE.Event>;
    var raycasters = raycaster.intersectObject(groundMesh);
    return raycasters[0].point;
  }

  public getObjectByClick(container: HTMLElement, camera: THREE.Camera, scene: THREE.Scene, event: THREE.Event) {
    if (this.boxList.length === 0) {
      return;
    }
    let mouseWord: {
      x: number;
      y: number;
    } = { x: 0, y: 0 };
    let raycaster = new THREE.Raycaster();
    let containerInfo = container.getBoundingClientRect();
    let containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;

    mouseWord.x = ((event.clientX - containerInfo.left) / containerWidth) * 2 - 1;
    mouseWord.y = -((event.clientY - containerInfo.top) / containerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseWord, camera);
    let boxMeshList: Object3D[] = [];
    if (this.boxList && this.boxList.length > 0) {
      for (let i = 0; i < this.boxList.length; i++) {
        let tmpBox = this.scene.getObjectByName(this.boxList[i].id + 'box');
        if (tmpBox) {
          boxMeshList = [...boxMeshList, tmpBox];
        }
      }
    }
    let raycasterMeshs = raycaster.intersectObjects(boxMeshList);

    if (this.selectedId) {
      this.setTransparencyByName(this.selectedId + 'box', 0);
    }
    if (raycasterMeshs[0].object.parent?.name) {
      this.setSelectedId(
        raycasterMeshs[0].object.parent?.name.substring(0, raycasterMeshs[0].object.parent?.name.length - 3),
      );

      // set default atribute from selected box
      this.boxList.forEach((box) => {
        if (
          box.id ===
          raycasterMeshs[0].object.parent?.name.substring(0, raycasterMeshs[0].object.parent?.name.length - 3)
        ) {
          this.setDefaultAttribute(box.attribute);
        }
      });

      this.setTransparencyByName(this.selectedId + 'box', 0.3);
      this.emit('updateSelectedBox', this.selectedId);
    }
  }

  public getFooterRect(points: THREE.Vector3[], clickPoint: ICoordinate) {
    const rect = MathUtils.getRectangleByRightAngle({ x: clickPoint.x, y: clickPoint.y }, [
      {
        x: points[0].x,
        y: points[0].y,
      },
      {
        x: points[points.length - 1].x,
        y: points[points.length - 1].y,
      },
    ]);

    let sharpRect = rect.map((item) => {
      return {
        0: item.x,
        1: item.y,
      };
    });

    return { sharpRect: sharpRect, rect: rect };
  }

  // init screen events when the instance is created
  public initChooseEvent() {
    let self = this;
    let points: Vector3[] = [] as unknown as THREE.Vector3[];
    let firstlineName = '';
    let secondlineName = '';

    // add box in scene
    this.container.addEventListener('mousedown', function (event) {
      if (!self.attribute) {
        return;
      }
      if (event.button === MOUSE.LEFT) {
        let color = self.color;
        // 鼠标移动事件
        self.container.addEventListener('pointermove', handleMouseMove.bind(self));
        let clickPoint = self.getWebglPositionFromEvent(self.container, self.camera, self.scene, event);
        points = [...points, clickPoint];
        if (points.length === 3) {
          let { rect } = self.getFooterRect(points.slice(0, 2), clickPoint);
          let zInfo = self.getSensesPointZAxisInPolygon(rect);
          if (zInfo.zCount > 0) {
            let box = self.addBoxInScene(rect, zInfo, self.attribute);
            self.emit('boxAdded', rect, box.attribute, box.id);
          }
          // 清除点数据
          points = [];
          // 清除辅助线
          self.removeObjectByName(secondlineName);
          self.removeObjectByName(firstlineName);
          self.container.removeEventListener('pointermove', handleMouseMove);
        }
      } else if (event.button === MOUSE.RIGHT) {
        self.getObjectByClick(self.container, self.camera, self.scene, event);
      }
      self.render();
    });

    // draw a line bye moving the mouse
    function handleMouseMove(event: THREE.Event) {
      let clickPoint = self.getWebglPositionFromEvent(self.container, self.camera, self.scene, event);
      if (points.length === 1) {
        let tmpPoint = [...points, clickPoint];
        if (!firstlineName) {
          firstlineName = new Date().getTime() + 'firstLine';
        }
        if (self.scene.getObjectByName(firstlineName)) {
          let lineInScene = self.scene.getObjectByName(firstlineName);
          self.scene.remove(lineInScene as THREE.Object3D);
        }

        let meshLine = utils.getMeshLine(tmpPoint, this.color, 10);
        meshLine.name = firstlineName;
        self.scene.add(meshLine);
      }

      if (points.length === 2) {
        if (!secondlineName) {
          secondlineName = new Date().getTime() + 'secondLine';
        }
        if (self.scene.getObjectByName(secondlineName)) {
          let lineInScene = self.scene.getObjectByName(secondlineName);
          self.scene.remove(lineInScene as THREE.Object3D);
        }
        let sharpRect = self.getFooterRect(points, clickPoint).sharpRect;
        let reactanglePoint = { x: sharpRect[2][0], y: sharpRect[2][1], z: 0 };
        let tmpPoint = [points[1], reactanglePoint];
        let meshLine = utils.getMeshLine(tmpPoint, this.color, 10);
        meshLine.name = secondlineName;
        self.scene.add(meshLine);
      }
      self.render();
    }
  }

  /**
   * It needs to be updated after load PointCLoud's data.
   * @param boxParams
   * @returns
   */
  public highlightOriginPointCloud(
    boxParams: IPointCloudBox,
    points?: THREE.Points,
  ): Promise<{ geometry: any; num: number } | undefined> {
    if (!points) {
      const originPoints = this.scene.getObjectByName(this.pointCloudObjectName);

      if (!originPoints) {
        console.error('There is no corresponding point cloud object');
        return Promise.resolve(undefined);
      }

      points = originPoints as THREE.Points;
    }

    if (window.Worker) {
      const { zMin, zMax, polygonPointList } = this.getCuboidFromPointCloudBox(boxParams);
      const position = points.geometry.attributes.position.array;
      const color = points.geometry.attributes.color.array;
      let params = {
        boxParams,
        zMin,
        zMax,
        polygonPointList,
        color,
        position,
      };

      if (boxParams.attribute) {
        let inColor = new THREE.Color(this.getColor(this.attribute).valid.stroke);
        let rgbArr = [inColor.r, inColor.g, inColor.b];
        params = {
          boxParams,
          zMin,
          zMax,
          polygonPointList,
          color,
          position,
          // @ts-ignore
          inColorArr: rgbArr,
        };
      }
      return new Promise((resolve) => {
        const highlightWorker = new HighlightWorker();
        highlightWorker.postMessage(params);
        highlightWorker.onmessage = (e: any) => {
          const { color: newColor, points: newPosition, num } = e.data;
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPosition, 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(newColor, 3));
          // geometry.setAttribute('color',0xffffff);
          geometry.computeBoundingSphere();
          highlightWorker.terminate();
          resolve({ geometry, num });
        };
      });
    }

    return Promise.resolve(undefined);
  }

  /**
   * Load PCD File by box
   * @param src
   * @param boxParams
   * @param scope
   */
  public updatePointCloudAfterDragBox = async (src: string, boxParams: IPointCloudBox) => {
    const cb = async (points: THREE.Points) => {
      // TODO. Speed can be optimized.
      const filterData = await this.highlightOriginPointCloud(boxParams, points);
      if (!filterData) {
        console.error('filter Error');
        return;
      }

      this.clearPointCloud();
      const newPoints = new THREE.Points(filterData.geometry, points.material);
      newPoints.name = this.pointCloudObjectName;
      this.pointsUuid = newPoints.uuid;
      this.scene.add(newPoints);
      this.render();
    };
    const points = await this.cacheInstance.loadPCDFile(src);
    cb(points);
  };
}

export default PointCloudOperation;
