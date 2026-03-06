export default class AudioProcessor {
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private samplesBuffer: ArrayBuffer[] = []
  private totalSamples = 0
  private SAMPLE_RATE = 16000
  private TARGET_SAMPLES = Math.floor(this.SAMPLE_RATE * 0.1) // 100ms

  async start(
    mediaStream: MediaStream,
    onPCMFrame: (frame: ArrayBuffer) => void
  ): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new AudioContext({
      sampleRate: this.SAMPLE_RATE,
    })

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

      if (this.totalSamples >= this.TARGET_SAMPLES) {
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

        onPCMFrame(merged.buffer)

        this.samplesBuffer = []
        this.totalSamples = 0
      }
    }
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
}
