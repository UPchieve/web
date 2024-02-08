<template>
  <div class="document-editor" data-document-editor-version="2">
    <div id="quill-container"></div>
    <transition name="document-loading">
      <loading-message
        message="Loading the document editor"
        class="document-loading document-loading--connection"
        v-show="isLoading"
      />
    </transition>
    <transition name="document-loading">
      <loading-message
        message="Attempting to connect the document editor"
        class="document-loading document-loading--connection"
        v-show="isConnecting"
      />
    </transition>
    <refresh-document-editor-modal v-if="showRefreshModal" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import {
  ImageCompressor,
  maxImagesEventName,
  fileSizeTooBigEventName,
  MAX_TOTAL_IMAGES,
} from '@/utils/quill-image-optimizer'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import LoadingMessage from '@/components/LoadingMessage.vue'
import RefreshDocumentEditorModal from '@/views/SessionView/RefreshDocumentEditorModal.vue'
import { Doc, applyUpdate } from 'yjs'
import { QuillBinding } from 'y-quill'

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageCompressor)
const Delta = Quill.import('delta')

const encode = array => array.toString()
const decode = str => Uint8Array.from(str.split(',').map(Number))

export default {
  components: {
    LoadingMessage,
    RefreshDocumentEditorModal,
  },
  data() {
    return {
      quillEditor: null,
      // set default loading state
      isLoading: true,
      incomingDeltas: [],
      retries: 0,
      showRefreshModal: false,
      isConnecting: false,
    }
  },
  computed: {
    ...mapState({
      currentSession: state => state.user.session,
      isSessionConnectionAlive: state => state.user.isSessionConnectionAlive,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
    }),
  },
  mounted() {
    const toolbar = [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
    ]

    if (!this.isVolunteer) toolbar.push(['image'])

    this.quillEditor = new Quill('#quill-container', {
      placeholder: 'Type or paste something...',
      theme: 'snow',
      formats: [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'color',
        'background',
        'list',
        'image',
      ],
      modules: {
        image: {
          quality: 0.8,
          maxWidth: 1000,
          maxHeight: 1000,
          imageType: 'image/webp',
        },
        cursors: {
          selectionChangeSource: 'cursor-api',
          transformOnTextChange: true,
        },
        toolbar,
      },
    })

    // Delegate tracking the contents of the doc to Yjs instead of Quill.
    this.doc = new Doc()
    new QuillBinding(this.doc.getText('quill'), this.quillEditor)

    this.quillEditor.root.addEventListener(
      maxImagesEventName,
      () =>
        alert(
          `Too many images uploaded. \n\n You can not have more than ${MAX_TOTAL_IMAGES} images in the document editor.`
        ),
      false
    )
    this.quillEditor.root.addEventListener(
      fileSizeTooBigEventName,
      () =>
        alert(
          `Image file size is too big. \n\n Please compress/resize the image before uploading.`
        ),
      false
    )

    if (this.isVolunteer) {
      const useHandler = () => {
        const delta = new Delta()
        return delta.insert('')
      }
      this.quillEditor.clipboard.addMatcher('IMG', useHandler)
      this.quillEditor.clipboard.addMatcher('PICTURE', useHandler)
    }

    // do not allow user to make edits until the quill doc contents are set
    this.quillEditor.disable()

    /*
     * We should read from and make text changes to `this.doc` rather than the Quill editor directly.
     * Yjs uses CRDTs internally to store and transmit changes, which are then used to resolve
     * conflicts between collaborators. This is how we ensure that the document editor stays
     * in sync for both partners during a session.
     */
    this.doc.on('update', this.quillTextChange)

    this.quillEditor.on('selection-change', this.quillSelectionChange)

    this.$socket.emit('requestQuillStateV2', {
      sessionId: this.currentSession._id,
    })

    this.quillEditor
      .getModule('cursors')
      .createCursor('partnerCursor', 'Partner', '#16D2AA')
  },
  methods: {
    quillTextChange(update, origin, doc) {
      // Only emit changes that are made in this component
      if (origin?.doc === doc) {
        this.$socket.emit('transmitQuillDeltaV2', {
          sessionId: this.currentSession._id,
          update: encode(update),
        })
      }
    },
    quillSelectionChange(range, oldRange, source) {
      if (source === 'user') {
        this.$socket.emit('transmitQuillSelection', {
          sessionId: this.currentSession._id,
          range,
        })
      }
    },
  },

  sockets: {
    quillStateV2({ updates }) {
      for (const update of updates) {
        applyUpdate(this.doc, decode(update))
      }
      this.isLoading = false
      this.quillEditor.enable()
    },

    partnerQuillDeltaV2({ update }) {
      applyUpdate(this.doc, decode(update))
    },

    quillPartnerSelection({ range }) {
      this.quillEditor.getModule('cursors').moveCursor('partnerCursor', range)
    },
  },
  watch: {
    isSessionConnectionAlive(newValue, oldValue) {
      if (newValue && !oldValue) {
        // socket.io just reconnected, allow edits to the document editor
        this.quillEditor.enable()
        this.isConnecting = false
      } else {
        this.quillEditor.disable()
        this.isConnecting = true
      }
    },
  },
}
</script>

<style lang="scss">
.document-editor {
  height: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  position: relative;

  .ql-container.ql-snow {
    overflow: scroll;
    border: none;
  }

  .ql-toolbar.ql-snow {
    border-width: 0 0 1px 0;
    border-color: $c-border-grey;
  }

  .ql-cursor-flag {
    display: none;
  }
}

.document-loading {
  width: 100%;
  background-color: $c-shadow-warn;
  color: #fff;
  font-weight: normal;
  min-height: 40px;
  // !important is used to override the position specified in the LoadingMessage component
  position: absolute !important;
  left: 0;
  top: 40px;
  padding: 12px;
  z-index: 1000;
  transition: all 0.15s ease-in;
  text-align: center;

  &--connection {
    background-color: rgba(110, 140, 171, 0.87);
  }
}
</style>
