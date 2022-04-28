<template>
  <div class="AvailabilityGrid">
    <div class="Column">
      <Cell class="Top Left" :selectable="false" />
      <Cell
        v-for="(value, hour) in timeRange"
        class="Left"
        :key="'label' + hour"
        :content="hour"
        :selectable="false"
      />
    </div>
    <div class="Column" v-for="(hours, day) in availability" :key="day">
      <Cell class="Top" :content="day" :selectable="false" />
      <Cell
        v-for="(value, hour) in hours"
        :key="day + hour"
        :selectable="true"
        :selected="value"
        :flagged="readWaitTime(day, hour) > threshold"
        @click.native="updateData(day, hour)"
      />
    </div>
  </div>
</template>

<script>
import Cell from './Cell.vue'

export default {
  name: 'AvailabilityGrid',
  components: { Cell },
  props: {
    availability: Object,
    waitTimes: Object
  },
  data() {
    return {
      threshold: 15 * 60 * 1000,
      timeRange: {
        '12 am': false,
        '1 am': false,
        '2 am': false,
        '3 am': false,
        '4 am': false,
        '5 am': false,
        '6 am': false,
        '7 am': false,
        '8 am': false,
        '9 am': false,
        '10 am': false,
        '11 am': false,
        '12 pm': false,
        '1 pm': false,
        '2 pm': false,
        '3 pm': false,
        '4 pm': false,
        '5 pm': false,
        '6 pm': false,
        '7 pm': false,
        '8 pm': false,
        '9 pm': false,
        '10 pm': false,
        '11 pm': false
      }
    }
  },
  methods: {
    updateData(day, hour) {
      this.$emit('select', { day, hour })
    },
    readWaitTime(day, hour) {
      // if waitTime provided is empty or invalid then ignore it
      try {
        return this.waitTimes[day][hour]
      } catch (err) {
        return 0
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.AvailabilityGrid {
  padding: 40px 0 40px 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

@media screen and (max-width: #{get-app-sidebar-width("medium") + 960px}) {
  .AvailabilityGrid {
    overflow-x: scroll;
    justify-content: flex-start;
  }
}

.Column {
  display: flex;
  flex-direction: column;
}
.Top {
  border-top: none !important;
}
.Left {
  border-left: none !important;
}
</style>
