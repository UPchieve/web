<template>
  <div class="document-editor">
    <div id="quill-container"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Quill from "quill";
import QuillCursors from "quill-cursors";

Quill.register("modules/cursors", QuillCursors);

export default {
  data() {
    return {
      quillEditor: null
    };
  },
  computed: {
    ...mapState({
      currentSession: state => state.user.session
    })
  },
  mounted() {
    this.quillEditor = new Quill("#quill-container", {
      placeholder: "Type or paste something...",
      theme: "snow",
      formats: [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "color",
        "background",
        "list"
      ],
      modules: {
        cursors: {
          selectionChangeSource: "cursor-api",
          transformOnTextChange: true
        },
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }]
        ]
      }
    });

    this.quillEditor.on("text-change", this.quillTextChange);
    this.quillEditor.on("selection-change", this.quillSelectionChange);

    this.$socket.emit("requestQuillState", {
      sessionId: this.currentSession._id
    });

    this.quillEditor
      .getModule("cursors")
      .createCursor("partnerCursor", "Partner", "#16D2AA");
  },
  methods: {
    quillTextChange(delta, oldDelta, source) {
      if (source === "user") {
        this.$socket.emit("transmitQuillDelta", {
          sessionId: this.currentSession._id,
          delta
        });
      }
    },

    quillSelectionChange(range, oldRange, source) {
      if (source === "user") {
        this.$socket.emit("transmitQuillSelection", {
          sessionId: this.currentSession._id,
          range
        });
      }
    }
  },
  sockets: {
    quillState({ delta }) {
      this.quillEditor.setContents(delta);
    },

    partnerQuillDelta({ delta }) {
      this.quillEditor.updateContents(delta);
    },

    quillPartnerSelection({ range }) {
      this.quillEditor.getModule("cursors").moveCursor("partnerCursor", range);
    }
  }
};
</script>

<style lang="scss">
.document-editor {
  height: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;

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
</style>
