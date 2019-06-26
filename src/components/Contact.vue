<template>
  <div class="row contactus-form">
    <div class="header">
      <h2>Contact Us!</h2>
    </div>
    <table class="questions-table">
      <tr class="title-row">
        <td class="title-cell">
          <p>
          Fill out this form, and we will get back to you as soon as possible! 
          We will respond to you via email using the email address you put 
          below.
          </p>
        </td>
      </tr>
      <tr class="question-row" v-for="(question,index) in questions">
        <td class="question-cell">
          <div class="question-title">{{ question.title }}</div>
          <!-- IF MUTLIPLE CHOICE -->
          <div v-if="question.qtype === 'multiple-checkbox'">
            <table class="checkbox-question-table">
              <tr class="checkbox-question-row">
                <td class="mobileRemove"></td>
                <td
                  class="checkbox-question-selection-title"
                  v-for="(label, index) in question.table_title"
                >
                  {{ label }}
                </td>
              </tr>
              <tr
                class="checkbox-question-row forMobileView"
                v-for="(subquestion, subquestion_index) in question.options"
              >                
                <td
                  class="checkbox-question-selection-cell container"
                  v-for="index in question.table_title.length"
                  :key="index"
                >
                  <input
                    v-model="
                      userResponse[question.alias][
                        question.options_alias[subquestion_index]
                      ]
                    "
                    type="checkbox"
                    :name="question.qid + '_' + subquestion_index.toString()"
                    :value="index"
                  />
                  <span class="checkmark"></span>
                </td>
                <td class="checkbox-question-cell">{{ subquestion }}
                <div v-if="subquestion === 'Other'" class="other-input">
                    <input
                      v-model="
                        userResponse[question.alias][
                          question.options_alias[subquestion_index]
                      ]
                    "
                    type="text" class="text-line"/>
                </div>
                </td>
              </tr>
            </table>
          </div>
          <!-- IF TEXT-->
          <div v-else-if="question.qtype === 'textbox'">
            <div
              class="question-secondary-title"
              v-if="question.secondary_title.length != 0"
            >
              {{ question.secondary_title }}
            </div>
            <textarea
              class="text-question-textarea"
              v-model="userResponse[question.alias]"
            />
          </div>
          <!-- IF LINE-->
          <div v-else-if="question.qtype === 'textline'">
            <div
              class="question-secondary-title"
              v-if="question.secondary_title.length != 0"
            >
              {{ question.secondary_title }}
            </div>
                <input
                  class="text-line" type="email"
                  v-model="userResponse[question.alias]"
                />
          </div>
          <!-- ELSE -->
          <div v-else>
            something else
          </div>
        </td>
      </tr>
      <tr class="submit-button-row">
        <td class="submit-button-cell">
          <button class="submit-button" v-on:click="submitContactUs">
            SUBMIT
          </button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import NetworkService from '../services/NetworkService'

export default {
  data () {
    return {
      contactQuestions: [
        {
          qid: '1',
          qtype: 'textline',
          alias: 'email',
          title:
            'Email address',
          secondary_title:
            '',
          table_title: [],
          options: []
        },
        {
          qid: '2',
          qtype: 'multiple-checkbox',
          alias: 'subject',
          title: 'Pick the topic that best matches what you are contacting \
            us about.',
          secondary_title: '',
          table_title: [
            ''
          ],
          options: [
            'Technical issues while using the web app',
            'Math question',
            'College application question',
            'Feedback',
            'Other'
          ],
          options_alias: [
            ' Technical Issues',
            ' Math',
            ' College',
            ' Feedback',
            ' Other'
          ]
        },
        {
          qid: '3',
          qtype: 'textbox',
          alias: 'more',
          title:
            'Tell us more!',
          secondary_title:
            '',
          table_title: [],
          options: []
        }
      ],
      questions: [],
      userResponse: {},
    }
  },
  beforeMount () {
    var _self = this
    this.questions = this.contactQuestions
    this.questions.map(function (question, key) {
      if (question.qtype == 'multiple-checkbox')
        _self.userResponse[question.alias] = {}
    })
  },
  methods: {
    submitContactUs () {
      console.log(this.userResponse)
      // if (!this.isValidEmail(this.userResponse['email'])) {
      //   alert("A valid email required.")
      //   e.preventDefault();
      // }
      // else {
        NetworkService.sendContact(this, {
        responseData: this.userResponse,
        })
        this.$router.push('/')
      // }
    },
    isValidEmail (address) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(address).toLowerCase());
    },
  }
}
</script>

