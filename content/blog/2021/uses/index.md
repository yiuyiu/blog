---
title: uses
date: "2021-03-09"
description: 我使用的工具
---
受[wesbos](https://wesbos.com/uses)启发，记录下我使用的工具以及这些工具对应的插件

## Eidtor + Terminal
### Visual Studio Code
代码编辑器，由于开源且插件生态丰富所以现在是我的首选，我写了个插件[remove unused style](https://marketplace.visualstudio.com/items?itemName=xixi.remove-unused-style)
### Fira Code
我使用[Fira Code](https://github.com/tonsky/FiraCode)代码字体，这是免费的，在vscode中配置的使用时我使用如下配置
```json
{
    "editor.fontFamily": "'Fira Code',Menlo, Monaco, 'Courier New', monospace",
    "editor.fontLigatures": true
}
```
### iterm2
iterm2是mac默认的terminal的替代物，我常用的功能有
- `CMD+D`, `CMD+SHIFT+D`分隔当前视窗，`CMD+[`, `OPTION+number`, `CMD+number`切换
- 设置热键可以唤起iterm2置顶或者取消. 
  Preferences->Keys->Hotkey
- `CMD+F`可以在整个窗口中进行搜索，包含不在当前视口的内容。
- 状态栏，我在状态栏上设置了node版本
  Preferences->Profiles->Session->Status->Configurate Status Bar 拖拽`\(expression)`组件，里面输入`Node: \(user.nodeVersion)`
### zsh
mac在Catalina版本默认的shell已经从bash切换到了[zsh](https://github.com/ohmyzsh/ohmyzsh/wiki/Installing-ZSH).
我常用到的zsh命令。
- `take`
```shell
take foo
# 相当于 mkdir foo; cd foo
``` 
- `ctrl+r`
可以搜索某个包含某个关键字的命令，上下键进行切换
- `ctrl+q`
有时你敲某些命令时发现自己忘了执行另一个命令时，这时可以执行这个，它会在你当前命令执行完，将`ctrl+q`前的内容再填充到输入处
- `ctrl+l`
清空terminal.可以取代`clear`命令。
#### oh-my-zsh
[oh-my-zsh](https://github.com/ohmyzsh/ohmyzsh)是用于便捷的配置zsh的工具。下面讲下我用到的zsh的[插件](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)
- [thems](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes), 配合iterm2的[color scheme](https://iterm2colorschemes.com/)更好看👀
- [git](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/git)
插件提供了很多常用的git命令的别名，另外自己可以在`.zshrc`中配置alias, 自己配置的会覆盖掉git插件中的配置。比如我就配置了`git add .`为`ga`.
- [autojump](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/autojump)
可以在各个目录之间跳转，只要被访问过的目录都会被记录进历史里。
- [web-page](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/web-search)
各个搜索引擎的别名,包括google, Wiki, Bing, YouTube
```shell
web_search google oh-my-zsh
google oh-my-zsh
```
#### other cli tools
- [htop](https://github.com/htop-dev/htop)
交互式进程查看，可以查看进程启动的命令，查看内存以及CPU的消耗。
- [tree](https://github.com/MrRaindrop/tree-cli)
列出文件夹结构，可以在node使用。
- [lnav](https://docs.lnav.org/en/latest/intro.html)
查看log文件时增加配色

## Desktop Apps
### Magnet
一个桌面窗口管理软件，可以将当前窗口放入桌面的任何位置
### GifCapture
[gifCapture](https://github.com/onmyway133/GifCapture)mac上录制屏幕生成gif

## Web apps
### carbon
[carbon](https://carbon.now.sh/)
## 参考
- [zsh-tricks](https://www.twilio.com/blog/zsh-tricks-to-blow-your-mind)
- [wes bos uses](https://wesbos.com/uses)
- [boost-your-productivity-by-using-the-terminal-iterm-and-zsh/](https://www.mokkapps.de/blog/boost-your-productivity-by-using-the-terminal-iterm-and-zsh/)
