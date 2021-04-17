---
title: node中各种模块介绍
date: "2021-04-17"
description: 熟悉c++，并且了解node中各个模块的注册以及加载
---

### 阅读工具

以下内容是基于 node15.14.0 版本阅读的。另外在 github 仓库的地址上 github 后面加上 `1s` 可以在网页上利用 vscode 查看源码，支持快捷方式文件跳转，全局搜索等。

例：[https://github1s.com/nodejs/node/blob/HEAD/doc/changelogs/CHANGELOG_V15.md](https://github1s.com/nodejs/node/blob/HEAD/doc/changelogs/CHANGELOG_V15.md)

## Node 启动过程

- 调用 node::Start (node_main.cc)
- 构建 main_instance 并 run (node.cc) 这过程中包含 libuv 的配置，以及 v8 平台
- LoadEnvironment (node_main_instance.cc) 在这个期间进行 libuv 的初始化
- StartExecution (environment.cc)
- 会执行一些脚本，其中包含 `StartExecution(env, "internal/main/run_main_module")` 就是执行我们在命令行启动时携带的参数脚本

## Node 的各种模块

先来介绍个概念，经常能看到 `binding` 在代码中，以下是摘自 [learncpp.com](http://learncpp.com)

> Binding refers to the process that is used to convert identifiers (such as variable and function names) into addresses. Although binding is used for both variables and functions, in this lesson we’re going to focus on function binding

就是把各种标识符编译到具体地址，这样比如在 js 中的就可以获取到一个在内存中的 c++方法的地址进而可以调用。

### C++内置模块

不对用户暴露的模块，比如 `v8` , `libuv` , `fs` , 这些模块。在 `node_binding.cc` 有内置模块的列表；这些模块在 node 内部通关 `internalBinding` 绑定，这些模块会在各自模块的结尾调用 `NODE_MODULE_CONTEXT_AWARE_INTERNAL` 创建绑定。

### C++外部模块

编写 c++插件的模块就算外部模块，这些模块是通过动态链接对象添加到当前环境的，这个模块就是一个的动态链接库，相当于 windows 下的 `*.dll` 以及 macOS 下的 `*.dylib` . 这些模块一样需要在自己的代码底部利用 node 提供的宏 `NODE_MODULE`, `NODE_MODULE_INITIALIZER` 等进行注册。

### js 原生模块

这些模块在 node 项目中的 `lib/**/*.js` 以及 `dep/**/*.js` 位置。这些模块就是我们通过 node 的 api 引入的模块例如 `fs` , `http` 等，这些模块其实是将 c++模块包了一层暴露给用户调用，这些模块会在 node 项目编译的时候被利用 `[js2c.py](http://js2c.py)` 生成的 `node_javascript.cc` 打入 node 二进制文件中，所以这些文件调用的时候是没有 I/O 损耗的。

### js 用户模块

这部分模块是用户编写包含 npm 中的第三方模块，这些模块在引用时，这些模块就是通过 node 的 `fs` 模块进行加载，并且进入缓存。在 `/lib/internal/modules/cjs/loader.js`文件中我们可以看到如下代码，实际上我们的代码就是把这两块包裹这的一个闭包，node 借此实现了模块的功能。

```jsx
const wrapper = [
  "(function (exports, require, module, __filename, __dirname) { ",
  "\n});",
]
```

## 小结

因为刚学完 c++，所以就立马来看看相关的项目，正好看到死月的《Node.js: 来一打 C++扩展》，所以就拜读了一下。我的初衷本来是应该要熟悉 C++并且借机学点 node 的东西，但是看到后来发现自己深入到细节中去，而且死抠代码细节，所以这篇文章写起来感觉好像也没什么收获，我只是知道了一些事实，不知道为什么这么做，这么做的原因 o(╯□╰)o. 我打算应该多去了解些“为什么”，而不是“是什么”。