<style scoped>
.header {
  height: 100px;
  margin: 0;
  padding-left: 30px;
  margin-bottom: 40px;
  display: flex;
  padding: 30px 0 30px 50px;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  background-color: white;
}

.contactus-form {
  background-color: #e5f2fc;
  min-height: 100%;
  width: 100%;
  position: relative;
  vertical-align: middle;
  text-align: center;
}

.questions-table {
  width: 75%;
  max-width: 750px;
  margin: auto;
  background-color: white;
  vertical-align: middle;
  display: table;
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  box-shadow: -9px 9px #2757ca;
  margin-bottom: 20px;
}

.title-row {
  display: table-row;
}

.title-cell {
  display: table-cell;
  height: 150px;
  vertical-align: middle;
  font-size: 19px;
  text-align: left;
  padding-left: 60px;
  padding-right: 60px;
  padding-bottom: 30px;
  padding-top: 30px;
}

.question-row {
  display: table-row;
}

.question-cell {
  display: table-cell;
  vertical-align: middle;
  font-size: 19px;
  text-align: left;
  padding-left: 60px;
  padding-right: 60px;
  padding-bottom: 40px;
}

.question-title {
  padding-bottom: 10px;
}

.question-secondary-title {
  font-size: 15px;
  padding-bottom: 10px;
}

.checkbox-question-table {
  font-size: 15px;
  width: 100%;
  margin: auto;
}

.checkbox-question-table tr:nth-child(even) {
  background: #f1f8fc;
}

.checkbox-question-table tr:nth-child(odd) {
  background: #e5f2fc;
}

.checkbox-question-table tr:nth-child(1) {
  background: white;
}

.checkbox-question-row {
  display: table-row;
}

.checkbox-question-cell {
  display: table-cell;
  vertical-align: middle;
  width: 100%;
  padding-top: 20px;
  padding-bottom: 25px;
}

.checkbox-question-selection-title {
  display: table-cell;
  padding-left: 2px;
  padding-right: 2px;
  text-align: center;
  vertical-align: middle;
  padding-top: 8px;
  padding-bottom: 15px;
}

.checkbox-question-selection-cell {
  display: table-cell;
  padding-left: 20px;
  padding-right: 20px;
  text-align: left;
  vertical-align: middle;
}

.checkbox-question-selection-cell input {
  height: 15px;
  width: 15px;
}

.text-question-textarea {
  width: 100%;
  resize: none;
  font-size: 15px;
  height: 200px;
  border-width: 3px;
  -webkit-border-radius: 3px;
  -moz-border-radius: 3px;
  border-radius: 3px;
  border-color: #16d2aa;
}
.other-input {
    display: inline-block;
    padding-left: 10px;
}

.text-line {
    background-color: transparent;
    color: #2c3e50;
    outline: none;
    outline-style: none;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: solid #16d2aa 1px;
    display: inline-block;
    width: 350px;
}

.submit-button-row {
  display: table-row;
}

.submit-button-cell {
  display: table-cell;
  text-align: right;
  padding-right: 60px;
  padding-bottom: 80px;
}

.submit-button {
  width: 180px;
  height: 50px;
  background-color: #f6f6f6;
  color: #16d2aa;
  border: none;
  font-weight: 600;
  border-radius: 50px;
  -webkit-border-radius: 50px;
  -moz-border-radius: 50px;
  font-size: 15px;
  float: right;
}

.submit-button:hover,
.submit-button:active {
  background-color: #16d2aa;
  color: #fff;
}



@media screen and (max-width: 488px) {
  .mobileRemove {
    display: none !important;
  }

  .header {
    padding: 1em 1em 1em 2em !important;
  }

  table, thead, tbody, th, tr { 
		display: block !important; 
	}

  .title-cell {
    padding: 1.5em 1em 1em !important;
  }

  .questions-table {
    width: 95vw !important;
  }

  .question-cell {
    padding: 0em 1em 2em !important;
  }

  .checkbox-question-cell {
    width: 36rem !important;
    display: table-caption !important;
    padding: 1.5em !important;
  }

  .checkbox-question-selection-cell {
    padding-bottom: 1em !important;
  }

  .submit-button-cell {
    padding-left: 1.2em !important;
  }
}
</style>
