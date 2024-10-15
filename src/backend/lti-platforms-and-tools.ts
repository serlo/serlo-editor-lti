import { Provider as ltijs } from 'ltijs'
import { edusharingMockClientId } from '../edusharing-mock/server'

const edusharingAsToolConfigs: {
  issWhenEdusharingLaunchedSerloEditor: string
  loginEndpoint: string
  launchEndpoint: string
  clientId: string
  detailsEndpoint: string
  keysetEndpoint: string
}[] = []

/** Gets the endpoints and clientId for an edu-sharing instance used as an LTI tool during embed of edu-sharing content
 * Function accepts issWhenEdusharingLaunchedSerloEditor or edusharingClientIdOnSerloEditor because during the LTI flow we have either one or the other available to us.
 */
export function getEdusharingAsToolConfiguration(
  entryToFind:
    | { issWhenEdusharingLaunchedSerloEditor: string }
    | { edusharingClientIdOnSerloEditor: string }
) {
  const edusharingAsToolConfig = edusharingAsToolConfigs.find((config) => {
    if ('issWhenEdusharingLaunchedSerloEditor' in entryToFind)
      return (
        config.issWhenEdusharingLaunchedSerloEditor ===
        entryToFind.issWhenEdusharingLaunchedSerloEditor
      )
    else {
      return config.clientId === entryToFind.edusharingClientIdOnSerloEditor
    }
  })
  return edusharingAsToolConfig
}

