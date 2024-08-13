export const file2b64 = async (file) => {
  const fileReader = new FileReader()
  const promise = new Promise((resolve, reject) => {
    fileReader.addEventListener(
      'load',
      () => {
        const base64ImageSrc = fileReader.result?.toString()
        if (!base64ImageSrc) {
          reject('Could not convert file to base64, invalid mime type')
        } else {
          resolve(base64ImageSrc)
        }
      },
      false
    )
  })
  fileReader.readAsDataURL(file)
  return promise
}
