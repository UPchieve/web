<template>
    <div class="contact">
        <h1 class="header">Contact Us</h1>
        <div class="body-container">
            <p>Let us know how we can help you by filling out this form! We will get back to you as soon as possible. Alternatively, you can always email us directly at <a href="mailto:support@upchieve.org">support@upchieve.org</a>.</p>
            
            <br />
            
            <form class="form-horizonal" action="mailto:aly.murray@upchieve.org" method="post" enctype="text/plain">
                <div class="col-sm-8">
                    <div class="form-group">
                        <label for="email">Your email</label>
                        <input class="form-control" type="email" value="" name="email" required />
                    </div><br /><br />
                </div>
                <div class="col-sm-12">
                    <div class="form-group">
                        <label for="topic">Pick the topic that best matches what you are contacting us about.</label><br />
                        
                        <div class="col-sm-5 margin-fix">
                            <select class="form-control" name="topic" required>
                                <option>Select an option</option>
                                <option>Technical issues while using the web app</option>
                                <option>Math question</option>
                                <option>College application question</option>
                                <option>Feedback</option>
                            </select><br /><br />
                        </div>
                    </div>
                </div>
                <div class="col-sm-12">
                    <div class="form-group">
                        <label for="comments">Tell us more!</label>
                        <textarea class="form-control" name="comments" rows="3" /><br /><br />
                    </div>
                </div>
                <div class="buttons">
                    <div class="buttons-left">
                        <button type="reset">Cancel</button>
                    </div>
                    <div class="buttons-right">
                        <button type="submit">Submit</button>   
                    </div>
                </div>
            </form>
        </div>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>

.contact {
  color: #73737A;
}

.header {
  display: flex;
  padding: 30px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.body-container {
  margin: 30px;
  text-align: left;
}

a:link, a:active, a:visited {
  color: #15d2aa;
  font-weight: bold;
  text-decoration: none;
}

.margin-fix {
  padding-left: 0;
}

label {
  font-weight: normal;
}

.form-control {
  border: 0;
  border-bottom: 2px solid #15d2aa;
  border-radius: 0;
  box-shadow: none;
}

.form-control:focus {
  border-color: #15d2aa;
}

input:focus,
select:focus {
  box-shadow: none;
  outline: none;
}

textarea {
  border: 2px solid #15d2aa !important;
}

.buttons {
  margin: 0 15px 0 15px;
}

.buttons:after {
  clear: both;
}

.buttons-left {
  float: left;
}

.buttons-right {
  float: right;
}

.buttons button {
  background-color: #f6f6f6;
  border: 0;
  border-radius: 50px;
  color: #15d2aa;
  font-weight: bold;
  padding: 15px 45px;
  text-transform: uppercase;
}
</style>
