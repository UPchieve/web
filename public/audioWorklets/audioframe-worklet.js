class AudioFrameProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]

    if (!input || input.length === 0) return true

    const channelData = input[0]
    const audioFrame = new Int16Array(channelData.length)

    for (let i = 0; i < channelData.length; i++) {
      let s = channelData[i]

      // clamp
      if (s > 1) s = 1
      else if (s < -1) s = -1

      //Convert audio samples from Float32Array to Int16 b/c AssemblyAi expects 16-bit frames
      audioFrame[i] = s * 0x7fff
    }

    // transfer ownership of buffer
    this.port.postMessage(audioFrame.buffer, [audioFrame.buffer])

    return true
  }
}

registerProcessor('audioframe-worklet', AudioFrameProcessor)
