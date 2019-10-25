<template>
  <full-text-template
    header-title="Welcome to UPchieve!"
    lede-text="This guide will help make sure you are prepared to help students on our platform!"
  >
    <section>
      <h2>Become an "Active" Coach</h2>

      <p>
        Now that you’ve created your account, you still need to set up your
        availability and pass at least one certification quiz before you can
        start receiving students requests. Read about how to complete each of
        these steps below. We’ve also included some quick tips on how to
        maximize your requests and impact.
      </p>

      <div>
        <accordion-item label="Scheduling Your Availability">
          <p>
            Go to the <router-link to="/calendar">Schedule</router-link> page
            and select all the times you’d like to receive notifications if a
            student requests help. We recommend you select times where you
            expect to be free at least 60% of the time. Don’t worry—you’re never
            committed to picking up a request because we text more than one
            volunteer at once.
          </p>

          <div class="block-section">
            <strong>Quick Tips:</strong>
            <ul>
              <li>
                <strong>Want to get more requests?</strong> Students are most
                active on the platform from 4pm-12am ET on weekdays, so if you
                can select these times, do so!
              </li>
              <li>
                <strong>Want to be a hero?</strong> We have gaps in coverage on
                weekend mornings and Friday/Saturday evenings ET. Sign up for
                those times if you can!
              </li>
            </ul>
          </div>
        </accordion-item>
        <accordion-item label="Taking a Certification Quiz">
          <p>
            Go to the <router-link to="/training">Training</router-link> page
            and click “Take Test” to begin a certification quiz! If you’re
            familiar with the material, the average quiz is 10-15 questions and
            should take you about 15 minutes. We recommend you try the quiz once
            to get a baseline, then review our materials to fill in the gaps in
            your knowledge. You get 3 tries!
          </p>

          <div class="block-section">
            <strong>Quick Tips:</strong>
            <ul>
              <li>
                <strong>Want to get more requests?</strong> Algebra and Geometry
                are our most popular subjects. Make sure you take those quizzes
                ASAP if you can!
              </li>
              <li>
                <strong>Want to be a hero?</strong> We have the least coverage
                for Calculus. Most people aren’t able to tutor that subject, so
                if you’re one of the geniuses who can… Please take the quiz!
              </li>
            </ul>
          </div>
        </accordion-item>
      </div>
    </section>
    <section>
      <h2>Work With Students</h2>

      <p>
        After your account is “active”, you’ll start seeing texts from UPchieve
        about students that need your help! Below we’ve broken down every step
        of working with a student on UPchieve, including quick tips on how to
        have the biggest impact possible.
      </p>

      <div>
        <accordion-item label="Picking Up a Request">
          <p>
            If a student makes a request in a subject you’re certified in and at
            a time that you’ve opted in to notifications, you’ll get a text
            message from UPchieve. Our texts look like this:
          </p>

          <p>
            <img
              style="height: 100px; margin: 10px 0 20px;"
              src="~@/assets/example-text-notification.png"
            />
          </p>

          <p>
            To fulfill a request, you can either click on the link in the text
            you received or select the student from the list of waiting students
            located on the <router-link to="/dashboard">dashboard</router-link>.
          </p>

          <div class="block-section">
            <strong>Quick Tips:</strong>
            <ul>
              <li>
                <strong>Not sure how much time you have?</strong> No problem!
                The average session lasts 30 mins, so you should generally have
                at least 30 mins free when you pick up a request. But if you
                need to leave early, it’s ok! See the next section for tips on
                how to do that.
              </li>
              <li>
                <strong>Not near a computer?</strong> No problem! Everything but
                the whiteboard works on mobile browsers, so you can start
                sessions on your phone and then switch over to your computer. As
                long as you don’t click “End Session”, there will be a button to
                rejoin your active session on the Dashboard!
              </li>
              <li>
                <strong>Need a few minutes to get ready?</strong> No problem! If
                you know you can get to a computer or focus on the session
                within 3-5 minutes, you can generally still select the student
                and let them know you need a few minutes. A lot of students give
                up if they’re not paired with a coach within 5 minutes, so we
                encourage you to pick up requests and at least ask what you can
                help with to get things kicked off ASAP.
              </li>
            </ul>
          </div>
        </accordion-item>
        <accordion-item label="While In a Session">
          <p>
            After picking up a request, you’ll be placed in our virtual
            classroom. Right now, this classroom is equipped with a text-based
            chat and a whiteboard. It looks like this:
          </p>

          <p>
            [SCREENSHOT FROM DECK HERE]
          </p>

          <p>
            It’s important to be friendly and encouraging! Here’s some easy
            phrases for you to pull from in different scenarios:
          </p>

          <div class="block-section">
            <u>Starting your session</u>
            <ul>
              <li>
                “Hi [Student Name]! What can I help you with?”
              </li>
            </ul>
          </div>

          <div class="block-section">
            <u>After finishing a problem</u>
            <ul>
              <li>
                “Are there any other problems I can help you with?”
              </li>
            </ul>
          </div>

          <div class="block-section">
            <u>If you need to go early</u>
            <ul>
              <li>
                “Sorry, I need to run in a few minutes. I can try to wrap this
                problem up, but I highly encourage you to make another request
                if you still need more help! Another person should be able to
                help you.”
              </li>
            </ul>
          </div>

          <div class="block-section">
            <u>At the end of the session</u>
            <ul>
              <li>“I hope this was helpful!”</li>
              <li>“Good luck in your class!”</li>
              <li>
                “Feel free to make another request if you need more help!”
              </li>
              <li>“I really enjoyed helping you!”</li>
              <li>“Have a great night!”</li>
            </ul>
          </div>

          <div class="block-section">
            <u>If there are technical difficulties</u>
            <ul>
              <li>
                “So sorry it isn’t working! I’ll be sure to report this bug so
                we can get it fixed ASAP. In the meantime, can you please try
                refreshing? If that doesn’t work, you can also try making a new
                request.”
              </li>
            </ul>
          </div>

          <div class="block-section">
            <strong>Quick Tips:</strong>
            <ul>
              <li>
                <strong>Need to step away for a few mins?</strong> Don’t forget
                to let the student know how long you’ll be gone.
              </li>
              <li>
                <strong>Student not responding?</strong> Please wait make a few
                attempts to get their attention and wait at least 15 minutes
                before ending the session. They might just be distracted working
                on their homework!
              </li>
              <li>
                <strong>Experiencing technical difficulties?</strong> Try
                refreshing the page! Also, be sure to apologize to the student
                on our behalf.
              </li>
              <li>
                <strong>Ready to end your session?</strong> Let the student know
                you are leaving, and be sure to click “End Session”! Closing the
                tab does not end your session.
              </li>
            </ul>
          </div>
        </accordion-item>
        <accordion-item label="How to Be a Good Tutor">
          <p>
            Being a good tutor doesn’t mean you need to know everything about
            every subject. In fact, many of our best tutors start each session
            by Googling the topic in question to give themselves a refresher.
          </p>
          <p>
            Instead, being a good tutor is all about identifying gaps in
            knowledge, leading the student to the answer themselves, and
            generalizing the approaches that you teach them so they can apply it
            to other problems.
          </p>
        </accordion-item>
      </div>
    </section>
  </full-text-template>

  <!-- 
  
  <div>
    <accordion-item label=""></accordion-item>
    <accordion-item label=""></accordion-item>
  </div>

  <router-link to="/calendar">Schedule</router-link>

          <p>
            <strong>Quick Tips:</strong>
            <ul>
              <li>
                <strong></strong>
              </li>
              <li>
                <strong></strong>
              </li>
            </ul>
          </p>
    
-->
</template>

<script>
import FullTextTemplate from "@/components/FullTextTemplate";
import AccordionItem from "@/components/AccordionItem";

export default {
  name: "volunteer-guide",

  components: {
    FullTextTemplate,
    AccordionItem
  }
};
</script>

<style lang="scss" scoped>
.block-section {
  margin: 0 0 20px;
}
</style>
