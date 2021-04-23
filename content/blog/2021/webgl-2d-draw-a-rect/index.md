---
title: WebGL绘制一个矩形
date: "2021-04-20"
description: 了解在webgl在2d中的基础使用，怎么设置顶点缓存以及颜色缓存
---
webgl中绘制是通过着色器完成的，我们得预先设置好着色器相关的属性，准备好数据，然后最后调用绘制。和传统的一步一步命令绘制很不一样。着色器采用着色器语言进行编写，这个和传统的面向对象不一样，调用方法对象本身是作为一个参数传入。猜测是类似`C`语言的语法（本人没有写过）。

绘制具体过程如下

## 1. 初始化webgl

1. 设置画布大小 canvas大小和css大小两种尺寸
2. 获取context  `gl = canvas.getContext('webgl')`
3. 设置viewport  `gl.viewport(0,0, canvas.width, canvas.height)`
4. 清除画布 `gl.clearColor(0,0,0,0) gl.clear(gl.COLOR_BUFFER_BIT)`

### webgl 坐标

webgl坐标，内部坐标对应裁剪坐标系，坐标中心在原点，范围为[-1,1]

## 2. 设置着色器

1. 分别创建顶点着色器和片元着色器 `createShader()`
2. shader添加代码 `gl.shaderSource(shader, source)`
3. 编译着色器 `gl.compileShader(shader)`
4. 创建着色器程序 `program = gl.createProgram()`
5. 添加着色器到着色器程序中 `program.attach` (注：着色器需要编译，而着色器程序不需要）
6. 可以查询添加是否成功（例：着色器语法有误） `gl.getProgramParameter(program, gl.LINK_STATUS)` 成功返回true, 失败了可以用 `gl.getProgramInfoLog(program)` 查看错误信息，之后别忘了删除出错的program. `gl.deleteProgram(program);`

### 着色器语法

#### 顶点着色器
1. 需要指定内部用到的attribute的类型以及名称，attribute是外部数据传入着色器内的窗口
2. `void main() {}` 别忘了返回类型是 `void` 
3. 内部变量 `gl_Position` 指定顶点的坐标

#### 片元着色器
1. 需要指定精度，一般设置 `precision mediump float;`
2. 内部变量 `gl_FragColor` 指定片元的颜色，颜色值是 `vec4`类型
3. 片元着色器想要获得程序中的变量，需经由顶点着色，两边同时声明 `varing`

## 3. 设置数据

绘制前需要提前设置后着色器内的值怎么从哪个数据取值，以及怎么取值。

1. 创建数据容器 `buffer = gl.createBuffer()`
2. 将 `buffer` 绑定到特定的值  `gl.bindBuffer(gl.ARRAY_BUFFER,buffer)` 之后操作 `buffer` 都是从这个 `gl.ARRAY_BUFFER` 上操作
3. 调用 `gl.bufferData()` 将数据写入 `buffer` 
4. 从着色器程序中拿出特定的attribute的地址。 `gl.getAttribLocation()` 进而可以设置怎么往这个地址里喂数据
5. 开启attribute `gl.enableVertexAttribArray()`, 使得attribute可以从 `gl.ARRAY_BUFFER`中拿数据
6. 设置attribute每次着色器执行时，attribute的值如何被取值（从buffer中取的数据的初始位置，每次取的数据的偏移stride, 每次取数据的数量size, 是否归一化数据） `gl.vertexAttribPointer`
7. webgl context里添加程序 `gl.useProgram(program)` 将program添加到当前的渲染状态中
8. drawArray开始绘制，指定绘制的元素（点，线段) ，开始绘制的顶点offset, 绘制的个数 gl.drawArrays

## 代码