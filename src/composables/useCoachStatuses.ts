import { ref, onMounted, onUnmounted } from 'vue'
import { socket } from '@/socket'

export type CoachStatus = 'online' | 'in-session' | 'offline'

type CoachStatusesResponse = {
  statuses?: Record<string, CoachStatus>
  error?: string
}

export function useCoachStatuses() {
  const statuses = ref<Record<string, CoachStatus>>({})
  const isLoading = ref(false)
  const hasStatusError = ref(false)
  let latestPendingReply: Promise<CoachStatusesResponse> | undefined

  async function fetchStatuses(
    event: 'coach-status:join' | 'coach-status:get'
  ) {
    if (!socket.connected) return

    const pendingStatusReply: Promise<CoachStatusesResponse> = socket
      .timeout(5000)
      .emitWithAck(event)
    latestPendingReply = pendingStatusReply
    isLoading.value = true
    hasStatusError.value = false

    try {
      const response = await pendingStatusReply

      // Ignore this reply if we've started another request or left the page
      if (pendingStatusReply !== latestPendingReply) return

      if (response?.statuses) {
        statuses.value = response.statuses
        hasStatusError.value = false
      } else {
        statuses.value = {}
        hasStatusError.value = true
      }
    } catch {
      // An old request failing shouldn't clear newer statuses
      if (pendingStatusReply !== latestPendingReply) return

      statuses.value = {}
      hasStatusError.value = true
    } finally {
      // If there's a newer request, let it finish its own loading state
      if (pendingStatusReply === latestPendingReply) {
        isLoading.value = false
      }
    }
  }

  function joinCoachStatusRooms() {
    fetchStatuses('coach-status:join')
  }

  function fetchCurrentStatuses() {
    fetchStatuses('coach-status:get')
  }

  function handleDisconnect() {
    latestPendingReply = undefined

    statuses.value = {}
    isLoading.value = false
    hasStatusError.value = true
  }

  function handleTabVisible() {
    // Browsers can pause background tabs. Check current values on return.
    if (document.visibilityState === 'visible') {
      fetchCurrentStatuses()
    }
  }

  onMounted(() => {
    socket.on('connect', joinCoachStatusRooms)
    socket.on('disconnect', handleDisconnect)
    socket.on('coaches:status-changed', fetchCurrentStatuses)
    document.addEventListener('visibilitychange', handleTabVisible)

    if (socket.connected) {
      joinCoachStatusRooms()
    } else {
      hasStatusError.value = true
    }
  })

  onUnmounted(() => {
    latestPendingReply = undefined

    if (socket.connected) {
      socket.emit('coach-status:leave')
    }

    socket.off('connect', joinCoachStatusRooms)
    socket.off('disconnect', handleDisconnect)
    socket.off('coaches:status-changed', fetchCurrentStatuses)

    document.removeEventListener('visibilitychange', handleTabVisible)
  })

  return { statuses, isLoading, hasStatusError }
}
