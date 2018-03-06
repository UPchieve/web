<template>
	<div class="row">
		<div class="col-sm-12">
		<template v-if="!user.isVolunteer">
			
    <div class="container">
  <div class="jumbotron jumbotron-fluid bg-white">
  <div class="container">
    <h1 class="display-4">UPchieve Feedback Form</h1>
    <p class="lead">Taking the time to complete this short survey will help us improve and provide you with better tutoring and college admissions advice!</p><br>
    <p class="lead text-danger">*Required
    </p>
  </div>
</div>
<!--feedback Form Below-->
<form >
   <div class="form-group">
    <label for="validationCustom01">What service did you Recieve? <b class="text-danger">*
    </b> </label>
  <div class="form-check">
     <input class="form-check-input" type="radio" name="Radios" id="exampleRadios2" value="option2">
  <label class="form-check-label" for="exampleRadios2">
    Tutoring 
  </label>
    </div>
<div class="form-check">
  <input class="form-check-input" type="radio" name="Radios" id="exampleRadios2" value="option2">
  <label class="form-check-label" for="exampleRadios2">
    College Counseling
  </label>
</div>
<br>
   <div class="form-group">
    <label for="exampleInputEmail1">What Day did you log on for help? <b class="text-danger">*
    </b> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="datepicker" placeholder="MM/DD/YYYY">
  </div>
</div>
<br>
   <div class="form-group">
    <label for="exampleInputEmail1">What time did you log on for help? <b class="text-danger">*
    </b> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="bfh-timepicker" placeholder="12:00">
  </div>
</div>
<br>
   <div class="form-group">
    <label for="exampleTable">What topics did volunteer help you with today? <b class="text-danger">*
    </b> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="" placeholder="Your Answer">
  </div>
</div>
<br>
<!--Feedback Form below-->
<div class="form-group">
    <label for="exampleInputEmail1"><h4>Please give us feedback on the volunteer who helped you?  <b class="text-danger">*
    </b></h4> </label>
<table class="table table-striped">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Strongly disagree</th>
      <th scope="col">Somewhat disagree</th>
      <th scope="col">Neither agree nor disagree</th>
      <th scope="col">Somewhat agree</th>
      <th scope="col">Strongly agree</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">My volunteer was helpful</th>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
    <tr>
      <th scope="row">My volunteer was friendly and/or nice</th>

        <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
    <tr>
      <th scope="row">My volunteer seemed knowledgable about the topic they were helping me with.</th>
       <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
    </tr>
     <tr>
      <th scope="row">I would like to recieve help from this tutor again.</th>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
      <tr>
      <th scope="row">As a result of this  session, I feel more prepared to succeed in my high school classes or college application process.</th>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
  </tbody>
</table>
</div>
<br>
<!--Services Form below-->
<div class="form-group">
    <label for="exampleInputEmail1"><h4>Please give us feedback on UPchieve's services.  <b class="text-danger">*
    </b></h4> </label>
<table class="table table-striped">
  <thead>
    <tr>
      <th scope="col"></th>
      <th scope="col">Strongly disagree</th>
      <th scope="col">Somewhat disagree</th>
      <th scope="col">Neither agree nor disagree</th>
      <th scope="col">Somewhat agree</th>
      <th scope="col">Strongly agree</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">UPchieve helps me succeed in my high school classes and/or the college application process</th>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
    <tr>
      <th scope="row">I am likely to use UPchieve's services the next time I need help.</th>

        <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio1" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
    <tr>
      <th scope="row">I would recommend UPcheive's services to a friend.</th>
       <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio2" id="blankRadio1" value="option2" aria-label="...">
</div></td>
    </tr>
     <tr>
      <th scope="row">The days and times that UPchieve offers helps are enough.</th>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio3" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
      <tr>
      <th scope="row">UPchieve's web app is easy to use.</th>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="blankRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
      <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
  <td><div class="form-check">
  <input class="form-check-input position-static" type="radio" name="serviceRadio4" id="blankRadio1" value="option1" aria-label="...">
