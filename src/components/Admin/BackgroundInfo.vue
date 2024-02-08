<template>
  <div class="background-info">
    <div
      v-for="bgItem in backgroundInfoItems"
      :key="bgItem.name"
      class="background-item"
    >
      <div class="background-item__name">{{ bgItem.name }}</div>
      <div class="background-item__value">
        <span v-if="!bgItem.isLink">{{ bgItem.value }}</span>
        <a v-else :href="bgItem.value" target="_blank">{{ bgItem.value }}</a>
      </div>
    </div>
  </div>
</template>

<script>
import { flow, map, filter, isEmpty, flatten, partialRight } from 'lodash-es'

export default {
  props: {
    user: Object,
  },
  computed: {
    backgroundInfoItems() {
      const backgroundKeys = [
        'occupation',
        'experience',
        'country',
        'state',
        'city',
        'company',
        'college',
        'languages',
        'linkedInUrl',
      ]

      const mapBackgroundItemKeys = partialRight(map, (bgKey) => {
        let bgValue = this.user[bgKey]
        if (isEmpty(bgValue)) return null
        if (Array.isArray(bgValue))
          return {
            name: bgKey,
            value: bgValue.join(', '),
          }
        if (typeof bgValue === 'object')
          return map(Object.keys(bgValue), (subKey) => ({
            name: `${subKey} ${bgKey}`,
            value: bgValue[subKey],
          }))
        return {
          name: bgKey,
          value: bgValue,
        }
      })
      const mapIsLink = partialRight(map, (item) => ({
        ...item,
        isLink: item.value.indexOf('http') !== -1,
      }))
      const getBackgroundInfoItems = flow([
        mapBackgroundItemKeys,
        partialRight(filter, (item) => !!item),
        flatten,
        mapIsLink,
      ])

      return getBackgroundInfoItems(backgroundKeys)
    },
  },
}
</script>

<style lang="scss" scoped>
.background-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 14px;
  padding: 5px 10px;
  margin: 5px 0;
  border-left: solid #ececec 5px;
}

.background-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;

  &:not(:last-of-type) {
    margin-bottom: 10px;
  }

  &__name {
    font-weight: 600;
  }
}
</style>
