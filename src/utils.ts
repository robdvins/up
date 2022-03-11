import pc from 'picocolors'

export const isEmptyArray = (arr: any[]): boolean => Array.isArray(arr) && !arr.length

export function terminate(msg: string): void {
  console.log(pc.red(msg))
  process.exit(1)
}
