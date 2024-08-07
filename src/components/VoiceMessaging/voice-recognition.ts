enum STATES {
  idle = 'idle',
  stopped = 'stopped',
  started = 'started',
  transcribing = 'transcribing',
  unsupported = 'unsupported',
}

export class VoiceRecognition {
  recognizer
  transcription = ''
  state: STATES = STATES.idle
  startResolver
  stopResolver

  static notSupported() {
    return (
      typeof (window.SpeechRecognition || window.webkitSpeechRecognition) ===
      'undefined'
    )
  }

  constructor() {
    this.recognizer = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)()
    this.recognizer.lang = 'en-US'
    this.recognizer.continous = false
    this.recognizer.interimResults = false
    this.recognizer.onresult = (event) => {
      if (this.state === STATES.started) {
        this.state = STATES.transcribing
        this.transcription = event.results[0][0].transcript
      } else {
        this.transcription += ` ${event.results[0][0].transcript}`
      }
    }
    this.recognizer.onend = () => {
      /*
       * 'end' is fired when speech recognized by the browser's speech recognition service has stopped being detected.
       *  this can happen when you pause in your speech (or seemingly, whenever the browser feels like it).
       *  restarting the recognition let's us continously transcribe audio until the user stops the recording.
       *  at which point, we'll set the state to `stopped`
       */
      if (this.state !== STATES.stopped) {
        this.recognizer.start()
      }
    }
  }

  start() {
    return new Promise((r) => {
      this.state = STATES.started
      this.recognizer.onstart = r
      this.recognizer.start()
    })
  }

  stop() {
    return new Promise<string>((r) => {
      /*
       * NOTE: we can't call `recognizer.stop()` explicitly since that will
       * stop recognition before the browser's speech detection is finished.
       * meaning we'll get just a partial transcript. by swapping out the
       * `onend` handler we can wait for any pending results before finalizing
       * the transcript
       */
      this.recognizer.onend = () => r(this.transcription)
      this.state = STATES.stopped
    })
  }
}
