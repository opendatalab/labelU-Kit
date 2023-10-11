<div align="center">
  <article style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <p align="center"><img width="300" src="./images/labelU-logo.svg" /></p>
      <p>LabelU前端标注组件库，支持图片2D框、点、线、多边形及混合标注工具，可用于标注平台开发集成，开箱即用。</p>
  </article>
  <a href="./README_en-US.md">English</a> | 简体中文

</div>

## 特性

- 采用 rollup esbuild 插件及 vite 编译，开发效率更高
- 采用 pnpm 进行多工程管理。
- 合理的代码分层：
  - @labelu/utils 提供国际化能力。
  - @labelu/annotation 作为工具层，主要实现标注能力的封装，此外提供 AnnotationEngine 用于调用标注能力。
  - @labelu/components 实现标注能力集成，作为直接暴露在外的标注组件，使用者通过对 AnnotationOperation 的配置即可实现标注界面,支持多工具标注，支持标注结果可视化（目前主要是针对图片标注，视频，音频，文本和点云也在开发当中）
  - @labelu/frontend 提供一个开箱即用的标注服务，基于@labelu/components 暴露组件实现，并提供模板供用户参考和标注界面预览。

## 安装

(node 版本 >= 14.8.0)

```bash
# pnpm
pnpm install
```

### 启动开发环境

```bash
cd apps/frontend
npm start
```

## 使用

[详细开发文档](https://opendatalab.github.io/labelU-Kit)。

## 致谢

本项目参考并依赖了[labelbee](https://github.com/open-mmlab/labelbee)项目，在此对 labelbee 的作者表示感谢。

## 许可证

此项目是根据 Apache 2.0 许可证发布的
