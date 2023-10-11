<div align="center">
  <article style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <p align="center"><img width="300" src="./images/labelU-logo.svg" /></p>
      <p>LabelU front-end annotation component library, supporting 2D box、point、line、polygon tools, supporting the combination of multiple tools. It can be used for labeling platform， out of the box</p>
  </article>
  English | <a href="./README.md">简体中文</a>
</div>

## Features

- Supports 2D bounding box, point, line, and polygon annotation for images
- Supports video annotation
- Supports audio annotation
- Modular components that can be freely combined

## Getting Started

- Try online: [https://labelu.shlab.tech/](https://labelu.shlab.tech/)
- Offline installation: [https://github.com/opendatalab/labelU/](https://github.com/opendatalab/labelU#install-locally-with-miniconda)
- Documentation: [https://opendatalab.github.io/labelU-Kit](https://opendatalab.github.io/labelU-Kit)

## Packages

| Name | Version | Description |
| --- | --- | --- |
| [@labelu/annotation](./packages/annotation) | [![npm](https://img.shields.io/npm/v/%40labelu/annotation.svg)](https://www.npmjs.com/package/@labelu/annotation) | 2d annotation engine（fork 自 [labelbee](https://github.com/open-mmlab/labelbee)） |
| [@labelu/components](./packages/components) | [![npm](https://img.shields.io/npm/v/%40labelu/components.svg)](https://www.npmjs.com/package/@labelu/components) | React components for 2d annotator（fork 自 [labelbee](https://github.com/open-mmlab/labelbee)） |
| [@labelu/interface](./packages/interface) | [![npm](https://img.shields.io/npm/v/%40labelu/interface.svg)](https://www.npmjs.com/package/@labelu/interface) | Basic TypeScript interfaces for annotators |
| [@labelu/components-react](./packages/components-react) | [![npm](https://img.shields.io/npm/v/%40labelu/components-react.svg)](https://www.npmjs.com/package/@labelu/components-react) | Basic React components for another packages |
| [@labelu/audio-react](./packages/audio-react) | [![npm](https://img.shields.io/npm/v/%40labelu/audio-react.svg)](https://www.npmjs.com/package/@labelu/audio-react) | Basic React components for Audio annotator |
| [@labelu/audio-annotator-react](./packages/audio-annotator-react) | [![npm](https://img.shields.io/npm/v/%40labelu/audio-annotator-react.svg)](https://www.npmjs.com/package/@labelu/audio-annotator-react) | Audio annotator for React |
| [@labelu/video-react](./packages/video-react) | [![npm](https://img.shields.io/npm/v/%40labelu/video-react.svg)](https://www.npmjs.com/package/@labelu/video-react) | Basic React components for Video annotator |
| [@labelu/video-annotator-react](./packages/video-annotator-react) | [![npm](https://img.shields.io/npm/v/%40labelu/video-annotator-react.svg)](https://www.npmjs.com/package/@labelu/video-annotator-react) | Video annotator for React |
| [@labelu/utils](./packages/utils) | [![npm](https://img.shields.io/npm/v/%40labelu/utils.svg)](https://www.npmjs.com/package/@labelu/utils) | utils for another packages |

## License

This project is released under the Apache 2.0 license.
