import { v2 as cloudinary } from 'cloudinary'
import crypto from 'crypto'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

const LOCAL_PUBLIC_ID_PREFIX = 'local:'
const LOCAL_UPLOAD_ROOT = 'uploads'

function canUseLocalUploadFallback() {
  return process.env.NODE_ENV !== 'production' && process.env.LOCAL_UPLOAD_FALLBACK !== 'false'
}

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  )
}

function imageExtension(mimeType?: string) {
  switch (mimeType) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return 'jpg'
  }
}

function uploadErrorSummary(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code)
  }

  if (error instanceof Error && error.message) return error.message

  return 'Cloudinary unavailable'
}

async function uploadLocalCarPhoto(
  fileBuffer: Buffer,
  carId: string,
  mimeType?: string
): Promise<{ url: string; publicId: string }> {
  const fileName = `${crypto.randomUUID()}.${imageExtension(mimeType)}`
  const relativeDir = path.join(LOCAL_UPLOAD_ROOT, 'cars', carId)
  const relativePath = path.join(relativeDir, fileName)
  const fullDir = path.join(process.cwd(), 'public', relativeDir)
  const fullPath = path.join(process.cwd(), 'public', relativePath)

  await mkdir(fullDir, { recursive: true })
  await writeFile(fullPath, fileBuffer)

  const publicPath = relativePath.replace(/\\/g, '/')
  return {
    url: `/${publicPath}`,
    publicId: `${LOCAL_PUBLIC_ID_PREFIX}${publicPath}`,
  }
}

export async function uploadCarPhoto(
  fileBuffer: Buffer,
  carId: string,
  mimeType?: string
): Promise<{ url: string; publicId: string }> {
  if (!hasCloudinaryConfig() && canUseLocalUploadFallback()) {
    return uploadLocalCarPhoto(fileBuffer, carId, mimeType)
  }

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `gta-garage/cars/${carId}`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 900, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      .end(fileBuffer)
  }).catch(async (error) => {
    if (canUseLocalUploadFallback()) {
      console.warn(
        `[cloudinary:car-photo:fallback] ${uploadErrorSummary(error)}. Saved photo locally for development.`
      )
      return uploadLocalCarPhoto(fileBuffer, carId, mimeType)
    }

    throw error
  })
}

export async function uploadAvatar(
  fileBuffer: Buffer,
  userId: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `gta-garage/avatars`,
          public_id: `avatar_${userId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      .end(fileBuffer)
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  if (publicId.startsWith(LOCAL_PUBLIC_ID_PREFIX)) {
    const relativePath = publicId.slice(LOCAL_PUBLIC_ID_PREFIX.length)
    const publicRoot = path.resolve(process.cwd(), 'public')
    const fullPath = path.resolve(publicRoot, relativePath)

    if (!fullPath.startsWith(publicRoot + path.sep)) {
      throw new Error('Invalid local image path')
    }

    await unlink(fullPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
    return
  }

  await cloudinary.uploader.destroy(publicId)
}
