<script lang="ts" setup>
import { onMounted, ref, reactive, onBeforeUnmount } from 'vue'

const props = defineProps(['stream'])
const canvas = ref(null)
const obj = reactive({})
const stop = ref(false)

onMounted(async () => {
  const audioContext = new AudioContext()
  const streamSource = audioContext.createMediaStreamSource(props.stream)

  const width = 200
  const height = 24
  obj.analyser = audioContext.createAnalyser()
  streamSource.connect(obj.analyser)
  obj.analyser.fftSize = 2048
  obj.frequencyArray = new Float32Array(obj.analyser.fftSize)
  obj.ctx = canvas.value.getContext('2d')
  obj.width = width
  obj.height = height
  obj.bars = []
  canvas.value.width = width * window.devicePixelRatio
  canvas.value.height = height * window.devicePixelRatio
  canvas.value.style.width = '100%'
  canvas.value.style.height = '100%'
  obj.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  loop()
})

onBeforeUnmount(() => {
  stop.value = true
})

const timeOffset = 50
let now = parseInt(performance.now()) / timeOffset

function loop() {
  if (stop.value) {
    return
  }
  obj.ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  let max = 0

  if (parseInt(performance.now() / timeOffset) > now) {
    now = parseInt(performance.now() / timeOffset)
    obj.analyser.getFloatTimeDomainData(obj.frequencyArray)
    for (let i = 0; i < obj.frequencyArray.length; i++) {
      if (obj.frequencyArray[i] > max) {
        max = obj.frequencyArray[i]
      }
    }

    var freq = Math.floor(max * 50)

    obj.bars.push({
      x: obj.width,
      y: obj.height / 2 - freq / 2,
      height: freq || 0.25,
      width: 1,
    })
  }
  draw()
  requestAnimationFrame(loop)
}

function draw() {
  for (let i = 0; i < obj.bars.length; i++) {
    const bar = obj.bars[i]
    obj.ctx.fillStyle = '#f44747'
    obj.ctx.fillRect(bar.x, bar.y, bar.width, bar.height)
    bar.x = bar.x - 1

    if (bar.x < 1) {
      obj.bars.splice(i, 1)
    }
  }
}
</script>

<template>
  <div class="canvas-container">
    <canvas ref="canvas" class="canvas"></canvas>
    <div class="line-container1">
      <div class="vertical-line1" />
      <div class="dot1" />
      <div class="dot1" />
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  display: flex;
  place-content: center;
}
.dot {
  height: 25px;
  width: 25px;
  border-radius: 50%;
  background: #f44747;
  position: absolute;
}
.vertical-line {
  border-left: thick solid #f44747;
  height: 90%;
  top: 5%;
  color: #f44747;
  background: #f44747;
  position: relative;
  right: 5%;
  z-index: 999;
}

.line-container {
  height: 90%;
  top: 5%;
  background: #f44747;
  position: absolute;
  right: 5%;
  z-index: 9999;
}
</style>
