---
title: WebGL Lighting
date: "2021-05-14"
description: 了解光照处理的基本知识，了解directional light, point light, spot light的区别
---
[在线地址](https://webgl-practice-delta.vercel.app/light)

## 光源的分类

1. 平行光 (directional light): 这类光是平行的，并且是从无限远的地方并且宽度也默认无限的，我们计算时只是利用这个光的角度。
2. 点光源 (point light): 这类光是从一个点发散出无限宽度的光，我们计算时需要知道光源的坐标，物体表面上不同位置光的入射角都不一样。
3. 局部光源 (spot light): 这类光和点光源很像，只是它有一个范围，类似舞台上的聚光灯那样，没有光照的部分就是暗的，为了让明暗不过于生硬，可以在这个范围外加一层限制模拟光晕的效果。
4. 高光 (specular highlight) 当入射光正好反射入人眼的情况下，此时物体的某个部分就显得比其他地方更亮，这个是通过颜色色值的叠加实现的。

## 光照的计算

### 具体计算步骤

1. 计算物体表面的法线 (normal) , 之后用来计算和入射光之间的夹角。
2. 物体运用矩阵进行变换时候，需要运用特殊矩阵对法线进行变换。由于对法线直接应用物体变换矩阵在物体被scale的情况下可能会不准，即变换后的法线不和物体平面垂直。要使用物体变化矩阵的逆矩阵的转置矩阵
3. 获取光照角度，不同的入射角度造成物体表面的明暗不同。平行光的入射角度都是一样的，非平行光需要单独计算表面上每个点和光源之间的角度。利用光照角度和法线的点乘结果应用不同的色值。
4. 局部光源需要判断物体表面的点是否能被光源找到，照不到的地方色值都是0. 
5. 高光需要计算物体到眼睛的向量以及物体到光源的向量之间的一半向量点乘法线向量，将结果加到物体颜色色值上去。

    ![https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/9304ec5e-197c-4215-977e-8ce1b0a044e7/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAT73L2G45O3KS52Y5%2F20210514%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20210514T085340Z&X-Amz-Expires=86400&X-Amz-Signature=593cc13b7222b4bc0cf576e2277e133a3142ceea0b2f3057a8e4a86c29dc382d&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22Untitled.png%22)

### tips

计算镜面反射时，引入 `u_shininess` 用于控制亮度根据法线和一半向量点乘的变化的剧烈程度。采用 `pow(dotproduct, u_shininess)` 计算，`u_shininess` 为1时就是线性变换

### 着色器

点光源

```c
attribute vec4 a_position;   // 顶点
attribute vec3 a_normal;  // 法线

uniform vec3 u_lightWorldPosition;  // 光源坐标
uniform vec3 u_viewWorldPosition;  // 观察坐标，用于镜面反射

uniform mat4 u_world;  // 物体变换矩阵
uniform mat4 u_worldViewProjection;  // 映射到平面的投影矩阵，包含物体变换在内
uniform mat4 u_worldInverseTranspose;  // 变换矩阵逆矩阵的转置矩阵，用于变换法线

varying vec3 v_normal;  // 传值给片元着色器的法线坐标

varying vec3 v_surfaceToLight;  // 物体到光源的向量，需要被插值
varying vec3 v_surfaceToView;  // 物体到观察点的向量，用于镜面反射

void main() {
    // Multiply the position by the matrix.
    gl_Position = u_worldViewProjection * a_position;

    // orient the normals and pass to the fragment shader
    v_normal = mat3(u_worldInverseTranspose) * a_normal;

    // compute the world position of the surface
    vec3 surfaceWorldPosition = (u_world * a_position).xyz;

    // compute the vector of the surface to the light
    // and pass it to the fragment shader
    v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;

    // compute the vector of the surface to the view/camera
    // and pass it to the fragment shader
    v_surfaceToView = normalize(u_viewWorldPosition - surfaceWorldPosition);
}
```

```c
precision mediump float;

// Passed in from the vertex shader.
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_color;  // 物体表面颜色
uniform float u_shininess;  // 亮度用于控制镜面反射的强度，越低则镜面反射的范围越大
uniform vec3 u_specularColor;  // 镜面反射的颜色

void main() {
    // because v_normal is a varying it's interpolated
    // so it will not be a unit vector. Normalizing it
    // will make it a unit vector again
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

    float light = dot(normal, surfaceToLightDirection);
    float specular = 0.0;
    specular = pow(dot(normal, halfVector), u_shininess);

    gl_FragColor = u_color;

    // Lets multiply just the color portion (not the alpha)
    // by the light
    gl_FragColor.rgb *= light;

    // Just add in the specular
    gl_FragColor.rgb += specular * u_specularColor;
}
```