<template>
  <div :style="[popUpStyle, popUpBorderStyle]" class="passScoreContainer">
    <div class="passed">{{ passedMsg }}</div>
    <div class="score">{{ scoreMsg }}</div>
    <div class="btnContainer">
      <button class="reviewBtn btn" type="button" @click="showReview">
        REVIEW TEST
      </button>
      <button v-if="showRetakeQuiz" class="btn" @click.prevent="reload()">
        RETAKE TEST
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    quizResults: { type: Object, required: true },
    quizLength: { type: Number, required: true }
  },
  data() {
    return {
      scoreMsg: "",
      showRetakeQuiz: false,
      popUpStyle: {},
      popUpBool: false,
      popUpBorderStyle: {},
      passedMsg: ""
    };
  },
  mounted() {
    if (this.quizResults.passed) {
      this.passedMsg = "You passed!";
      this.popUpBorderStyle = {
        borderBottom: "5px solid #1855D1",
        borderLeft: "5px solid #1855D1"
      };
    } else {
      this.passedMsg = "You failed.";
      this.popUpBorderStyle = {
        borderBottom: "5px solid #F44747",
        borderLeft: "5px solid #F44747"
      };
      if (this.quizResults.tries < 3) {
        this.showRetakeQuiz = true;
      }
    }

    this.scoreMsg = `Score: ${this.quizResults.score} out of ${
      this.quizLength
    } correct.`;

    this.popUpStyle = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      maxWidth: "500px",
      height: "300px",
      background: "#FFFFFF",
      zIndex: "5",
      position: "absolute",
      top: "150px",
      left: "0",
      right: "0",
      margin: "auto"
    };
  },
  methods: {
    reload() {
      this.$router.go(this.$router.currentRoute);
    },
    showReview() {
      this.$emit("showReview");
    }
  }
};
</script>

<style lang="scss" scoped>
.btn {
  background: #f6f6f6;
  border-radius: 20px;
  width: 140px;
  box-sizing: content-box;
  height: 26px;
  line-height: 26px;
  color: #16d2aa;
  font-weight: 600;
}

.btn:hover {
  background-color: #16d2aa;
  color: #fff;
}

.instructions {
  margin: 50px 0;
}

.loadingMessage {
  font-size: 2rem;
  margin: 75px 0;
}

.btnContainer {
  display: flex;
  justify-content: space-between;
  margin: 50px 75px;
}

.btnContainer btn {
  min-width: 100px;
}

.btnContainer .btn:first-of-type {
  margin-right: 15px;
}

.btnContainer .btn:last-of-type {
  margin-left: 15px;
}

.score {
  margin-top: 20px;
}

.passed {
  font-weight: 600;
  margin-top: 75px;
}

.review {
  width: 600px;
  align-self: center;
}

.review .question {
  border-bottom: 0.5px solid #cccccf;
  padding: 20px;
  margin: 0px;
}

@media screen and (max-width: 700px) {
  .btnContainer {
    margin: 2em !important;
  }

  .passScoreContainer {
    width: 100%;
    left: 0 !important;
  }

  .reviewBtn {
    margin: 0% auto !important;
  }
}
</style>
