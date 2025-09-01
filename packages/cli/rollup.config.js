import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import * as fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const external = Object.keys(pkg.dependencies ?? {}).concat(['fs/promises'])


export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'esm',
    },
    external,
    plugins: [
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: ['.ts', '.tsx'],
        presets: [
          ['@babel/preset-env', { targets: { node: '18' } }],
        ],
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
    },
    external,
    plugins: [
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: ['.ts', '.tsx'],
        presets: [
          ['@babel/preset-env', { targets: { node: '18' } }],
        ],
      }),
    ],
  },
];