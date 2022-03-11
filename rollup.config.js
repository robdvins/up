import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import pkg from './package.json'

const entries = ['src/cli.ts', 'src/index.ts']

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {})
]

export default [
  {
    input: entries,
    output: { dir: 'dist', format: 'esm', sourcemap: 'inline' },
    external,
    plugins: [resolve({ preferBuiltins: true }), json(), commonjs(), esbuild({ target: 'node14' })]
  },
  {
    input: entries[1],
    output: { file: pkg.types, format: 'esm' },
    external,
    plugins: [dts({ respectExternal: true })]
  }
]
