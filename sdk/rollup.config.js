import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Build ESM
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist'
      }),
      production && terser()
    ]
  },
  // Build UMD (navegador)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/analytics.umd.js',
      format: 'umd',
      name: 'CINAnalytics',
      sourcemap: true
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      production && terser()
    ]
  },
  // Build minificado para CDN
  {
    input: 'src/index.ts',
    output: {
      file: '../public/analytics/analytics.min.js',
      format: 'iife',
      name: 'CINAnalytics',
      sourcemap: true
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          properties: {
            regex: /^_/
          }
        }
      })
    ]
  }
];
