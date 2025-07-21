import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import dts from 'rollup-plugin-dts';

const external = [
  '@polkadot-agent-kit/sdk',
  '@polkadot-agent-kit/llm',
  '@polkadot-agent-kit/core',
  '@polkadot-agent-kit/common',
  'commander',
  'inquirer',
  'chalk',
  'ora',
  'zod',
  'open',
  'fs-extra',
  'lodash',
  'table',
  'boxen',
  'conf',
  'readline',
  'path',
  'os',
  'fs',
  'util',
  'crypto',
  'events',
  'stream',
  'url',
  'buffer',
  'process'
];

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
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
      sourcemap: true,
      exports: 'named',
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
  // Type definitions
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external,
    plugins: [dts()],
  },
];
