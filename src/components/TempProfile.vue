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
          <p style="color:gray">First</p>
        </div>
        <div class="col-sm-4" style="text-align:left; padding-left:35px;">
          <p style="color:gray">Last</p>
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
              <a class="dropdown-item" href="#">Action</a>
              <a class="dropdown-item" href="#">Another action</a>
              <a class="dropdown-item" href="#">Something else here</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your ethnicity</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
        </ul>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Do you identify with any of the following minority groups?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
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
              <a class="dropdown-item" href="#">Action</a>
              <a class="dropdown-item" href="#">Another action</a>
              <a class="dropdown-item" href="#">Something else here</a>
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
              <a class="dropdown-item" href="#">Action</a>
              <a class="dropdown-item" href="#">Another action</a>
              <a class="dropdown-item" href="#">Something else here</a>
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

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px"> 
          <div class="dropdown">
            <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Dropdown button
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <a class="dropdown-item" href="#">Action</a>
              <a class="dropdown-item" href="#">Another action</a>
              <a class="dropdown-item" href="#">Something else here</a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>What time are you most likely to use our online, on-demand services?</p>
      </div>

      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
        </ul>
      </div>







      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Do you have internet access at home?</p>
      </div>
      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid-singlecol">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>

        </ul>
      </div>
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
        <p>Does your high school have a college guidance counselor?</p>
      </div>
      <div class="col-sm-4" style="text-align:left; padding-left:30px;padding-top:0px">
        <ul class="checkbox-grid-singlecol">
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>

        </ul>
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
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
            <li><input type="checkbox" class="checkbox-round" name="text2" value="value2" /><p>Text 2</p></li>
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
          <input type="text" id="inputPicture" style="width:600px; height:100px;border:1px solid black" required autofocus >
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

      <div class="row">
        <div class="col-sm-12">
          <div class="cloudwok-embed" data-wokid="d2RX" data-hide-upload-success-msg="y">
            <form class="cloudwok-upload">
              <input type="file" />
            </form>
            <div class="cloudwok-upload-files"> </div>
            <div class="cloudwok-upload-message"></div>
            
          </div>
        </div>
      </div>
    





          



</template>

<script>

(function(window, document) {
        var loader = function() {
          var script = document.createElement('script'),
          tag = document.getElementsByTagName('script')[0];
          script.src = 'https://www.cloudwok.com/cdn-vassets/javascripts/cw.js';
          tag.parentNode.insertBefore(script, tag);
        };
        window.addEventListener ? window.addEventListener('load', loader, false) :
        window.attachEvent('onload', loader);
      })(window, document);



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
