<template>
  <modal :closeModal="close">
    <div class="modal-container">
      <h1>Invite your students!</h1>
      <div class="copy-code">
        <h2>Class Code</h2>
        <p>
          Students can visit <b>app.upchieve.org/join-class</b> and enter their
          code:
        </p>
      </div>
    </div>
    <h1>{{ this.code }}</h1>
    <div class="modal-container">
      <h2>Class Link</h2>
      <p>
        Share this link with your students; they can sign up or log in to join
        your class.
      </p>
      <div class="link-container">
        <div class="copy-link">https://app.upchieve.org/join-class/{{ this.code }}</div>
        <button @click="copyURL" class="link-text">
          <LinkUnion /><span>{{ copyMessage }}</span>
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal.vue'
import { useClipboard } from '@vueuse/core'
import LinkUnion from '@/assets/LinkUnion.svg'

export default {
  components: { Modal, LinkUnion },
  name: 'TeacherClassCodeModal',

  props: {
    modalData: {
      type: String,
      required: true,
    },
  },

  created() {
    this.code = this.modalData.code
  },

  data() {
    return {
      code: '',
      copyMessage: 'Copy Link',
    }
  },

  methods: {
    close() {
      this.$store.dispatch('app/modal/hide')
    },

    copyURL() {
      this.copyMessage = 'Copied'
      const { copy } = useClipboard()
      copy(`https://app.upchieve.org/join-class/${this.code}`)
      setTimeout(() => {
        this.copyMessage = 'Copy Link'
      }, 3000)
    },
  },
}
</script>

<style lang="scss" scoped>
.class-link {
  text-align: left;
}

.class-link p {
  font-weight: 500;
}

.link-container {
  @include flex-container(row, space-between);
}

.copy-link {
  border: 1px solid #d8dee5;
  border-radius: 12px;
  padding: 12px;
  width: 400px;
}

.copy-link button {
  white-space: nowrap;
  color: #1855d1;
  align-items: center;
  font-size: 14px;
}

.copy-link button:hover {
  color: #2d2d2d;
}

.copy-code {
  margin-top: 16px;
}

.link-text span {
  display: inline-block;
  width: 80px;
  text-align: left;
  margin-left: 5px;
}

.modal-container {
  text-align: left;
}

.modal-container h1 {
  font-size: 24px;
}

.modal-container h2 {
  font-size: 20px;
}

.modal-container p {
  color: #77778b;
}
</style>
