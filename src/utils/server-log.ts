export function serverLog(...args: Parameters<typeof console.log>) {
  // eslint-disable-next-line no-console
  console.log(...args)
}
