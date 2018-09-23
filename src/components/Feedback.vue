<!--suppress ALL -->
<template>
	<div class="feedback-form">
		<div class="header">
			<h2>Help improve UPchieve!</h2>
		</div>
		<table class="questions-table">
			<tr v-if="this.$route.params.userType === 'student'" class="title-row">
				<td class="title-cell">Please help us improve UPchieve’s services by filling out this short survey. Your responses are completely anonymous and greatly appreciated.</td>
			</tr>
			<tr v-else class="title-row">
				<td class="title-cell">
					<p style="padding-top: 40px"><b>Congratulations!</b></p>
					<p style="padding-bottom: 30px">You just helped a student get one step closer to achieving their academic goals! Thanks so much for your help! Now, to make UPchieve even better, please take a few minutes to fill out this feedback form.</p>
				</td>
			</tr>
			<tr class="question-row" v-for="(question, index) in questions">
				<td class="question-cell">
					<div class="question-title">{{ question.title }}</div>
					<div v-if="question.qtype === 'multiple-radio'">
						<table class="radio-question-table">
							<tr class="radio-question-row">
								<td></td>
								<td class="radio-question-selection-title" v-for="(label, index) in question.table_title">{{ label }}</td>
							</tr>
							<tr class="radio-question-row" v-for="(subquestion, subquestion_index) in question.options">
								<td class="radio-question-cell"> {{ subquestion }}</td>
								<td class="radio-question-selection-cell" v-for="index in question.table_title.length" :key="index">
									<input v-model="userResponse[question.alias][question.options_alias[subquestion_index]]" type="radio" :name="question.qid + '_' + subquestion_index.toString()" :value="index" />
								</td>
							</tr>
						</table>
					</div>
					<div v-else-if="question.qtype === 'text'">
						<div class="question-secondary-title" v-if="question.secondary_title.length != 0">
							{{ question.secondary_title }}
						</div>
						<textarea class="text-question-textarea" v-model="userResponse[question.alias]" />
					</div>
					<div v-else>
						something else
					</div>
				</td>
			</tr>
			<tr class="submit-button-row">
				<td class="submit-button-cell">
					<button class="submit-button" v-on:click="submitFeedback">SUBMIT</button>
				</td>
			</tr>
		</table>
	</div>
</template>

