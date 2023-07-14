import * as THREE from 'three';
//@ts-ignore
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { Font } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export interface Point {
  0: number;
  1: number;
}

const utils = {
  makeShape(pointList: Point[]) {
    let shape;
    if (pointList.length) {
      const arry = pointList;
      shape = new THREE.Shape();
      shape.moveTo(arry[0][0], arry[0][1]);
      for (let i = 1; i < arry.length; i++) {
        shape.lineTo(arry[i][0], arry[i][1]);
      }
      if (arguments.length > 1) {
        for (let i = 1; i < arguments.length; i++) {
          // eslint-disable-next-line prefer-rest-params
          const pathCoords = arguments[i];
          const path = new THREE.Path();

          path.moveTo(pathCoords[0][0], pathCoords[0][1]);
          for (let j = 1; j < pathCoords.length; j++) {
            path.lineTo(pathCoords[j][0], pathCoords[j][1]);
          }
          shape.holes.push(path);
        }
      }
      return shape;
    }
    console.error('Something wrong!');
  },
  makeExtrudeGeometry(shape: THREE.Shape | THREE.Shape[] | undefined, amount: any, bevelEnabled = false) {
    const extrudeSetting = {
      amount,
      bevelEnabled,
    };
    const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSetting);
    return geometry;
  },
  makeShapeGeometry(shapeCoords: any) {
    const shape = this.makeShape(shapeCoords);
    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  },
  makeMesh(type: string, geometry: any, color: any) {
    let material;
    if (type === 'lambert') {
      material = new THREE.MeshLambertMaterial({ color });
    } else if (type === 'phong') {
      material = new THREE.MeshPhongMaterial({ color });
    } else {
      console.error('unrecognized type!');
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  },

  async getSvgTextMesh(word: string, color: number) {
    const { default: tmpl } = await import('../../assets/font/labelU_font_Regular.json');
    const tFont = new Font(tmpl);
    const fontGeoMetry = new TextGeometry(word, {
      font: tFont,
      size: 1,
      height: 0.1,
    });
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(fontGeoMetry, material);
    const box = new THREE.Box3().setFromObject(mesh);
    const xLength = box.max.x - box.min.x;
    mesh.position.x = -xLength / 2;
    return mesh;
  },

  async getSvgFont() {
    const { default: tmpl } = await import('../../assets/font/labelU_font_Regular.json');
    const tFont = new Font(tmpl);
    return tFont;
  },

  getMeshLine(vectors: any, color: THREE.ColorRepresentation | undefined, lineWidth = 5) {
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const line = new MeshLine();
    line.setGeometry(geometry);
    const material = new MeshLineMaterial({
      useMap: false,
      color: new THREE.Color(color),
      opacity: 1,
      resolution,
      sizeAttenuation: false,
      lineWidth,
    });
    const mesh = new THREE.Mesh(line, material);
    mesh.raycast = MeshLineRaycast;

    return mesh;
  },
};

export default utils;
