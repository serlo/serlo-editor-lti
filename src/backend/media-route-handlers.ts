import { createProxyMiddleware } from 'http-proxy-middleware'
import { readEnvVariable } from './read-env-variable'

const targetUrl = new URL(
  readEnvVariable('S3_ENDPOINT') + readEnvVariable('BUCKET_NAME')
).href

/**
 * Minimal proxy implementation for media assets.
 * Requests to editor.{domain}/media/… are proxied to the bucket for the current environment.
 * We do this so the urls of the image don't need to change if we change our bucket.
 * It could also allow us to setup additional restictions in the future.
 */
export const mediaProxy = createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  pathFilter: (path) => path.startsWith('/media'),
  pathRewrite: { '^/media': '' },
})
