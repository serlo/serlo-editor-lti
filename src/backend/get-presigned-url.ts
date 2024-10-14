import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v1 as uuidv1 } from 'uuid'

const supportedMimeTypes = ['gif', 'jpeg', 'png', 'svg+xml', 'webp'] as const
type SupportedMimeType = (typeof supportedMimeTypes)[number]

// minIO test credentials as fallback
const bucket = process.env.BUCKET_NAME ?? 'serlo-test-bucket'

const s3Client = new S3Client({
  region: process.env.BUCKET_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID ?? 'Q3AM3UQ867SPQQA43P2F',
    secretAccessKey:
      process.env.BUCKET_SECRET_ACCESS_KEY ??
      'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
  },
  endpoint: process.env.BUCKET_ENDPOINT ?? 'https://play.min.io:9000',
  forcePathStyle: true, // test, maybe only set on dev
})

const srcPrefix =
  process.env.BUCKET_PUBLIC_SRC_PREFIX ?? `https://play.min.io:9000/${bucket}/`

export const getPresignedUrl = async (mimeTypePart: SupportedMimeType) => {
  const fullMimeType = `image/${mimeTypePart}`
  const fileHash = uuidv1()
  const fileExtension = mimeTypePart === 'svg+xml' ? 'svg' : mimeTypePart
  const fileName = `${fileHash}.${fileExtension}`

  const params: PutObjectCommandInput = {
    Key: `${fileHash}.${fileExtension}`,
    Bucket: bucket,
    ContentType: fullMimeType,
    Metadata: { 'Content-Type': fullMimeType },
  }

  const command = new PutObjectCommand(params)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  const imgSrc = `${srcPrefix}${fileName}`
  return { signedUrl, imgSrc }
}

export function isValidMimeType(
  mimeType: string
): mimeType is SupportedMimeType {
  if (typeof mimeType !== 'string') return false
  return supportedMimeTypes.includes(mimeType as SupportedMimeType)
}
