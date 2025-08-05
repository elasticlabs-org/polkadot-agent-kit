import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';

const config = [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: [
      '@modelcontextprotocol/sdk',
      '@polkadot-agent-kit/common',
      '@polkadot-agent-kit/core',
      '@polkadot-agent-kit/llm',
      '@polkadot-agent-kit/sdk',
      'polkadot-api',
      'zod',
    ],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: [
      '@modelcontextprotocol/sdk',
      '@polkadot-agent-kit/common',
      '@polkadot-agent-kit/core',
      '@polkadot-agent-kit/llm', 
      'polkadot-api',
      'zod',
    ],
  }
];

export default config; 