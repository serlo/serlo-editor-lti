// Hard coded type because the type provided by @types/ltijs is outdated
// TODO: Use type provided by ltijs instead once it is included or extend this one with additional properties
export interface IdToken {
  platformContext: {
    custom: {
      id: string
    }
    resource: {
      id: string
    }
    roles?: string[]
    context: {
      title: string
    }
  }
  iss: string
}
