function fileDownload(data, fileName) {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  URL.revokeObjectURL(url)
}

export default fileDownload
