<div align="center">
  <article style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <p align="center"><img width="300" src="./images/labelU-logo.svg" /></p>
      <p>LabelU front-end annotation component library, supporting 2D box、point、line、polygon tools, supporting the combination of multiple tools. It can be used for labeling platform， out of the box</p>
  </article>
  English | <a href="./README.md">简体中文</a>
</div>

## feature

- Rollup esbuild plug-in and vite compilation are used to make developers develop more efficiently.
- Multi project management with lerna.
- Reasonable code layering：
  - @label-u/utils provides Software Internationalization 。
  - @label-u/annotation is a tool layer，which mainly realizes the encapsulation of annotation capabilities, and provides AnnotationEngine for calling annotation capabilities.
  - @label-u/components realizes annotation capability integration. As a directly exposed annotation component, users can realize annotation interface by configuring AnnotationOperation, supporting multi tool annotation, and annotation result visualization (Currently, mainly for image annotation, video, audio, text and point cloud are also under development).

## Install

(node version >= 14.8.0)

```bash
# pnpm
pnpm install
```

## Usage

[Development documents](https://opendatalab.github.io/labelU-Kit)。

## Thank

This project refers to and relies on the project: [labelbee](https://github.com/open-mmlab/labelbee), we would like to thank authors of labelbee.

## License

This project is released under the [Apache 2.0 license](./LICENSE).
