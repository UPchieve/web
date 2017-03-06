<template>
  <div>
    <div class="row">
      <div class="col-sm-12" style="background-color:rgba(24,85,209,.6); text-align:left; padding-left:50px;padding-bottom:20px">
        <h3 style="color:white"><strong>Student Profile</strong></h3>
      </div>
    </div>


    <div class="row">
      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your full name</p>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-4">
          <input type="text" id="inputName" class="form-control" required autofocus>
        </div>
        <div class="col-sm-4" style="text-align:left; padding-left:35px;">
          <input type="text" id="inputLast" class="form-control">
        </div>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <p style="color:gray">First name</p>
        </div>
        <div class="col-sm-4" style="text-align:left; padding-left:35px;">
          <p style="color:gray">Last name</p>
        </div>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:50px;">
        <br>
        <p>Your nickname (that volunteers will see)</p>
        <div class="col-sm-8" style="padding-top:0px; padding-left:0px">
          <input type="text" id="inputNickname" class="form-control" required autofocus>
        </div>
        <br><br>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Which services are you interested in?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid-singlecol">
            <li><input type="checkbox" class="checkbox-round" name="mathtutoring" value="mathtutoring" /><p>Math Tutoring</p></li>
            <li><input type="checkbox" class="checkbox-round" name="collegecounseling" value="collegecounseling" /><p>College Counseling</p></li>


        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>(Optional) Upload a profile picture</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:400px; height:40px" required autofocus placeholder="No file selected">
        </div>
        <div class="col-sm-4" style="text-align:left;">
         <button class="btn btn-lg btn-primary btn-block" type="submit">Upload a file</button>
        </div>
      </div>


      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your birthday</p>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-4">
          <input type="text" id="inputDOB" class="form-control" required autofocus>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <p style="color:gray">MM/DD/YYYY</p>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your gender</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Dropdown button
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a class="dropdown-item" href="#">Male</a>
              <a class="dropdown-item" href="#">Female</a>
              <a class="dropdown-item" href="#">Transgender</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your ethnicity</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Hispanic or Latino</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>White</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Black/African American</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>American Indian</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Alaskan Native</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Asian</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Native Hawaiian/Other Pacific Islander</p></li>
        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Do you identify with any of the following minority groups?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>LGBTQ</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Learning disabilities</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Other disabilities</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Immigrant</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Homeless</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Free or reduced price lunch</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Low-income</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Single parent household</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>NYCHA (public housing) resident</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>None of the above</p></li>
        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Do you have access to a computer or phone with internet access?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>My home has a computer with internet access</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>I have my own smartphone with internet access</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Someone who lives with me has a smartphone with internet access</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>None of the above</p></li>
        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>What time(s) do you prefer to use our services?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>3-4pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>4-5pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>5-6pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>6-7pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>7-8pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>8-9pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>9-10pm</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>10-11pm</p></li>
        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-6">
        </div>
        <div class="col-sm-4" style="text-align:left;">
         <button class="btn btn-lg btn-primary btn-block" type="submit">Next</button>
        </div>
      </div>

      <div class="col-sm-9" style="text-align:center; padding-left:35px;padding-top:40px">
        <div class="col-sm-3" style="text-align:center; padding-left:35px;padding-bottom:0px">
        </div>
        <div class="col-sm-3" style="text-align:center; padding-left:35px;padding-bottom:0px">
          <button class="btn btn-lg btn-primary btn-block" type="submit" style="width:auto">Skip this step for now</button>
        </div>
        <div class="col-sm-3" style="text-align:center; padding-left:35px;padding-bottom:0px">
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;">
        <br>
        <p>Current high school</p>
        <div class="col-sm-8" style="padding-top:0px; padding-left:0px">
          <input type="text" id="inputNickname" class="form-control" required autofocus>
        </div>
        <br><br>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Current grade</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Dropdown button
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a class="dropdown-item" href="#">Freshman</a>
              <a class="dropdown-item" href="#">Sophomore</a>
              <a class="dropdown-item" href="#">Junior</a>
              <a class="dropdown-item" href="#">Senior</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Expected high school graduation</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Dropdown button
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a class="dropdown-item" href="#">2017</a>
              <a class="dropdown-item" href="#">2018</a>
              <a class="dropdown-item" href="#">2019</a>
              <a class="dropdown-item" href="#">2020</a>
              <a class="dropdown-item" href="#">2021</a>
              <a class="dropdown-item" href="#">2022</a>
            </div>
          </div>
        </div>
      </div>


      <div class="col-sm-12" style="text-align:left; padding-left:50px;">
        <br>
        <p>Which academic subject do you find most difficult?</p>
        <div class="col-sm-8" style="padding-top:0px; padding-left:0px">
          <input type="text" id="inputNickname" class="form-control" required autofocus>
        </div>
        <br><br>
      </div>


      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>What part of the college application process do you find most difficult?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Personal Statement/Essays</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Resume</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>SAT/ACT Exams</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Choosing which schools to apply to</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Other</p></li>
        </ul>
      </div>

    <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:40px">
        <div class="col-sm-6">
          <button class="btn btn-lg btn-primary btn-block" type="submit">Back</button>
        </div>
        <div class="col-sm-4" style="text-align:left;">
         <button class="btn btn-lg btn-primary btn-block" type="submit">Next</button>
        </div>
      </div>
    <br />

    <div class="col-sm-9" style="text-align:center; padding-left:35px;padding-top:40px">
        <div class="col-sm-3" style="text-align:center; padding-left:35px;padding-bottom:0px">
        </div>
        <div class="col-sm-3" style="text-align:center; padding-left:35px;padding-bottom:0px">
          <button class="btn btn-lg btn-primary btn-block" type="submit" style="width:auto">Skip this step for now</button>
        </div>
        <div class="col-sm-3" style="text-align:center; padding-left:35px;padding-bottom:0px">
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>What is the highest level of education completed by one of your parents?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Some high school</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>High school/GED degree</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Some college</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Associate's degree</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Bachelor's degree</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Master’s degree or higher</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Not sure</p></li>
        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Does your high school have a college guidance counselor?</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Dropdown button
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a class="dropdown-item" href="#">Yes</a>
              <a class="dropdown-item" href="#">No</a>
              <a class="dropdown-item" href="#">I don't know</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your GPA</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-4">
          <input type="text" id="inputName" class="form-control" required autofocus>
        </div>
      <div class="col-sm-12" style="text-align:left; padding-left:15px;padding-top:0px">
          <p style="color:gray">Please fill out on a 4.0 scale if possible</p>
      </div>


      <div class="col-sm-12" style="text-align:left; padding-left:15px;padding-top:40px">
        <p>Please list all colleges and universities you are considering applying to.</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-bottom:40px;padding-left:0px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus >
        </div>

      </div>
    </div>
      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:20px">
        <p>Common College Documents Checklist</p>
        <h6 style="color:gray">Please check all that you currently have completed or obtained</h6>
      </div>
    <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>High School Transcript</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Common Application</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Personal Statement</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Resume</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>SAT/ACT Scores</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Letters of Recommendation</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>FAFSA</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>CSS/Financial Aid Profile</p></li>
        </ul>
      </div>


      <div class="col-sm-12" style="text-align:left; padding-left:40px;padding-top:40px">
        <div class="col-sm-6" style="text-align:left; padding-left:0px;padding-top:40px">
          <p>Academic Interests</p>

          <h6 style="color:gray">Please tell us about your interests! For example, your favorite class, a new topic you want to study, a cause you are passionate about, a professional hobby, an intended major/minor, etc.</h6>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-bottom:40px;padding-left:25px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus>
        </div>
      </div>



      <div class="col-sm-12" style="text-align:left; padding-left:15px;padding-top:40px">
        <p>Please list all your SAT and/or ACT Scores & when they were taken.</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-bottom:40px;padding-left:0px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus >
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:15px;padding-top:40px">
        <p>Have you taken any advanced (honors, AP, IB, college-level) courses? If so, please list them and your AP exam scores if applicable.</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-bottom:40px;padding-left:0px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus >
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:15px;padding-top:40px">
        <p>What extracurricular activities are you involved with in high school?</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-bottom:40px;padding-left:0px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus >
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:15px;padding-top:40px">
        <p>Is there anything else you want your admissions consultant to know?</p>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-bottom:40px;padding-left:0px">
        <div class="col-sm-6">
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus >
        </div>
      </div>


      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:40px">
        <div class="col-sm-6">
          <button class="btn btn-lg btn-primary btn-block" type="submit">Back</button>
        </div>
        <div class="col-sm-4" style="text-align:left;">
         <button class="btn btn-lg btn-primary btn-block" type="submit">Done</button>
        </div>
      </div>
