import esbuild from 'rollup-plugin-esbuild';
import image from '@rollup/plugin-image';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import path from 'path';

const customResolver = resolve({
  extensions: ['.tsx', '.ts', 'scss'],
});

const projectRootDir = path.resolve(__dirname);

const CJS_OUTPUT_DIR = 'dist';
const ES_OUTPUT_DIR = 'es';
const TYPE_OUTPUT_DIR = 'dist/types';
const isProd = process.env.NODE_ENV === 'production';

const esbuildPlugin = () =>
  esbuild({
    // All options are optional
    include: /\.[jt]s?x?$/, // default, inferred from `loaders` option
    exclude: /node_modules/, // default
    minify: isProd,
    target: 'es2015', // default, or 'es20XX', 'esnext'
    define: {
      __VERSION__: '"x.y.z"',
    },
    tsconfig: 'tsconfig.json', // default
    // Add extra loaders
    loaders: {
      // Add .json files support
      // require @rollup/plugin-commonjs
      '.json': 'json',
      // Enable JSX in .js files too
      '.js': 'jsx',
    },
  });

const commonPlugin = [
  alias({
    entries: [
      { find: '@', replacement: path.resolve(projectRootDir, './src') },
      { find: 'src', replacement: path.resolve(projectRootDir, './src') },
    ],
    customResolver,
  }),
  image(),
];

export default () => {
  return [
    // {
    //   input: 'src/index.tsx',
    //   output:    {
    //     format: 'cjs',
    //     dir: CJS_OUTPUT_DIR,
    //     preserveModules: true,
    //     preserveModulesRoot: 'src',
    //   },
    //   plugins: [...commonPlugin, esbuildPlugin()],
    //   external: ['react', 'antd'],
    // },
    {
      input: 'src/index.tsx',
      output: {
        format: 'es',
        dir: CJS_OUTPUT_DIR,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      plugins: [...commonPlugin, esbuildPlugin()],
      external: ['react', 'antd'],
    },
    {
      input: 'src/index.tsx',
      output: {
        format: 'es',
        dir: TYPE_OUTPUT_DIR,
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      plugins: [...commonPlugin, dts()],
      external: ['react', 'antd', '@ant-design/icons'],
    },
  ];
};
