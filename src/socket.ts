import { io } from 'socket.io-client'
import config from './config'
import { getClientUUID } from './services/PresenceService'

export const socket = io(config.socketAddress, {
  autoConnect: false,
  withCredentials: true,
  query: {
    clientUUID: getClientUUID(),
  },
})
