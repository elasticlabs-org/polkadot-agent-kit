import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

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
      '@polkadot-agent-kit/llm',
      '@polkadot-agent-kit/sdk',
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
      '@polkadot-agent-kit/llm', 
      'zod',
    ],
  }
];

export default config; 