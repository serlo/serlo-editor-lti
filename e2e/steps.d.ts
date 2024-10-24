/// <reference types='codeceptjs' />
type steps_file = typeof import('./steps_file')
type EdusharingHelper = import('./helpers/edusharing-helper')
type ItslearningHelper = import('./helpers/itslearning-helper')

declare namespace CodeceptJS {
  interface SupportObject {
    I: I
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current: any
  }
  interface Methods extends Playwright, EdusharingHelper, ItslearningHelper {}
  interface I extends ReturnType<steps_file>, WithTranslation<Methods> {}
  namespace Translation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Actions {}
  }
}
