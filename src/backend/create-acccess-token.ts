import jwt from 'jsonwebtoken'

export function createAccessToken(
  editorMode: 'read' | 'write',
  entityId: number,
  signingKey: string
) {
  return jwt.sign(
    {
      entityId: entityId,
      accessRight: editorMode,
    },
    signingKey,
    { expiresIn: '3 days' }
  )
}