</div>
</div>


</template>

<script>

import UserService from '../services/UserService'
import AuthService from '../services/AuthService'
import OnboardingService from '../services/OnboardingService'

export default {
  data() {
    return {
      isOnboarding: this.$route.path.indexOf('/onboarding') === 0,
      user: AuthService.user,
      msg: ''
    }
  },
  methods: {
    submitProfile(e){
      this.msg = ''
      if (!this.user.name || this.user.name === ''){
        this.msg = 'Please provide a first and last name';
        return;
      }
      // if (!this.user.picture || this.user.picture === ''){
      //   this.msg = 'Please provide a picture';
      //   return;
      // }

      this.msg = 'Sending...';
      UserService.setProfile(this, this.user, OnboardingService.isOnboarded() ? null : '/');
    }
  }
}
</script>

<style scoped>
h2 {
    font-size: 24px;
    text-align: left;
    font-weight: 600;
    margin-bottom: 50px;
  }

  .form-signin {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 400px;
    padding: 15px;
    margin: auto;
  }
  .form-control {
    border: none;
    box-shadow: none;
    border-radius: 0;
  }


  .form-signin .form-control:focus {
    z-index: 2;
  }

  label {
    display: block;
    text-align: left;
    font-size: 16px;
    font-weight: 400;
    color: #343440;
  }
  .form-control {
    border-bottom: 3px solid black;
    margin-bottom: 10px;
  }

  .form-control:focus {
    border-bottom: 3px solid black;
    box-shadow: none;
  }

  button[type="submit"] {
    width: 190px;
    background-color: #16D2AA;
    border: none;
    font-weight: 600;
  }

  .checkbox-grid li {
    display: block;
    float: left;
    width: 50%;
}

.checkbox-grid-singlecol li {
    display: block;
    float: left;
    width: 100%;
}

.checkbox-round {
        width: 1.3em;
        height: 1.3em;
        background-color: white;
        border-radius: 50%;
        vertical-align: middle;
        border: 1px solid #ddd;
        -webkit-appearance: none;
        outline: none;
        cursor: pointer;
    }

    .checkbox-round:checked {
        background-color: black;
    }

  .help-text {
    margin-top: 58px;
    font-weight: 300;
    text-align: left;
  }

  .help-text a {
    color: #16D2AA;
    font-weight: 700;
  }
</style>
