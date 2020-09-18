<template>
  <div :style="popUpBorderStyle" class="score-container">
    <div>
      <h2>{{ headerMsg }}</h2>
      <p :style="scoreStyle" class="score">{{ scoreMsg }}</p>
      <p class="instructions">
        {{ instructionMsg }}
      </p>
    </div>
    <div class="btn-container">
      <button class="review-btn btn" type="button" @click="showReview">
        Review answers
      </button>
      <router-link :to="rightBtn.route" tag="button" class="btn">{{
        rightBtn.text
      }}</router-link>
    </div>
  </div>
</template>

<script>
import { topics } from "@/utils/topics";

export default {
  props: {
    quizResults: { type: Object, required: true },
    quizLength: { type: Number, required: true }
  },
  data() {
    return {
      scoreMsg: "",
      showRetakeQuiz: false,
      headerMsg: "",
      instructionMsg: "",
      category: "",
      rightBtn: { text: "", route: "" },
      popUpBorderStyle: {},
      scoreStyle: {}
    };
  },
  mounted() {
    const { category } = this.$route.params;
    this.category = category;
    const isTrainingCategory = Object.keys(topics.training.subtopics).includes(
      category
    );

    if (this.quizResults.passed) {
      this.headerMsg = "What a rockstar! You passed!";
      this.instructionMsg = isTrainingCategory
        ? "Now that you have this certification, you're one step closer to being able to help students!"
        : "Now that you have this certification, you'll be notified of student requests for help in this subject. If you want to help students with even more subjects, just pass more quizzes!";
      this.popUpBorderStyle = {
        borderBottom: "5px solid #16D2AA",
        borderLeft: "5px solid #16D2AA"
      };
      this.scoreStyle = { color: "#16D2AA" };
      this.rightBtn = {
        text: "Take another quiz",
        route: "/training"
      };
    } else {
      this.headerMsg = "You failed this time, but don't give up!";
      this.instructionMsg = isTrainingCategory
        ? "Please try taking this quiz again after reviewing your incorrect answers and checking out the training course materials again."
        : "Please try taking this quiz again after reviewing your incorrect answers and checking out the subject-specific review materials we provide on the Training page.";
      this.popUpBorderStyle = {
        borderBottom: "5px solid #F44747",
        borderLeft: "5px solid #F44747"
      };
      this.scoreStyle = { color: "#F44747" };
      this.leftBtn = { text: "Review answers", route: "" };
      this.rightBtn = {
        text: "Keep studying",
        route: `/training/review/${this.category}`
      };
    }

    this.scoreMsg = `Score: ${this.quizResults.score} out of ${
      this.quizLength
    } correct.`;
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
h2 {
  font-size: 20px;
}

// todo: make global button to import
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

.btn-container {
  display: flex;
  justify-content: space-between;
  width: 80%;
  margin: 4em auto;

  & .btn:first-of-type {
    margin-left: 15px;
  }

  & .btn:last-of-type {
    margin-right: 15px;
  }
}

// override global style from router-link
.btn.active {
  box-shadow: initial;
}

.score {
  margin-top: 20px;
  font-weight: 600;
}

.instructions {
  width: 80%;
  margin: 1.4em auto 0;
}

.score-container {
  margin-top: 1em;
  padding-top: 1em;
}

@media screen and (max-width: 890px) {
  .btn-container {
    width: 100%;
  }

  .score-container {
    width: 100%;
    left: 0;
  }

  .review-btn {
    margin: 0% auto;
  }

  .btn {
    width: 120px;
  }
}

@media screen and (max-width: 400px) {
  .btn-container {
    flex-direction: column;
    align-items: center;
    margin: 2em 0;
  }

  .btn {
    width: 80%;
    margin-bottom: 1.6em;
  }
}
</style>
