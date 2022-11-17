import { PointCloud, PointCloudIProps } from '../pointCloud';
import * as THREE from 'three';
import utils from '../pointCloud/uitils';
import { MOUSE, Vector2, Vector3 } from 'three';
import MathUtils from '@/utils/MathUtils';

class PointCloudOperation extends PointCloud {
  constructor(props: PointCloudIProps) {
    super(props);
    this.initPointCloudOperation();
  }

  public initPointCloudOperation() {
    this.initGroundMesh();
    this.initLight();
    this.initChooseEvent();
  }

  public initGroundMesh() {
    let groundGeometry = new THREE.PlaneGeometry(this.containerWidth, this.containerHeight);
    let groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent:true,
      opacity: 0,
      depthTest: false,
    });
    let groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.name = 'ground';
    this.scene.add(groundMesh);
  }



  public darwBoxArrowByRectAndZinfo(
    rect: ICoordinate[],
    zInfo: {
      maxZ: number;
      minZ: number;
    },
    color: number,
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

    let meshLine = utils.getMeshLine(points, color, 20);
    object3d.add(meshLine);
    object3d.add(triangleMesh);
    this.scene.add(object3d);
  }


  // draw cubebox by four points and zinfo 
  public drawBox(sharpRect:{0:number,1:number}[], zInfo: {
    maxZ: number;
    minZ: number;
  },
  color: number = 0xffffff){
    let deep = zInfo.maxZ - zInfo.minZ;
    let zMiddle = (zInfo.maxZ + zInfo.minZ) / 2;
    let sharp = utils.makeShape([...sharpRect, sharpRect[0]]);
    let sharpGeometry = utils.makeExtrudeGeometry(sharp, deep, false);
    let boxMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    let boxEdgeGeometry = new THREE.EdgesGeometry(sharpGeometry, 1);
    let boxEdgeMaterial = new THREE.LineBasicMaterial({ color: color });

    let boxEdgeMesh = new THREE.LineSegments(boxEdgeGeometry, boxEdgeMaterial);
    boxEdgeMesh.translateZ(zMiddle - deep / 2);

    let boxMesh = new THREE.Mesh(sharpGeometry, boxMaterial);
    boxMesh.translateZ(zMiddle - deep / 2);
    this.scene.add(boxMesh);
    this.scene.add(boxEdgeMesh);
  }

  // get webgl coordinates by screen event 
  public getWebglPositionFromEvent(container:HTMLElement,camera:THREE.Camera,scene:THREE.Scene,event: THREE.Event) {
    let mouseWord: {
      x: number;
      y: number;
    } = { x: 0, y: 0 };
    let raycaster = new THREE.Raycaster();
    let containerInfo =  container.getBoundingClientRect();
    let containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;

    mouseWord.x = ((event.clientX - containerInfo.left) / containerWidth) * 2 - 1;
    mouseWord.y = -((event.clientY - containerInfo.top) / containerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseWord, camera);
    let groundMesh = scene.getObjectByName('ground') as THREE.Object3D<THREE.Event>;
    var raycasters = raycaster.intersectObject(groundMesh);
    return raycasters[0].point;
  }

  // init screen events when the instance is created
  public initChooseEvent() {
    let self = this;
    let points: Vector3[] = [] as unknown as THREE.Vector3[];
    let firstlineName = '';
    let secondlineName = '';

    function getFooterRect(points: THREE.Vector3[], clickPoint: ICoordinate) {
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

    // add box in scene
    this.container.addEventListener('click', function (event) {
      if (event.button === MOUSE.LEFT) {
        // 鼠标移动事件
        self.container.addEventListener('pointermove', handleMouseMove);
        let clickPoint = self.getWebglPositionFromEvent(self.container,self.camera,self.scene,event);
        points = [...points, clickPoint];
        if (points.length === 3) {
          let { sharpRect, rect } = getFooterRect(points.slice(0, 2), clickPoint);
          let zInfo = self.getSensesPointZAxisInPolygon(rect);
          self.drawBox(sharpRect, zInfo, 0xffffff);
          self.darwBoxArrowByRectAndZinfo(rect, zInfo, 0xffffff);
          // 清除点数据
          points = [];
          // 清除辅助线
          let secondMeshLine = self.scene.getObjectByName(secondlineName) as unknown as THREE.Object3D;
          let firstMeshLine = self.scene.getObjectByName(firstlineName) as unknown as THREE.Object3D;
          self.scene.remove(secondMeshLine);
          self.scene.remove(firstMeshLine);
          self.container.removeEventListener('pointermove', handleMouseMove);
        }
        self.render();
      }
    });

    // draw a line bye moving the mouse
    function handleMouseMove(event: THREE.Event) {
      let clickPoint = self.getWebglPositionFromEvent(self.container,self.camera,self.scene,event);
      if (points.length === 1) {
        let tmpPoint = [...points, clickPoint];
        if (!firstlineName) {
          firstlineName = new Date().getTime() + 'firstLine';
        }
        if (self.scene.getObjectByName(firstlineName)) {
          let lineInScene = self.scene.getObjectByName(firstlineName);
          self.scene.remove(lineInScene as THREE.Object3D);
        }

        let meshLine = utils.getMeshLine(tmpPoint, 10);
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
        let sharpRect = getFooterRect(points, clickPoint).sharpRect;
        let reactanglePoint = { x: sharpRect[2][0], y: sharpRect[2][1], z: 0 };
        let tmpPoint = [points[1], reactanglePoint];
        let meshLine = utils.getMeshLine(tmpPoint, 10);
        meshLine.name = secondlineName;
        self.scene.add(meshLine);
      }
      self.render();
    }

  }
}

export default PointCloudOperation;
