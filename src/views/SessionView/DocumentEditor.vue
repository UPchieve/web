<template>
  <div class="document-editor">
    <div id="quill-container">
    </div>
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
import { mapState } from 'vuex'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import LoadingMessage from '@/components/LoadingMessage'
import RefreshDocumentEditorModal from '@/views/SessionView/RefreshDocumentEditorModal'

Quill.register('modules/cursors', QuillCursors)

export default {
  components: {
    LoadingMessage,
    RefreshDocumentEditorModal
  },
  data() {
    return {
      quillEditor: null,
      // set default loading state
      isLoading: true,
      incomingDeltas: [],
      retries: 0,
      showRefreshModal: false,
      isConnecting: false
    }
  },
  computed: {
    ...mapState({
      currentSession: state => state.user.session,
      isSessionConnectionAlive: state => state.user.isSessionConnectionAlive,
    })
  },
  mounted() {
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
        'list'
      ],
      modules: {
        cursors: {
          selectionChangeSource: 'cursor-api',
          transformOnTextChange: true
        },
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }]
        ]
      }
    })
    // do not allow user to make edits until the quill doc contents are set
    this.quillEditor.disable()

    this.quillEditor.on('text-change', this.quillTextChange)
    this.quillEditor.on('selection-change', this.quillSelectionChange)

    this.$socket.emit('requestQuillState', {
      sessionId: this.currentSession._id
    })

    this.quillEditor
      .getModule('cursors')
      .createCursor('partnerCursor', 'Partner', '#16D2AA')
  },
  methods: {
    quillTextChange(delta, oldDelta, source) {
      if (source === 'user') {
        this.$socket.emit('transmitQuillDelta', {
          sessionId: this.currentSession._id,
          delta
        })
      }
    },

    quillSelectionChange(range, oldRange, source) {
      if (source === 'user') {
        this.$socket.emit('transmitQuillSelection', {
          sessionId: this.currentSession._id,
          range
        })
      }
    },
    updateContents(delta){
      this.quillEditor.updateContents(delta)
    },
    emptyIncomingDeltas(){
      for (const delta of this.incomingDeltas){
        this.updateContents(delta)
      }
    }
  },
  sockets: {
    quillState({ delta }) {
      this.quillEditor.setContents(delta)
      this.emptyIncomingDeltas()
      this.isLoading = false
      this.quillEditor.enable()
    },

    partnerQuillDelta({ delta }) {
      if (this.isLoading) this.incomingDeltas.push(delta)
      else this.updateContents(delta)
    },

    quillPartnerSelection({ range }) {
      this.quillEditor.getModule('cursors').moveCursor('partnerCursor', range)
    },

    /**
     * 
     * This event lets us know the last delta that was composed to the Quill 
     * document in our server cache
     * 
     * If the last delta stored is found in our `incomingDeltas` queue,
     * that means the requested quill state from our server contains 
     * the last delta stored and the ones before it. Remove those from 
     * `incomingDeltas` to avoid appending duplicate deltas to the client Quill doc
     * 
     */
    lastDeltaStored({ delta }) {
      if (delta) {
        const queueCutoff = this.incomingDeltas.findIndex(
          pendingDelta => pendingDelta.id === delta.id
        )
        this.incomingDeltas = this.incomingDeltas.slice(queueCutoff + 1)
      }
    },

    retryLoadingDoc() {
      const maxRetries = 10
      if (this.retries > maxRetries) {
          this.showRefreshModal = true
      } else {
        this.retries++
        this.$socket.emit('requestQuillState', {
          sessionId: this.currentSession._id
        })
      }
    }
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
  }
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
