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
import FeedbackForm from "@/components/FeedbackForm";

export default {
  components: {
    FeedbackForm
  },
  data() {
    return {
      headerText: "Help improve UPchieve!",
      leadParagraphs: [
        {
          text: "Lorem ipsum",
          style: "font-weight: 300"
        },
        {
          text: "Dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Etiam non quam lacus suspendisse faucibus interdum posuere. Enim ut sem viverra aliquet eget sit. Risus at ultrices mi tempus imperdiet nulla malesuada pellentesque elit. Semper feugiat nibh sed pulvinar proin gravida hendrerit. Amet massa vitae tortor condimentum lacinia quis. Vitae semper quis lectus nulla at volutpat diam. A cras semper auctor neque vitae tempus quam pellentesque nec. Lorem ipsum dolor sit amet consectetur adipiscing elit pellentesque."
        }
      ],
      questions: [
        {
          qid: "1",
          qtype: "multiple-radio",
          alias: "sample1",
          title: "Lorem ipsum dolor sit amet",
          secondary_title: "",
          table_title: [
            "Strongly Disagree",
            "Somewhat Agree",
            "Neither",
            "Somewhat Agree",
            "Strongly Agree"
          ],
          options: [
            "Consecteteur adipiscing elit",
            "Sed do eiusmod tempor",
            "Incididunt ut labore et dolore"
          ],
          options_alias: [
            "sample1-foo",
            "sample1-bar",
            "sample1-baz"
          ]
        },
        {
          qid: "2",
          qtype: "multiple-radio",
          alias: "sample1",
          title: "Feugiat nisl pretium fusce id velit",
          secondary_title: "",
          table_title: [
            "Strongly Disagree",
            "Somewhat Agree",
            "Neither",
            "Somewhat Agree",
            "Strongly Agree"
          ],
          options: [
            "Lectus quam id leo in vitae turpis.",
            "Mattis nunc sed blandit libero volutpat sed cras ornare.",
            "Malesuada pellentesque elit eget gravida cum sociis.",
            "In cursus turpis massa tincidunt."
          ]
        },
        {
          qid: "3",
          qtype: "text",
          alias: "other-feedback",
          title: "Tell us more",
          secondary_title:
            "Viverra mauris in aliquam sem fringilla ut. Nibh sit amet commodo nulla facilisi nullam vehicula. Mattis ullamcorper velit sed ullamcorper morbi tincidunt ornare massa eget.",
          table_title: [],
          options: []
        }
      ],
      metadata: {}
    }
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
      userType: "volunteer"
    };
  },
  methods: {
    submitting() {
      // redirect user to dashboard
      this.$router.push("/");
    }
  }
}
</script>