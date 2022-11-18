import * as THREE from 'three';
//@ts-ignore
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';

export interface Point {
  0: number;
  1: number;
}

let utils = {
  makeShape: function (pointList: Point[]) {
    let shape;
    if (pointList.length) {
      let arry = pointList;
      shape = new THREE.Shape();
      shape.moveTo(arry[0][0], arry[0][1]);
      for (let i = 1; i < arry.length; i++) {
        shape.lineTo(arry[i][0], arry[i][1]);
      }
      if (arguments.length > 1) {
        for (let i = 1; i < arguments.length; i++) {
          let pathCoords = arguments[i];
          let path = new THREE.Path();

          path.moveTo(pathCoords[0][0], pathCoords[0][1]);
          for (let i = 1; i < pathCoords.length; i++) {
            path.lineTo(pathCoords[i][0], pathCoords[i][1]);
          }
          shape.holes.push(path);
        }
      }
      return shape;
    } else {
      console.error('Something wrong!');
    }
  },
  makeExtrudeGeometry: function (shape: THREE.Shape | THREE.Shape[] | undefined, amount: any, bevelEnabled = false) {
    let extrudeSetting = {
      amount: amount,
      bevelEnabled: bevelEnabled,
    };
    let geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSetting);
    // geometry.rotateX(-0.5 * Math.PI);
    return geometry;
  },
  makeShapeGeometry: function (shapeCoords: any) {
    let shape = this.makeShape(shapeCoords);
    let geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  },
  makeMesh: function (type: string, geometry: any, color: any) {
    let material;
    let mesh;
    if (type === 'lambert') {
      material = new THREE.MeshLambertMaterial({ color: color });
    } else if (type === 'phong') {
      material = new THREE.MeshPhongMaterial({ color: color });
    } else {
      console.error('unrecognized type!');
    }
    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  },

  // 生成矢量字体
  // getSvgTextMesh: function(word: any, color: any) {
  //   let font = require('@/assets/fonts/helvetiker_regular.typeface.json');
  //   let tFont = new THREE.Font(font);
  //   let fontGeoMetry = new THREE.TextGeometry(word, {
  //     font: tFont,
  //     size: 1,
  //     height: 3
  //   });
  //   let mesh = utils.makeMesh('Lambert', fontGeoMetry, color);
  //   var box = new THREE.Box3().setFromObject(mesh);
  //   var size = box.size();
  //   var xLength = size.x;
  //   mesh.rotation.x = -0.5 * Math.PI;
  //   mesh.position.x = -xLength / 2;
  //   return mesh;
  // },

  // 生成meshline线条
  getMeshLine: function (vectors: any, color: THREE.ColorRepresentation | undefined, lineWidth = 5) {
    var resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    // var g = new MeshLine();
    // g.setGeometry(vectors);
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const line = new MeshLine();
    line.setGeometry(geometry);
    var material = new MeshLineMaterial({
      useMap: false,
      color: new THREE.Color(color),
      opacity: 1,
      resolution: resolution,
      sizeAttenuation: false,
      lineWidth: lineWidth,
    });
    var mesh = new THREE.Mesh(line, material);
    mesh.raycast = MeshLineRaycast;

    return mesh;
  },
};

export default utils;
