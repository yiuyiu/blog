---
title: WebGL绘制3d立方体
date: "2021-05-10"
description: 了解在webgl在3d中的基础使用，了解正交、透视投影以及相机的基本概念
---
[在线地址](https://webgl-practice-delta.vercel.app/camera)
### 和绘制2d不同的地方

1. 引入z轴，2d的z轴默认都是0，着色器 `gl_Position` xyzw 默认取值是 0 0 0 1
2. 将3d物体投影到平面上有两种投影，分别为正交投影(orthographic projection) 以及 透视投影(perspective projection) ，透视投影符合人眼近大远小的观察特征。 
3. 运用矩阵变化和2d类似，矩阵在下面，2d变化的矩阵是3*3, 3d变化的矩阵是4*4，注意webgl传递到着色器中的矩阵和实际在js中定义的矩阵顺序。
4. 背面是否绘制，默认情况下是绘制的，可以通过开关开启不绘制背面， `gl.enable(gl.CULL_FACE)`；在webgl中逆时针的三角形是算作正面
5. 引入深度测试 z-buffer概念, webgl在绘制的时候会判断对应位置应该绘制哪个像素    `gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);` `gl.enable(gl.DEPTH_TEST)`

### 具体绘制步骤

1. 在渲染场景时，我们要先确定渲染的范围，将某一部分的场景渲染进最后成像内，其余部分是会被裁切掉。 
2. 正交投影的可见范围就是一个立方体，将某一个范围内的立方体映射到 [-1, 1]的范围内。
3. 透视投影的范围则是一个视椎体(frustum). 这个椎体由视角，成像画面长宽比，远近距离决定。透视投影的矩阵是假设眼睛在原点，朝着z轴负方向观看。 相同场景，相同物体，视角越大，最终成像越小。透视投影的矩阵是将z的值为 `-near`  到 `-far` , y的范围值为从near处与视角交界处的y值到far处的与视角交界处的y值, x值是根据aspect算出来的。
4. 不同相机位置看到的内容不一样，需要在每次变动相机的时候，构造变化矩阵。一个稍微简单的做法是先将相机的变换矩阵 (look at matrix) 算出，再转置算出物体变化矩阵 (view matrix)
    1. 构造以相机新坐标为原点的三轴，相机看向物体中心，以此方向为新的z轴，根据cross product，任意两个向量积算出来的向量是和这两个向量都垂直。 先选定z轴和原y轴，算出新的x轴，再根据新的x轴和z轴算出新的y轴
    2. 构造原坐标的三个基向量到相机中心的三个新的基向量
    3. 将相机变化矩阵转置Inverse即可得出物体变化矩阵。

### 相关变化矩阵

```jsx

var m4 = {
// 平移矩阵
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },
// 绕X旋转矩阵
  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },
// 绕y旋转矩阵
  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },
// 绕z旋转矩阵
  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
 
    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },
// 缩放矩阵
  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
};
```

### 投影矩阵

```jsx
// 实际像素空间映射到裁剪坐标系的矩阵，即正交投影
var m4 = {
  orthographic: function(left, right, bottom, top, near, far) {
    return [
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 2 / (near - far), 0,
 
      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      (near + far) / (near - far),
      1,
    ];
  }
// 正交投影映射举例
var left = 0;
var right = gl.canvas.clientWidth;
var bottom = gl.canvas.clientHeight;
var top = 0;
var near = 400;
var far = -400;
var matrix = m4.orthographic(left, right, bottom, top, near, far);

// 透视投影
function perspective(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
 
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
 }
// 透视投影举例
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var matrix = perspective(fieldOfViewRadians, aspect, zNear, zFar);

// lookAt camera
function(cameraPosition, target, up) {
    var zAxis = normalize(
        subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));
 
    return [
       xAxis[0], xAxis[1], xAxis[2], 0,
       yAxis[0], yAxis[1], yAxis[2], 0,
       zAxis[0], zAxis[1], zAxis[2], 0,
       cameraPosition[0],
       cameraPosition[1],
       cameraPosition[2],
       1,
    ];
  }
```