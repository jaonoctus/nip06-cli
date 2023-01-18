import type { Options } from 'tsup'

export const tsup: Options = {
  splitting: false,
  clean: true,
  format: ['esm'],
  minify: true,
  bundle: true,
  noExternal: ['fuzzy', '@scure/bip39'],
  entry: ['src/**/*.ts'],
  target: 'es2020',
  outDir: 'lib'
}
