import { Buffer } from 'buffer'
import exifremove from 'exifremove'
import * as Sentry from '@sentry/browser'

function checkIfPhotoIsAllowedType(file) {
  const allowedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
  if (allowedFormats.includes(file.type)) {
    throw new Error('We only allow .png, .jpeg, or .gif photos')
  }
}

function checkIfPhotoIsAllowedSize(file) {
  const tenMegaBytes = 10 * 1000000
  if (file.size > tenMegaBytes) {
    throw new Error(
      `This photo is too large. Please upload a photo less than 10mb.`
    )
  }
}

async function stripExifData(file) {
  const fileArrayBuffer = await file.arrayBuffer()
  const typedArray = new Uint8Array(fileArrayBuffer)
  // exifremove calls methods available on Node's Buffer object
  // so we use the buffer library to add those methods to a
  // pure javascript typed array
  const buffer = Buffer.from(typedArray)
  return exifremove.remove(buffer)
}

export async function validatePhoto(file) {
  checkIfPhotoIsAllowedType(file)

  checkIfPhotoIsAllowedSize(file)

  try {
    return await stripExifData(file)
  } catch (err) {
    Sentry.captureException(
      new Error(
        `Unable to remove identifying information from the image: ${err}`
      )
    )
    return file
  }
}
