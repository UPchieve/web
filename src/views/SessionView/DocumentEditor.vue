<template>
  <div class="document-editor">
    <div id="quill-container"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Quill from "quill";

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
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }]
        ]
      }
    });

    this.quillEditor.on("text-change", this.quillTextChange);

    this.$socket.emit("requestQuillState", {
      sessionId: this.currentSession._id
    });
  },
  methods: {
    quillTextChange(delta, oldDelta, source) {
      if (source == "user") {
        this.$socket.emit("transmitQuillDelta", {
          sessionId: this.currentSession._id,
          delta
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
}
</style>