export async function ltiRegisterPlatformsAndTools() {
  // Register platform: saltire
  if (process.env.ALLOW_SALTIRE === 'true') {
    await ltijs.registerPlatform({
      url: 'https://saltire.lti.app/platform', // LTI iss
      name: 'saltire.lti.app',
      clientId: 'saltire.lti.app',
      authenticationEndpoint: 'https://saltire.lti.app/platform/auth',
      accesstokenEndpoint:
        'https://saltire.lti.app/platform/token/sc24671cd70c6e45554e6c405a2f5d966',
      authConfig: {
        method: 'JWK_SET',
        key: 'https://saltire.lti.app/platform/jwks/sc24671cd70c6e45554e6c405a2f5d966',
      },
    })
    console.log(`Registered platform: saltire`)
  }

  // Register platform: itslearning
  if (
    process.env.ITSLEARNING_URL &&
    process.env.ITSLEARNING_NAME &&
    process.env.SERLO_EDITOR_CLIENT_ID_ON_ITSLEARNING &&
    process.env.ITSLEARNING_AUTHENTICATION_ENDPOINT &&
    process.env.ITSLEARNING_ACCESS_TOKEN_ENDPOINT &&
    process.env.ITSLEARNING_KEYSET_ENDPOINT
  ) {
    const platform = await ltijs.registerPlatform({
      url: process.env.ITSLEARNING_URL, // LTI iss
      name: process.env.ITSLEARNING_NAME,
      clientId: process.env.SERLO_EDITOR_CLIENT_ID_ON_ITSLEARNING,
      authenticationEndpoint: process.env.ITSLEARNING_AUTHENTICATION_ENDPOINT,
      accesstokenEndpoint: process.env.ITSLEARNING_ACCESS_TOKEN_ENDPOINT,
      authConfig: {
        method: 'JWK_SET',
        key: process.env.ITSLEARNING_KEYSET_ENDPOINT,
      },
    })
    if (platform) {
      console.log('Registered platform: itslearning')
    }
  }

  // Register platform: edu-sharing (RLP)
  if (
    process.env.EDUSHARING_RLP_URL &&
    process.env.EDUSHARING_RLP_NAME &&
    process.env.SERLO_EDITOR_CLIENT_ID_ON_EDUSHARING_RLP &&
    process.env.EDUSHARING_RLP_AUTHENTICATION_ENDPOINT &&
    process.env.EDUSHARING_RLP_ACCESS_TOKEN_ENDPOINT &&
    process.env.EDUSHARING_RLP_KEYSET_ENDPOINT &&
    process.env.EDUSHARING_RLP_LOGIN_ENDPOINT &&
    process.env.EDUSHARING_RLP_LAUNCH_ENDPOINT &&
    process.env.EDUSHARING_RLP_CLIENT_ID_ON_SERLO_EDITOR &&
    process.env.EDUSHARING_RLP_DETAILS_ENDPOINT
  ) {
    const platform = await ltijs.registerPlatform({
      url: process.env.EDUSHARING_RLP_URL, // LTI iss
      name: process.env.EDUSHARING_RLP_NAME,
      clientId: process.env.SERLO_EDITOR_CLIENT_ID_ON_EDUSHARING_RLP,
      authenticationEndpoint:
        process.env.EDUSHARING_RLP_AUTHENTICATION_ENDPOINT,
      accesstokenEndpoint: process.env.EDUSHARING_RLP_ACCESS_TOKEN_ENDPOINT,
      authConfig: {
        method: 'JWK_SET',
        key: process.env.EDUSHARING_RLP_KEYSET_ENDPOINT,
      },
    })
    if (platform) {
      edusharingAsToolConfigs.push({
        issWhenEdusharingLaunchedSerloEditor: process.env.EDUSHARING_RLP_URL,
        loginEndpoint: process.env.EDUSHARING_RLP_LOGIN_ENDPOINT,
        launchEndpoint: process.env.EDUSHARING_RLP_LAUNCH_ENDPOINT,
        clientId: process.env.EDUSHARING_RLP_CLIENT_ID_ON_SERLO_EDITOR,
        detailsEndpoint: process.env.EDUSHARING_RLP_DETAILS_ENDPOINT,
        keysetEndpoint: process.env.EDUSHARING_RLP_KEYSET_ENDPOINT,
      })
      console.log('Registered platform: edu-sharing (RLP)')
    }
  }

  // Register platform: edusharing mock
  if (process.env.ALLOW_EDUSHARING_MOCK) {
    const platform = await ltijs.registerPlatform({
      url: 'http://localhost:8100/edu-sharing', // LTI iss
      name: 'edusharing-mock',
      clientId: 'piQ0JV8O880ZrVt', // The ID for this LTI tool on the LTI platform
      authenticationEndpoint:
        'http://localhost:8100/edu-sharing/rest/ltiplatform/v13/auth',
      accesstokenEndpoint:
        'http://localhost:8100/edu-sharing/rest/ltiplatform/v13/token',
      authConfig: {
        method: 'JWK_SET',
        key: 'http://host.docker.internal:8100/edu-sharing/rest/lti/v13/jwks',
      },
    })
    edusharingAsToolConfigs.push({
      issWhenEdusharingLaunchedSerloEditor: 'http://localhost:8100/edu-sharing',
      loginEndpoint:
        'http://localhost:8100/edu-sharing/rest/lti/v13/oidc/login_initiations',
      launchEndpoint: 'http://localhost:8100/edu-sharing/rest/lti/v13/lti13',
      clientId: edusharingMockClientId,
      detailsEndpoint:
        'http://host.docker.internal:8100/edu-sharing/rest/lti/v13/details',
      keysetEndpoint:
        'http://host.docker.internal:8100/edu-sharing/rest/lti/v13/jwks',
    })
    if (platform) {
      console.log(`Registered platform: edusharing-mock`)
    }
  }

  // Register platform: edusharing (local docker)
  // if (process.env.ALLOW_LOCAL_EDUSHARING) {
  //   const platform = await ltijs.registerPlatform({
  //     url: 'http://localhost:8100/edu-sharing', // LTI iss
  //     name: 'Platform', // TODO: Change
  //     clientId: 'aZZDRp40gsj459a', // The ID for this LTI tool on the LTI platform
  //     authenticationEndpoint:
  //       'http://localhost:8100/edu-sharing/rest/ltiplatform/v13/auth',
  //     accesstokenEndpoint:
  //       'http://localhost:8100/edu-sharing/rest/ltiplatform/v13/token',
  //     authConfig: {
  //       method: 'JWK_SET',
  //       // key: 'http://host.docker.internal:8100/edu-sharing/rest/lti/v13/jwks',
  //       key: 'https://serlo-edusharing_repository-service_1:8080/edu-sharing/rest/lti/v13/jwks',
  //       // key: 'http://repository-service:8080/edu-sharing/rest/lti/v13/jwks',
  //     },
  //   })
  //   if (platform) {
  //     console.log(`Registered platform: edusharing-local-docker`)
  //   }
  // }
}