<script>
  import UserService from 'src/services/UserService';
  import NetworkService from '../services/NetworkService';

  export default {
    data (){
      return {
        user: UserService.getUser(),
	    	sessionId: '',
			userType: '',
			studentId: '',
			volunteerId: '',
        student_questions: [
          {
            qid: '1',
			qtype: 'multiple-radio',
			alias: 'rate-coach',
            title: 'Please give feedback on the Academic Coach who helped you.',
            secondary_title: '',
            table_title: ['Strongly Disagree', 'Somewhat Agree', 'Neither', 'Somewhat Agree', 'Strongly Agree'],
            options: [
              'I was able to find the help/information I needed from my Academic Coach.',
              'My Academic Coach was friendly and/or nice.',
              'I would like to receive help from this Academic Coach again.',
              'My Academic Coach was knowledgeable about the help topic.',
              'As a result of this session, I feel more prepared to succeed and achieve my academic goals.'
			],
			options_alias: [
              'find-help',
              'nice',
              'want-him/her-again',
              'knowledgeable',
              'achieve-goal'
			],
          },
          {
            qid: '2',
			qtype: 'multiple-radio',
			alias: 'rate-upchieve',
            title: 'Please give feedback on UPchieve’s services',
            secondary_title: '',
            table_title: ['Strongly Disagree', 'Somewhat Agree', 'Neither', 'Somewhat Agree', 'Strongly Agree'],
            options: [
              'UPchieve helps me succeed and achieve my academic goals.',
              'I am likely to use UPchieve the next time I need help.',
              'UPchieve’s app is easy to use.',
              'UPchieve enables me to get help faster than before.',
			],
			options_alias: [
			  'achieve-goal',
              'use-next-time',
              'easy-to-use',
              'get-help-faster',
			],
          },
          {
            qid: '3',
			qtype: 'text',
			alias: 'other-feedback',
            title: '(Optional) Do you have any other feedback you would like to share?',
            secondary_title: 'This can be about the web app, the Academic Coach who helped you, the services UPchieve offers, etc.',
            table_title: [],
            options: []
          }
        ],
		volunteer_questions: [
		  {
            qid: '1',
			qtype: 'text',
			alias: 'asked-unprepared-questions',
            title: 'Did the student ask you any questions that you weren’t prepared to answer?',
            secondary_title: 'Don’t worry! We use this to improve our training and certification materials and won’t hold it against you.',
            table_title: [],
            options: []
		  },
          {
            qid: '2',
			qtype: 'text',
			alias: 'app-features-needed',
            title: 'Were there any app features that you needed or that would have been helpful during this session?',
            secondary_title: '',
            table_title: [],
            options: []
          },
          {
            qid: '3',
			qtype: 'text',
			alias: 'technical-difficulties',
            title: 'Did you encounter any technical difficulties/bugs while using the app?',
            secondary_title: 'If yes, please describe the issue in as much detail as possible so that our tech team can replicate and fix it.',
            table_title: [],
            options: []
          },
          {
            qid: '4',
			qtype: 'text',
			alias: 'other-feedback',
            title: '(Optional) Do you have any other feedback you’d like to share with us?',
            secondary_title: '',
            table_title: [],
            options: []
          }
		],
		questions: [],
		userResponse: {}
      }
    },
	beforeMount() {
		var _self = this;
		this.sessionId = this.$route.params.sessionId;
		this.userType = this.$route.params.userType;
		this.studentId = this.$route.params.studentId;
		this.volunteerId = this.$route.params.volunteerId;
		console.log('student ' + this.studentId);
		console.log('volunteer ' + this.volunteerId);
		if (this.userType === 'student') {
			this.questions = this.student_questions;
	  } else {
        this.questions = this.volunteer_questions;
	  }
		this.questions.map(function(question, key) {
			if (question.qtype == 'multiple-radio')
				_self.userResponse[question.alias] = {};
		});
	},
	methods: {
		submitFeedback() {
			console.log(this.userResponse);
			NetworkService.feedback(this, {
				sessionId: this.sessionId,
				responseData: this.userResponse,
				userType: this.userType,
				studentId: this.studentId,
				volunteerId: this.volunteerId
			});
			this.$router.push('/');
		}
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
	border-bottom: 0.5px solid #CCCCCF;
	align-items: center;
	justify-content: space-between;
	font-weight: 600;
	background-color: white;
}

.feedback-form {
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

.radio-question-table {
	font-size: 15px;
}

.radio-question-table tr:nth-child(even) {
	background: #f1f8fc;
}

.radio-question-table tr:nth-child(odd) {
	background: #e5f2fc;
}

.radio-question-table tr:nth-child(1) {
	background: white;
}


.radio-question-row {
	display: table-row;
}

.radio-question-cell {
	display: table-cell;
	vertical-align: middle;
	width: 175px;
	padding-left: 15px;
	padding-top: 20px;
	padding-bottom: 25px;
}

.radio-question-selection-title {
	display: table-cell;
	padding-left: 2px;
	padding-right: 2px;
	text-align: center;
	vertical-align: middle;
	padding-top: 8px;
	padding-bottom: 15px;
}

.radio-question-selection-cell {
	display: table-cell;
	padding-left: 2px;
	padding-right: 2px;
	text-align: center;
	vertical-align: middle;
}

.text-question-textarea {
	width: 100%;
	resize: none;
	font-size: 15px;
	height: 80px;
	border-width: 3px;
	-webkit-border-radius: 3px;
	-moz-border-radius: 3px;
	border-radius: 3px;
	border-color: #16D2AA;
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
	background-color: #F6F6F6;
	color: #16D2AA;
	border: none;
	font-weight: 600;
	border-radius: 50px;
	-webkit-border-radius: 50px;
	-moz-border-radius: 50px;
	font-size: 15px;
	float: right;
}

.submit-button:hover, .submit-button:active {
	background-color: #16D2AA;
	color: #FFF;
}

</style>
