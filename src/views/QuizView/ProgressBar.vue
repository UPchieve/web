<template>
  <div>
    <div class="circles">
      <div
        v-for="n in quizLength"
        :key="`circle-${n}`"
        :id="'circle-' + n"
        class="circle"
      >
        {{ n }}
      </div>
    </div>
    <div class="rect" />
    <div
      v-if="quizLength > 0"
      :style="{ width: barWidth + '%' }"
      class="rect cover"
    />
  </div>
</template>

<script>
export default {
  props: {
    quizLength: { type: Number, required: true },
    barWidth: { type: Number, required: true }
  }
};
</script>

<style lang="scss" scoped>
.circles {
  display: flex;
  justify-content: space-between;
}

.circle {
  display: flex;
  justify-content: center;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  background: #eeeeee;
  z-index: 1;
  color: #ffffff;
}

#circle-1 {
  background: #16d2aa;
}

.rect {
  height: 7px;
  background: #eeeeee;
  position: relative;
  top: -13px;
  z-index: 0;
}

.rect.cover {
  background: #16d2aa;
  top: -20px;
}
</style>
