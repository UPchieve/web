const isSocketDisconnectError = (err) =>
  err.message.includes('Socket.io connection for user')

export { isSocketDisconnectError }
