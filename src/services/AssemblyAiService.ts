import AudioProcessor from './AudioProcessor'
import LoggerService from './LoggerService'
import NetworkService from '@/services/NetworkService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const audioController = new AudioProcessor()

let ws: WebSocket | null = null

export async function startTranscription(
  mediaStream: MediaStream,
  token: string,
  onTranscription: (transcript: string, type: 'partial' | 'final') => void
) {
  if (ws) return

  const CONNECTION_PARAMS = {
    sample_rate: 16000,
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

  ws = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?${params}`)

  ws.onopen = async () => {
    LoggerService.info('AssemblyAi websocket is opened')

    await audioController.start(mediaStream, (pcmFrame) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(pcmFrame)
      }
    })
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.error) {
      LoggerService.noticeError(new Error('AssemblyAi had an expected error'), {
        ...data,
      })
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

  ws.onclose = (event) => {
    AnalyticsService.captureEvent(EVENTS.ASSEMBLY_AI_TRANSCRIPTION_CLOSED, {
      websocketEvent: {
        reason: event.reason,
        code: event.code,
        wasClean: event.wasClean,
      },
    })
    LoggerService.info('AssemblyAi websocket closed', {
      websocketEvent: {
        reason: event.reason,
        code: event.code,
        wasClean: event.wasClean,
      },
    })
  }

  ws.onerror = (event) => {
    AnalyticsService.captureEvent(EVENTS.ASSEMBLY_AI_TRANSCRIPTION_ERROR)

    LoggerService.noticeError(new Error('AssemblyAi had an expected error'), {
      event,
    })
  }
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

export async function getToken() {
  const response = await NetworkService.getAssemblyAiToken()
  return response.data.token
}
