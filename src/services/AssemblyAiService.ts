import AudioProcessor from './AudioProcessor'
import LoggerService from './LoggerService'
import NetworkService from '@/services/NetworkService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const audioController = new AudioProcessor()

let ws: WebSocket | null = null

async function attemptStart(
  mediaStream: MediaStream,
  onTranscription: (transcript: string, type: 'partial' | 'final') => void,
  attempt: number
): Promise<boolean> {
  const token = await getToken()

  await audioController.start(mediaStream)

  return new Promise((resolve) => {
    const CONNECTION_PARAMS = {
      sample_rate: audioController.getSampleRate(),
      speech_model: 'universal-streaming-english',
      min_turn_silence: 300,
      max_turn_silence: 1500,
      format_turns: true,
      token,
    }

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(CONNECTION_PARAMS)) {
      params.append(key, String(value))
    }

    LoggerService.info('Starting AssemblyAi websocket', {
      attempt,
      hasToken: !!token,
      tokenLength: token?.length,
      sampleRate: audioController.getSampleRate(),
    })

    const socket = new WebSocket(`wss://stt.upchieve.org/ws?${params}`)
    ws = socket

    let settled = false

    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    socket.onopen = async () => {
      LoggerService.info('AssemblyAi websocket is opened', { attempt })

      audioController.setOnAudioFrameHandler((audioFrame) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(audioFrame)
        }
      })

      setTimeout(() => {
        finish(socket.readyState === WebSocket.OPEN)
      }, 600)
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.error) {
        LoggerService.noticeError(
          new Error('AssemblyAi had an expected error'),
          {
            ...data,
          }
        )
      }

      if (data.type !== 'Turn') return
      if (!data.transcript?.trim()) return

      AnalyticsService.captureEvent(EVENTS.ASSEMBLY_AI_TRANSCRIPTION_SUCCESS)

      if (data.end_of_turn && data.turn_is_formatted) {
        onTranscription(data.transcript, 'final')
      } else if (!data.end_of_turn) {
        onTranscription(data.transcript, 'partial')
      }
    }

    socket.onclose = (event) => {
      AnalyticsService.captureEvent(EVENTS.ASSEMBLY_AI_TRANSCRIPTION_CLOSED, {
        websocketEvent: {
          reason: event.reason,
          code: event.code,
          wasClean: event.wasClean,
        },
        attempt,
      })

      LoggerService.info('AssemblyAi websocket closed', {
        attempt,
        websocketEvent: {
          reason: event.reason,
          code: event.code,
          wasClean: event.wasClean,
        },
      })

      if (ws === socket) ws = null
      finish(false)
    }

    socket.onerror = () => {
      AnalyticsService.captureEvent(EVENTS.ASSEMBLY_AI_TRANSCRIPTION_ERROR, {
        attempt,
      })

      LoggerService.noticeError(new Error('AssemblyAi had an expected error'), {
        attempt,
      })
    }
  })
}

export async function startTranscription(
  mediaStream: MediaStream,
  onTranscription: (transcript: string, type: 'partial' | 'final') => void
) {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return
  }

  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const started = await attemptStart(mediaStream, onTranscription, attempt)

    if (started) return
  }

  const transcriptionNeverStartedError = new Error(
    'Transcription was never started'
  )
  LoggerService.noticeError(transcriptionNeverStartedError)
  throw transcriptionNeverStartedError
}

export async function stopTranscription() {
  LoggerService.info('Stopping AssemblyAi after session ended')
  await audioController.stop()

  if (ws) {
    ws.send(JSON.stringify({ terminate_session: true }))
    ws.close()
    ws = null
  }
}

async function getToken() {
  const response = await NetworkService.getAssemblyAiToken()
  return response.data.token
}