</div></td>
    </tr>
  </tbody>
</table>
</div>
<br>
<br>
 <div class="form-group">
    <label for="exampleFormControlTextarea1"><h4>Do you have any other feedback you would like to share?</h4><h6>This can be about the web app, the volunteer(s) who helped you, the services UPchieve offers, etc.</h6></label>
    <textarea class="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
  </div>



  <button type="submit" class="btn btn-primary">Submit</button>
  </form>

</div>
</for>
		</template>
		<template v-else>
			<div class="container">
  <div class="jumbotron jumbotron-fluid bg-white">
  <div class="container">
    <h1 class="display-4">UPchieve Feedback Form</h1>
    <p class="lead">Hi UPchieve volunteer! Congratulations - you just helped a student get one step closer to achieving their dreams! Thanks so much for your help! Now, in order to improve our services, we need you to give us some feedback. Please answer the questions honestly so we can make UPchieve even better!</p><br>
    <p class="lead text-danger">*Required
    </p>
  </div>
</div>
<!--feedback Form Below-->
<form >
   <div class="form-group">
    <label for="validationCustom01"><h4>What is your name? <b class="text-danger">*
    </b></h4> </label>
  <div class="input-group date">
      <input type="text" class="form-control" id="name" placeholder="Your Answer">
  </div>
  <br>
    <h4>What services did you provide for the students?<b class="text-danger">*
    </b></h4>
  
<div class="form-check">
  <input class="form-check-input" type="radio" name="Radios" id="exampleRadios2"  value="option2">
  <label class="form-check-label" for="exampleRadios2">
    Tutoring
  </label>
</div>
<div class="form-check">
  <input class="form-check-input" type="radio" name="Radios" id="exampleRadios2" value="option2">
  <label class="form-check-label" for="exampleRadios2">
    College Counseling
  </label>
</div>
<div class="form-check">
  <input class="form-check-input" type="radio" name="Radios" id="exampleRadios2" value="option2">
  <label class="form-check-label" for="exampleRadios2">
    Some of both
  </label>
</div>
<br>
   <div class="form-group">
    <label for="exampleInputEmail1"><h4>What Day did you log on for help? <b class="text-danger">*
    </b></h4> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="datepicker" placeholder="MM/DD/YYYY">
  </div>
</div>
<br>
   <div class="form-group">
    <label for="exampleInputEmail1"><h4>What's todays date? <b class="text-danger">*
    </b></h4> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="bfh-timepicker" placeholder="mm/dd/yyyy">
  </div>
</div>
<br>
   <div class="form-group">
    <label for="exampleTable"><h4>What topics did you help the student with? <b class="text-danger">*
    </b></h4> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="" placeholder="Your Answer">
  </div>
</div>
<br>
<div class="form-group">
    <label for="exampleTable"><h4>Were there any features that you needed or would have been helpful during this session that the web app didnt have?</h4> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="" placeholder="Your Answer">
  </div>
</div>
<br>
<div class="form-group">
    <label for="exampleTable"><h4>Did you encounter any technical difficulties/bugs during your shift? </h4><h6>if yes, please describe in as much detail as possible about the course of events that led to the bug ocurring so that our tech team can replicate and fix it.</h6> </label>
  
      <div class="input-group date">
      <input type="text" class="form-control" id="" placeholder="Your Answer">
  </div>
</div>
<br>
<div class="form-group">
    <label for="exampleTable"><h4>Do you have any other feedback you'd like to sjare with  us?</h4></label>
  <div class="input-group date">
      <input type="text" class="form-control" id="" placeholder="Your Answer">
  </div>
</div>
<br>



  <button type="submit" class="btn btn-primary">Submit</button>
</form>

</div>
		</template>
		</div>
	</div>
</template>

<script>
import UserService from 'src/services/UserService';

export default {
	data(){
    return {
      user: UserService.getUser()
    }
  }
}
</script>

<style scoped>
</style>
