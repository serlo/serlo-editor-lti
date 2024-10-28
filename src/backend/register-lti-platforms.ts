import { Provider as ltijs } from 'ltijs'
import { edusharingMockClientId } from '../edusharing-mock/server'
import { edusharingAsToolConfigs } from './edusharing/get-edusharing-as-tool-configuration'
import { serverLog } from '../utils/server-log'
import config from '../utils/config'

export async function registerLtiPlatforms() {
  // Register platform: saltire
  if (config.ALLOW_SALTIRE) {
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
    serverLog(`Registered platform: saltire`)
  }

  // Register platform: itslearning
  if (config.ENVIRONMENT === 'staging') {
    const itsLearningPlatform = await ltijs.registerPlatform({
      url: config.ITSLEARNING_URL, // LTI iss
      name: config.ITSLEARNING_NAME,
      clientId: config.SERLO_EDITOR_CLIENT_ID_ON_ITSLEARNING,
      authenticationEndpoint: config.ITSLEARNING_AUTHENTICATION_ENDPOINT,
      accesstokenEndpoint: config.ITSLEARNING_ACCESS_TOKEN_ENDPOINT,
      authConfig: {
        method: 'JWK_SET',
        key: config.ITSLEARNING_KEYSET_ENDPOINT,
      },
    })
    if (itsLearningPlatform) {
      serverLog('Registered platform: itslearning')
    }

    // Register platform: edu-sharing (RLP)
    const eduSharingPlatform = await ltijs.registerPlatform({
      url: config.EDUSHARING_RLP_URL, // LTI iss
      name: config.EDUSHARING_RLP_NAME,
      clientId: config.SERLO_EDITOR_CLIENT_ID_ON_EDUSHARING_RLP,
      authenticationEndpoint: config.EDUSHARING_RLP_AUTHENTICATION_ENDPOINT,
      accesstokenEndpoint: config.EDUSHARING_RLP_ACCESS_TOKEN_ENDPOINT,
      authConfig: {
        method: 'JWK_SET',
        key: config.EDUSHARING_RLP_KEYSET_ENDPOINT,
      },
    })
    if (eduSharingPlatform) {
      edusharingAsToolConfigs.push({
        issWhenEdusharingLaunchedSerloEditor: config.EDUSHARING_RLP_URL,
        loginEndpoint: config.EDUSHARING_RLP_LOGIN_ENDPOINT,
        launchEndpoint: config.EDUSHARING_RLP_LAUNCH_ENDPOINT,
        clientId: config.EDUSHARING_RLP_CLIENT_ID_ON_SERLO_EDITOR,
        detailsEndpoint: config.EDUSHARING_RLP_DETAILS_ENDPOINT,
        keysetEndpoint: config.EDUSHARING_RLP_KEYSET_ENDPOINT,
      })
      serverLog('Registered platform: edu-sharing (RLP)')
    }
  }

  // Register platform: edusharing mock
  if (config.ALLOW_EDUSHARING_MOCK) {
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
        key: 'http://localhost:8100/edu-sharing/rest/lti/v13/jwks',
      },
    })
    edusharingAsToolConfigs.push({
      issWhenEdusharingLaunchedSerloEditor: 'http://localhost:8100/edu-sharing',
      loginEndpoint:
        'http://localhost:8100/edu-sharing/rest/lti/v13/oidc/login_initiations',
      launchEndpoint: 'http://localhost:8100/edu-sharing/rest/lti/v13/lti13',
      clientId: edusharingMockClientId,
      detailsEndpoint: 'http://localhost:8100/edu-sharing/rest/lti/v13/details',
      keysetEndpoint: 'http://localhost:8100/edu-sharing/rest/lti/v13/jwks',
    })
    if (platform) {
      serverLog(`Registered platform: edusharing-mock`)
    }
  }

  // Register platform: edusharing (local docker)
  // if (config.ALLOW_LOCAL_EDUSHARING) {
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
  //       // key: 'http://localhost:8100/edu-sharing/rest/lti/v13/jwks',
  //       key: 'https://serlo-edusharing_repository-service_1:8080/edu-sharing/rest/lti/v13/jwks',
  //       // key: 'http://repository-service:8080/edu-sharing/rest/lti/v13/jwks',
  //     },
  //   })
  //   if (platform) {
  //     serverLog(`Registered platform: edusharing-local-docker`)
  //   }
  // }
}
