/// <reference types='codeceptjs' />
type steps = typeof import('./steps')

declare namespace CodeceptJS {
  interface SupportObject {
    I: I
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current: any
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Methods extends Playwright {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface I extends ReturnType<steps> {}
  namespace Translation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Actions {}
  }
}
