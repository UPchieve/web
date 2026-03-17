export default class AudioProcessor {
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private samplesBuffer: ArrayBuffer[] = []
  private totalSamples = 0
  private preferredSampleRate = 16000
  private onAudioFrame: ((frame: ArrayBuffer) => void) | null = null

  async start(mediaStream: MediaStream): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new AudioContext({
      sampleRate: this.preferredSampleRate,
    })

    const targetTotalSamples = Math.floor(this.audioContext.sampleRate * 0.1) // 100ms

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    await this.audioContext.audioWorklet.addModule(
      '/audioWorklets/audioframe-worklet.js'
    )

    this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream)

    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'audioframe-worklet'
    )

    this.sourceNode.connect(this.workletNode)

    this.workletNode.port.onmessage = (event: any) => {
      const frame: ArrayBuffer = event.data

      this.samplesBuffer.push(frame)

      const samples = frame.byteLength / 2
      this.totalSamples += samples

      if (this.totalSamples >= targetTotalSamples) {
        const merged = new Int16Array(this.totalSamples)

        let offset = 0

        for (const chunk of this.samplesBuffer) {
          const chunkSamples = new Int16Array(chunk)

          merged.set(chunkSamples, offset)

          offset += chunkSamples.length
        }

        //Leaving this for debuging if audio is being sent; Will remove after the experiment is over
        // const avg = merged.reduce((a, b) => a + Math.abs(b), 0) / merged.length
        // console.log('avg amplitude:', avg)

        this.onAudioFrame?.(merged.buffer)

        this.samplesBuffer = []
        this.totalSamples = 0
      }
    }
  }

  setOnAudioFrameHandler(handler: (frame: ArrayBuffer) => void) {
    this.onAudioFrame = handler
  }

  async stop(): Promise<void> {
    this.workletNode?.disconnect()
    this.sourceNode?.disconnect()

    if (this.audioContext) {
      await this.audioContext.close()
    }

    this.audioContext = null
    this.workletNode = null
    this.sourceNode = null
  }

  getSampleRate() {
    return this.audioContext?.sampleRate
  }
}
