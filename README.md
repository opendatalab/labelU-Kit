<div align="center">
  <article style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <p align="center"><img width="300" src="./images/labelU-logo.svg" /></p>
      <p>LabelU前端标注组件库，支持图片2D框、点、线、多边形及混合标注工具，可用于标注平台开发集成，开箱即用。</p>
  </article>
  <a href="./README_en-US.md">English</a> | 简体中文

</div>

## 特性

- 📝本项目包含@label-u/annotation、@label-u/components、@label-u/utils及@label-u/web等4个工程。

- 📝采用rollup esbuild插件及vite编译，让开发者上高速，开发效率更高

- 📝采用lerna进行多工程管理。

- 📝合理的代码分层：

  - 📝@label-u/utils提供国际化能力。

  - 📝@label-u/annotation作为工具层，主要实现标注能力的封装，此外提供AnnotationEngine用于调用标注能力。

  - 📝@label-u/components实现标注能力集成，作为直接暴露在外的标注组件，使用者通过对AnnotationOperation的配置即可实现标注界面,支持多工具标注，支持标注结果可视化（目前主要是针对图片标注，视频，音频，文本和点云也在开发当中）

  - 📝@label-u/web提供一个开箱即用的标注服务，基于@label-u/components暴露组件实现，支持对工具的yaml和可视化配置，并提供模板供用户参考和标注界面预览。

## 安装

```bash
# npm
npm install lerna -g
npm install
npm run bootstrap
npm run build
npm run start

```


## 使用

[详细开发文档](https://opendatalab.github.io/labelU-Kit)。

## 致谢


我们在开发此款标注工具时，参考并依赖了[labelbee](https://github.com/open-mmlab/labelbee)项目，在此对labelbee的作者表示感谢。

## 许可证

此项目是根据Apache 2.0许可证发布的
