import { PointCloud, PointCloudIProps } from '../pointCloud';
import * as THREE from 'three';
import utils from '../pointCloud/uitils';
import { MOUSE, Object3D, Vector3 } from 'three';
import MathUtils from '@/utils/MathUtils';
import { IPointCloudBox } from '@label-u/utils';
import uuid from '@/utils/uuid';
import { ShowSettingConfig, ToolConfig } from '@/interface/conbineTool';
import CommonToolUtils from '@/utils/tool/CommonToolUtils';
import { COLORS_ARRAY } from '@/constant/style';
import AttributeUtils from '@/utils/tool/AttributeUtils';
import { styleDefaultConfig } from '@/constant/defaultConfig';
import HighlightOneBoxWorker from 'web-worker:../pointCloud/highlightOneBoxWorker.js';
import HighlightBoxesWorker from 'web-worker:../pointCloud/highlightBoxesWorkder.js';
const DEFAULT_RADIUS = 90;

interface PointCloudOperationProps {
  BoxList?: IPointCloudBox[];
  attribute: string;
  config?: ToolConfig;
}

class PointCloudOperation extends PointCloud {
  public boxList!: IPointCloudBox[]; // 已标注的立体框
  public attribute: string; // 当前标签
  public backgroundColorOp: number = 0x000000; // 背景色
  public config: any; // 配置
  public style: any;
  public color: number; // 当前颜色
  public selectedId?: string; // 选中框id
  public showSetting: ShowSettingConfig; // 显示设置项
  public allAttributes?: Attribute[]; // 全量标签

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
    this.showSetting = {
      isShowOrder: false,
      isShowAttribute: false,
      isShowAttributeText: false,
      isShowDirection: false,
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

  public setShowSettings(showSettings: ShowSettingConfig) {
    this.showSetting = showSettings;
  }

  public setAllAttributes(allAttributes: Attribute[]) {
    this.allAttributes = allAttributes;
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
    if (config?.attributeConfigurable === true && this.style.attributeColor && this.allAttributes) {
      const attributeIndex = AttributeUtils.getAttributeIndex(attribute, this.allAttributes ?? []) + 1;
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

  public clearBoxList() {
    if (this.boxList && this.boxList.length > 0) {
      for (let i = 0; i < this.boxList.length; i++) {
        this.removeObjectByName(this.boxList[i].id + 'boxArrow');
        this.removeObjectByName(this.boxList[i].id + 'box');
        this.removeObjectByName(this.boxList[i].id + 'attribute');
      }
    }
    // this.render();
  }

  public clearBoxInSceneById(id: string) {
    if (id) {
      this.removeObjectByName(id + 'boxArrow');
      this.removeObjectByName(id + 'box');
      this.removeObjectByName(id + 'attribute');
    }
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
    let centerPoint = new THREE.Vector3((rect[2].x + rect[3].x) / 2, (rect[2].y + rect[3].y) / 2, zMiddle);
    let arrowVector = new THREE.Vector3(
      (rect[2].x - rect[1].x) * arrowLenghtRate,
      (rect[2].y - rect[1].y) * arrowLenghtRate,
      0,
    );
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
    });
    let triangleMesh = new THREE.Mesh(sharpGeo, triangleMaterail);
    triangleMesh.translateX(arrowVector.x);
    triangleMesh.translateY(arrowVector.y);
    triangleMesh.position.z = centerPoint.z;
    let meshLine = utils.getMeshLine(points, color, 10);
    object3d.add(meshLine);
    object3d.add(triangleMesh);
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
  public createBox(
    sharpRect: { 0: number; 1: number }[],
    zInfo: {
      maxZ: number;
      minZ: number;
    },
    color: number = 0xffffff,
    opacity: number = 0,
  ) {
    let object3d = new THREE.Object3D();
    let deep = zInfo.maxZ - zInfo.minZ;
    let zMiddle = (zInfo.maxZ + zInfo.minZ) / 2;
    let sharp = utils.makeShape([...sharpRect, sharpRect[0]]);
    let sharpGeometry = utils.makeExtrudeGeometry(sharp, deep, false);
    let boxMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
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
      zInfo: zInfo,
      rect: points,
      order: 1,
      isVisible: true,
    };
  }

  // add box in scene
  public addBoxInSense = (
    rectPoints: ICoordinate[],
    zInfo: { maxZ: number; minZ: number; paramId?: string },
    attribute: string,
  ) => {
    let boxList: IPointCloudBox[] = this.boxList;
    let boxInfo = this.getBoxFormmat(rectPoints as [ICoordinate, ICoordinate, ICoordinate, ICoordinate], zInfo);
    let order = this.getOrder(boxList, boxInfo);
    boxInfo = {
      ...boxInfo,
      order: order,
      isVisible: true,
      attribute: attribute,
    };
    let newBoxList = this.addBoxInfoIntoBoxList(boxList, boxInfo);
    this.setBoxList(newBoxList);
    this.emit('savePcResult', newBoxList);
    return boxInfo;
  };

  // add attributes to scene
  public addAttributeAndOrder = (boxInfo: IPointCloudBox, attribute: string, color: number) => {
    if (this.showSetting.isShowAttribute) {
      utils
        .getSvgTextMesh(this.showSetting.isShowOrder ? `${boxInfo.order} - ${attribute}` : attribute, color)
        .then((fmesh) => {
          let position = { ...fmesh.position };
          const Rz = new THREE.Matrix4().makeRotationZ(-boxInfo.rotation);
          const Tt = new THREE.Matrix4().makeTranslation(
            boxInfo.center.x + position.x,
            boxInfo.center.y + position.y,
            0,
          );
          const Tb = new THREE.Matrix4().makeTranslation(-position.x, -position.y, boxInfo.zInfo.maxZ + 2);
          const tranlateMatrix = new THREE.Matrix4().multiply(Tb).multiply(Tt);
          fmesh.applyMatrix4(Rz);
          fmesh.applyMatrix4(tranlateMatrix);
          fmesh.name = boxInfo.id + 'attribute';
          this.removeObjectByName(fmesh.name);
          this.scene.add(fmesh);
          this.render();
        });
    }
  };

  // update box in scene
  public doUpateboxInScene = (
    rectPoints: ICoordinate[],
    zInfo: { maxZ: number; minZ: number },
    attribute: string,
    paramId: string,
  ) => {
    const color = new THREE.Color(this.getColor(attribute).valid.stroke).getHex();
    let opacity = 0.3;
    // delete prevOne
    let boxList: IPointCloudBox[] = this.boxList;
    let prevBox;
    if (paramId) {
      this.clearBoxInSceneById(paramId);
      prevBox = this.boxList.filter((item) => {
        return item.id === paramId;
      });
    }
    // add new one
    let boxInfo = this.getBoxFormmat(
      rectPoints as [ICoordinate, ICoordinate, ICoordinate, ICoordinate],
      zInfo,
      paramId,
    );
    boxInfo.attribute = attribute;
    let order = this.getOrder(boxList, boxInfo);
    if (Array.isArray(prevBox) && prevBox.length > 0) {
      boxInfo.isVisible = prevBox[0].isVisible;
    } else {
      boxInfo.isVisible = true;
    }
    boxInfo.order = order;
    let newBoxList = this.addBoxInfoIntoBoxList(boxList, boxInfo);
    this.setBoxList(newBoxList);
    if (rectPoints.length > 0) {
      let sharpRect = rectPoints.map((item) => {
        return {
          0: item.x,
          1: item.y,
        };
      });
      if (this.selectedId) {
        this.setTransparencyByName(this.selectedId + 'box', 0);
      } else {
        opacity = 0;
      }
      let boxMesh = this.createBox(sharpRect, zInfo, color, opacity);
      boxMesh.name = boxInfo.id + 'box';
      this.setSelectedId(boxInfo.id);
      this.scene.add(boxMesh);
      if (this.showSetting.isShowDirection) {
        let boxArrowMesh = this.getBoxArrowByRectAndZinfo(rectPoints, zInfo, color);
        boxArrowMesh.name = boxInfo.id + 'boxArrow';
        this.scene.add(boxArrowMesh);
      }
      this.addAttributeAndOrder(boxInfo, attribute, color);
    }
    this.emit('savePcResult', newBoxList);
    this.emit('selectPolygonChange', boxInfo.id, rectPoints);
    this.render();
  };

  // get box order
  public getOrder(boxList: IPointCloudBox[], boxInfo: IPointCloudBox) {
    let returnOrder = 0;
    if (Array.isArray(boxList) && boxList.length > 0) {
      for (let i = 0; i < boxList.length; i++) {
        if (boxList[i].id !== boxInfo.id) {
          if (boxList[i].order >= returnOrder) {
            returnOrder = boxList[i].order + 1;
          }
        } else {
          returnOrder = boxList[i].order;
          break;
        }
      }
    } else {
      return boxInfo.order;
    }
    return returnOrder;
  }

  // add box into boxList
  public addBoxInfoIntoBoxList(boxList: IPointCloudBox[], boxInfo: IPointCloudBox) {
    let isExist = false;
    let newBoxList = [];
    if (Array.isArray(boxList) && boxList.length > 0) {
      for (let i = 0; i < boxList.length; i++) {
        if (boxList[i].id !== boxInfo.id) {
          newBoxList.push(boxList[i]);
        } else {
          newBoxList.push(boxInfo);
          isExist = true;
        }
      }
    }
    if (!isExist) {
      newBoxList.push(boxInfo);
    }
    return newBoxList;
  }

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
      if (!self.attribute || event.ctrlKey || event.shiftKey) {
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
            let box = self.addBoxInSense(rect, zInfo, self.attribute);
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
   * highLight points by boxes
   */
  public highlightOriginPointCloudByBoxes(
    boxParamsArr: IPointCloudBox[],
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
      let boxesArr = [];
      let params = {};
      const position = points.geometry.attributes.position.array;
      const color = points.geometry.attributes.color.array;
      if (Array.isArray(boxParamsArr) && boxParamsArr.length > 0) {
        for (let i = 0; i < boxParamsArr.length; i++) {
          let inColor = new THREE.Color(this.getColor(boxParamsArr[i].attribute).valid.stroke);
          let rgbArr = [inColor.r, inColor.g, inColor.b];
          boxesArr.push({
            ...boxParamsArr[i],
            inColorArr: rgbArr,
          });
        }
      }
      params = {
        color,
        position,
        rectList: boxesArr,
      };
      return new Promise((resolve) => {
        const highlightBoxesWorker = new HighlightBoxesWorker();
        highlightBoxesWorker.postMessage(params);
        highlightBoxesWorker.onmessage = (e: any) => {
          const { color: newColor, points: newPosition, num } = e.data;
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPosition, 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(newColor, 3));
          geometry.computeBoundingSphere();
          highlightBoxesWorker.terminate();
          resolve({ geometry, num });
        };
      });
    }
    return Promise.resolve(undefined);
  }

