<template>
  <div class="material" :class="statusClass">
    <div class="material__cell" @click="toggleMaterial">
      <div class="material__icon-wrapper">
        <video-icon v-if="material.type === 'video'" />
        <slide-icon v-else-if="material.type === 'slideshow'" />
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
          :class="{ 'material__caret--open': showMaterial }"
        />
      </div>
    </div>
    <div v-if="showMaterial" class="material__content">
      <div v-if="material.description" class="material__description">
        {{ material.description }}
      </div>

      <link-material
        v-if="material.type === 'link'"
        :linkUrl="material.linkUrl"
        :label="'Go to module'"
      />
      <resources-material
        v-else-if="material.type === 'resources'"
        :links="material.links"
      />
      <slideshow-material
        v-else-if="material.type === 'slideshow'"
        :resourceId="material.resourceId"
      />
      <document-material
        v-else-if="material.type === 'document'"
        :resourceId="material.resourceId"
      />
      <video-material
        v-else-if="material.type === 'video'"
        :resourceId="material.resourceId"
      />

      <button class="material__complete-btn" @click="materialClicked">
        Mark complete
      </button>
    </div>
  </div>
</template>

<script>
import LinkMaterial from "./Link";
import ResourcesMaterial from "./Resources";
import SlideshowMaterial from "./Slideshow";
import DocumentMaterial from "./Document";
import VideoMaterial from "./Video";
import RightCaret from "@/assets/right-caret.svg";
import BookIcon from "@/assets/sidebar_icons/book.svg";
import VideoIcon from "@/assets/video.svg";
import SlideIcon from "@/assets/slide.svg";
import LinkIcon from "@/assets/link.svg";

export default {
  components: {
    LinkMaterial,
    ResourcesMaterial,
    SlideshowMaterial,
    DocumentMaterial,
    VideoMaterial,
    RightCaret,
    BookIcon,
    VideoIcon,
    SlideIcon,
    LinkIcon
  },
  props: {
    material: Object
  },
  data() {
    return {
      showMaterial: false
    };
  },
  computed: {
    statusClass() {
      if (!this.material.isRequired) return "material--optional";
      else if (this.material.isCompleted) return "material--completed";
      else return "material--not-started";
    },

    statusText() {
      if (!this.material.isRequired) return "Optional";
      else if (this.material.isCompleted) return "Complete";
      else return "Not started";
    }
  },
  methods: {
    toggleMaterial() {
      this.showMaterial = !this.showMaterial;
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
  }

  &--optional {
    .material__icon-wrapper {
      border-color: $c-soft-black;

      svg {
        filter: invert(15%) sepia(3%) saturate(3319%) hue-rotate(202deg)
          brightness(95%) contrast(83%);
      }
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
}
</style>
