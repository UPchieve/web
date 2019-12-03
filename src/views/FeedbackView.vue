<template>
  <feedback-form
    :header-text="headerText"
    :lead-paragraphs="leadParagraphs"
    :questions="questions"
    :metadata="metadata"
    feedback-for="failedJoin"
    @form-submit="submitting"
  />
</template>

<script>
import { mapState } from "vuex";

import FeedbackForm from "@/components/FeedbackForm";

export default {
  components: {
    FeedbackForm
  },
  data() {
    return {
      headerText: "Help improve UPchieve!",
      leadParagraphs: [],
      student_questions: [
        {
          qid: "1",
          qtype: "star-rating",
          alias: "rate-session",
          title: "Rate your session",
          secondary_title: "",
          options: ["Rating"],
          options_alias: ["rating"]
        },
        {
          qid: "2",
          qtype: "radio-list",
          alias: "session-goal",
          title: "What was your primary goal today?",
          secondary_title: "",
          options: [
            "Improve my understanding",
            "Check my answers",
            "Finish a homework assignment",
            "Get advice",
            "Prepare for a test",
            "Other"
          ],
          options_alias: [
            "improve-understanding",
            "check-answers",
            "finish-homework",
            "get-advice",
            "test-prep",
            "other"
          ]
        },
        {
          qid: "3",
          qtype: "multiple-radio",
          alias: "coach-ratings",
          title: "Please tell us about your coach.",
          secondary_title: "",
          table_title: [
            "Strongly Disagree",
            "Somewhat Agree",
            "Neither",
            "Somewhat Agree",
            "Strongly Agree"
          ],
          options: [
            "My coach was knowedgable about the topic.",
            "My coach was friendly and approachable.",
            "I would like to receive help from this coach again."
          ],
          options_alias: [
            "coach-knowedgable",
            "coach-friendly",
            "coach-help-again"
          ]
        },
        {
          qid: "4",
          qtype: "text",
          alias: "other-feedback",
          title:
            "(Optional) Do you have any other feedback you'd like to share?",
          secondary_title:
            "This can be about the web app, the Academic Coach who helped you, the services UPchieve offers, etc.",
          table_title: [],
          options: []
        }
      ],
      volunteer_questions: [
        {
          qid: "1",
          qtype: "star-rating",
          alias: "rate-session",
          title: "Rate your session",
          secondary_title: "",
          options: ["Rating"],
          options_alias: ["rating"]
        },
        {
          qid: "2",
          qtype: "multiple-radio",
          alias: "session-experience",
          title: "Please tell us about your experience.",
          secondary_title: "",
          table_title: [
            "Strongly Disagree",
            "Somewhat Agree",
            "Neither",
            "Somewhat Agree",
            "Strongly Agree"
          ],
          options: [
            "I feel like I helped the student.",
            "I found it easy to answer the student’s question(s).",
            "I feel like this was a good use of my time.",
            "I feel more fulfilled as a result of this volunteer experience.",
            "I plan on volunteering with UPchieve again."
          ],
          options_alias: [
            "feel-like-helped-student",
            "easy-to-answer-questions",
            "good-use-of-time",
            "feel-more-fulfilled",
            "plan-on-volunteering-again"
          ]
        },
        {
          qid: "3",
          qtype: "text",
          alias: "other-feedback",
          title:
            "(Optional) Do you have any other feedback you’d like to share?",
          secondary_title:
            "This can be about any technical issues you encountered, features you would have liked, concepts or topics you felt unprepared for, or the experience of volunteering with UPchieve in general.",
          table_title: [],
          options: []
        }
      ],
      questions: [],
      userResponse: {}
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    })
  },
  beforeMount() {
    this.metadata = {
      sessionId: this.$route.params.sessionId,
      topic: this.$route.params.topic,
      subTopic: this.$route.params.subTopic,
      studentId: this.$route.params.studentId,
      volunteerId: this.$route.params.volunteerId,
      userType: this.$route.params.userType
    };

    if (this.metadata.userType === "student") {
      this.questions = this.student_questions;
    } else {
      this.questions = this.volunteer_questions;
      this.leadParagraphs.push(
        {
          text: "Congratulations!",
          style: "font-weight: 600"
        },
        {
          text:
            "You just helped a student get one step closer to achieving their academic goals! Thanks so much for your help! Now, to make UPchieve even better, please take a few minutes to fill out this feedback form."
        }
      );
    }
  },
  methods: {
    submitting() {
      this.$router.push("/");
    }
  }
};
</script>