  /**
   * shader points by attributes
   */
  public updatePointCloudByAttributes = async (src: string, boxParamsArr: IPointCloudBox[]) => {
    const cb = async (points: THREE.Points) => {
      const highLightData = await this.highlightOriginPointCloudByBoxes(boxParamsArr, points);
      if (!highLightData) {
        console.error('filter Error');
        return;
      }
      this.clearPointCloud();
      const newPoints = new THREE.Points(highLightData.geometry, points.material);
      // 更新点云缓存
      // this.cacheInstance.setInstance(src, newPoints);
      newPoints.name = this.pointCloudObjectName;
      this.pointsUuid = newPoints.uuid;
      this.renderPointCloud(newPoints, this.config?.radius ?? DEFAULT_RADIUS);
    };
    const points = await this.cacheInstance.loadPCDFile(src);
    cb(points);
  };

  public textLookAtCamera() {
    let boxList = this.boxList;
    let camaraPostion = this.camera.position;
    if (Array.isArray(boxList) && boxList.length > 0) {
      for (let i = 0; i < boxList.length; i++) {
        let tmpTextMesh = this.scene.getObjectByName(boxList[i].id + 'attribute');
        tmpTextMesh?.lookAt(camaraPostion);
      }
    }
  }

  public render() {
    this.textLookAtCamera();
    super.render();
  }
}

export default PointCloudOperation;
