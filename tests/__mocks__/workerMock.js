export default class Worker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onconnect = () => {}
    this.port = {
      start: () => {},
      postMessage: () => {},
      onmessage: () => {},
    }
  }
}
