<template>
  <div v-if="user.isVolunteer" class="review">
    <h1 class="header" v-if="category != 'esl'">{{ category | capitalize }} Review</h1>
    <h1 class="header" v-if="category == 'esl'">{{ category | uppercase }} Review</h1>
    <div v-for="(name, index) in assetNames[category]">
      <div class="image" v-bind:style="imageStyles[index]"></div>
    </div>
  </div>
</template>

<script>
import UserService from 'src/services/UserService';
export default {
  data() {
    let user = UserService.getUser();
    let category = this.$route.params.category;
    let assetNames = new Object();
    assetNames['esl'] = ['ESL-Quiz-Bank1', 'ESL-Quiz-Bank2', 'ESL-Quiz-Bank3', 'ESL-Quiz-Bank4', 'ESL-Quiz-Bank5', 'ESL-Quiz-Bank6', 'ESL-Quiz-Bank7'];
    return {
      user: user,
      category: category,
      assetNames: assetNames,
      imageStyles: []
    }
  },
  beforeMount() {
    this.styleImages();
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    uppercase: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.toUpperCase()
    }
  },
  methods: {
    styleImages(){
      var names = this.assetNames[this.category];
      if (names) {
        for (var i = 0; i < names.length; i++) {
          var questionImage = '../../static/review_materials/' + names[i] + '.png';
          this.imageStyles[i] = {
            backgroundImage: `url(${questionImage})`,
            width: '1650px',
            height: '1275px',
            backgroundSize: 'cover'
          };
        }
      }
    }
  }
}
</script>

<style scoped>

.header {
  text-align: start;
  margin-left: 20px;
  font-size: 24px;
  margin-bottom: 50px;
}

</style>
