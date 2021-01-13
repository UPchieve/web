<template>
  <div class="material" :class="statusClass">
    <div class="material__cell" @click="toggleMaterial">
      <div class="material__icon-wrapper">
        <video-icon v-if="material.type === 'video'" />
        <link-icon v-else-if="material.type === 'link'" />
        <book-icon v-else />
      </div>
      <div class="material__left">
        <div class="material__name">{{ material.name }}</div>
        <div class="material__status">{{ statusText }}</div>
      </div>
      <div class="material__right">
        <right-caret
          class="material__caret"
          :class="{ 'material__caret--open': isOpen }"
        />
      </div>
    </div>
    <div v-if="isOpen" class="material__content">
      <div v-if="material.description" class="material__description">
        {{ material.description }}
      </div>

      <link-material
        v-if="material.type === 'link'"
        :linkUrl="material.linkUrl"
        :label="'Go to link'"
      />
      <resources-material
        v-else-if="material.type === 'resources'"
        :links="material.links"
      />
      <document-material
        v-else-if="material.type === 'document'"
        :resourceId="material.resourceId"
      />
      <video-material
        v-else-if="material.type === 'video'"
        :resourceId="material.resourceId"
      />

      <p v-if="material.type === 'document'" class="material__document-link">
        Are you having trouble viewing the document?
        <a
          :href="
            `https://upc-training-materials.s3.us-east-2.amazonaws.com/${
              material.resourceId
            }.pdf`
          "
          target="_blank"
          rel="noopener noreferrer"
          >View here</a
        >
      </p>

      <button
        v-if="this.material.isRequired"
        :disabled="this.material.isCompleted"
        class="material__complete-btn"
        @click="materialClicked"
      >
        Mark as complete
      </button>
    </div>
  </div>
</template>

<script>
import LinkMaterial from "./Link";
import ResourcesMaterial from "./Resources";
import DocumentMaterial from "./Document";
import VideoMaterial from "./Video";
import RightCaret from "@/assets/right-caret.svg";
import BookIcon from "@/assets/sidebar_icons/book.svg";
import VideoIcon from "@/assets/video.svg";
import LinkIcon from "@/assets/link.svg";

export default {
  components: {
    LinkMaterial,
    ResourcesMaterial,
    DocumentMaterial,
    VideoMaterial,
    RightCaret,
    BookIcon,
    VideoIcon,
    LinkIcon
  },
  props: {
    material: Object,
    isOpen: Boolean
  },
  computed: {
    statusClass() {
      if (!this.material.isRequired) return "material--optional";
      else if (this.material.isCompleted) return "material--completed";
      else return "material--not-started";
    },

    statusText() {
      if (!this.material.isRequired) return "Optional";
      else if (this.material.isCompleted) return "Completed";
      else return "Not started";
    }
  },
  methods: {
    toggleMaterial() {
      this.$emit("material-toggled", this.material.materialKey);
    },
    materialClicked() {
      this.$emit("material-completed", this.material.materialKey);
    }
  }
};
</script>

<style lang="scss" scoped>
.material {
  color: $c-soft-black;
  margin-top: -1px;

  &__cell {
    display: flex;
    flex-direction: row;
    border: solid 1px $c-border-grey;
    padding: 10px 30px;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
  }

  &__icon-wrapper {
    border: solid 1px $c-border-grey;
    border-radius: 50px;
    height: 50px;
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 25px;
      height: 25px;
      filter: invert(84%) sepia(5%) saturate(1065%) hue-rotate(189deg)
        brightness(110%) contrast(87%);
    }
  }

  &__left {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    margin-left: 20px;

    // See: https://css-tricks.com/flexbox-truncated-text/
    min-width: 0;
  }

  &__name {
    font-size: 18px;
    margin-bottom: -3px;
    text-align: left;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 10px;
  }

  &__status {
    color: $c-secondary-grey;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__caret {
    &--open {
      transform: rotate(90deg);
    }
  }

  &__content {
    text-align: left;
    font-weight: 500;
    padding: 40px 10px;

    @include breakpoint-above("large") {
      padding: 40px 60px;
    }
  }

  &__description {
    font-size: 16px;
    padding: 10px 0 30px;
  }

  &__complete-btn {
    margin: 35px 0 10px;
    background: $c-success-green;
    border: none;
    border-radius: 25px;
    padding: 9px 18px;
    color: #fff;
    cursor: pointer;

    &:hover {
      background: darken($color: $c-success-green, $amount: 3%);
    }

    &:disabled {
      cursor: default;
      background: lighten($color: $c-success-green, $amount: 40%);
    }
  }

  &--completed {
    .material__status {
      color: $c-success-green;
    }

    .material__icon-wrapper {
      border-color: $c-success-green;

      svg {
        filter: invert(56%) sepia(68%) saturate(488%) hue-rotate(117deg)
          brightness(103%) contrast(96%);
      }
    }
  }

  &__document-link {
    margin-top: 1em;
  }
}
</style>
