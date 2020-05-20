<template>
  <full-text-template
    header-title="Welcome to UPchieve!"
    lede-text="This guide will help make sure you are prepared to support students on our platform!"
  >
    <section>
      <h2>Become an "Active" Coach</h2>

      <p>
            Now that you’ve created your account, you still need to 
            set up your availability and pass at least one certification quiz 
            before you can start receiving students requests. Read about how to 
            complete each of these steps below. We’ve also included some quick tips 
            on how to maximize your requests and impact.
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
            <p><strong>Quick Tips:</strong></p>
            <ul>
              <li>
                <strong>Want to get more requests?</strong> Students are most
                active on the platform from 8am-6pm ET on weekdays, so if you
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
            <p><strong>Quick Tips:</strong></p>
            <ul>
              <li>
                <strong>Want to get more requests?</strong> Pre-algebra, Algebra, and Geometry
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
            <p><strong>Quick Tips:</strong></p>
            <ul>
              <li>
                <strong>Not sure how much time you have?</strong> No problem!
                The average session lasts 30 mins, so you should generally have
                at least 30 mins free when you pick up a request. But if you
                need to leave early, it’s ok! See the next section for tips on
                how to do that.
              </li>
              <li>
                <strong>Not near a computer?</strong> No problem! Our app now fully works 
                on mobile browsers! If you prefer to use a computer, you can still start 
                a session on your phone and then switch over to your computer. As long as 
                you don’t click “End Session”, there will be a button to
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
            <img
              style="max-height: 350px; max-width: 100%; margin: 10px 0 20px;"
              src="~@/assets/example-session-screenshot.png"
            />
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
            <p><strong>Quick Tips:</strong></p>
            <ul>
              <li>
                <strong>Need to step away for a few mins?</strong> Don’t forget
                to let the student know how long you’ll be gone.
              </li>
              <li>
                <strong>Student not responding?</strong> Don’t leave right away! Make a few
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

          <div class="block-section">
            <p>
              <strong>Here’s how a typical tutoring session might go:</strong>
            </p>

            <ol>
              <li>
                Start with identifying the problem type.
                <ul>
                  <li>
                    (“It seems like this is about solving a system of linear
                    equations. Is that what you covered in class today?”)
                  </li>
                </ul>
              </li>
              <li>
                Ask them if they know the relevant definitions or formulas.
                <ul>
                  <li>
                    (“This is the formula you use to find the area of a circle.
                    Does it look familiar to you?”)
                  </li>
                </ul>
              </li>
              <li>
                Ask them if they know what the first (or second or third) step
                is.
                <ul>
                  <li>
                    If they do, have them complete it on the whiteboard.
                  </li>
                  <li>
                    If they don’t, tell them, and ask them if they know how to
                    complete that step.
                  </li>
                  <li>
                    (“So the first step is to calculate the degree of the
                    numerator. Do you know how to do that?)
                  </li>
                </ul>
              </li>
              <li>
                Guide them through the problem step-by-step, explaining relevant
                concepts and trying to generalize where possible so they can
                solve similar problems.
                <ul>
                  <li>
                    (“Anytime you need to find the asymptote, you will start by
                    comparing the degree of the numerator and denominator.
                    There’s only 3 possible cases / rules that you need to
                    memorize!”)
                  </li>
                </ul>
              </li>
              <li>
                Stop them when they start to go wrong. Try to explain why what
                they did was wrong and ask them if it makes sense.
                <ul>
                  <li>
                    (“Almost! There’s one more number that needs to be excluded
                    from the domain though because it leads to division by 0.”)
                  </li>
                </ul>
              </li>
              <li>
                At the end of the problem, ask a student if they know what the
                answer is now and check their final answer.
                <ul>
                  <li>
                    “That’s correct, awesome job!”
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          <div class="block-section">
            <p><strong>Quick Tips:</strong></p>
            <ul>
              <li>
                <strong>Can I give the student the answer?</strong>
                Try your best to lead the student to the answer instead. You can
                check answers (that is, tell them if it is right or wrong), but
                generally you should not give them the answer.
              </li>
              <li>
                <strong>How do I know what the student already knows?</strong>
                Check what they’ve covered so far in class, and ask if the
                methods you’re showing them look familiar. Don’t assume they’ve
                already learned anything.
              </li>
              <li>
                <strong>What if I’m stuck?</strong>
                When in doubt, Google liberally. We promise you’re better at
                Googling than the student, and a few minutes is worth making
                sure you’re giving them accurate advice! If you really can’t
                figure it out, you can apologize and let them know you’re not
                sure.
              </li>
            </ul>
          </div>
        </accordion-item>
      </div>
    </section>
    <section>
      <div class="block-section">
        <h2>Feedback & technical issues</h2>
        <p>
          UPchieve is a small nonprofit start-up, so we apologize ahead of time
          for any bugs you encounter or anything that doesn’t work as well as
          we’d like it to yet. You can help us improve in several ways:
        </p>
        <ul>
          <li>
            Fill out the feedback form after every session, especially if you
            encounter a bug, needed a special feature we don’t have yet, or got
            positive feedback from a student. Tell us what they said!
          </li>
          <li>
            Submit the
            <router-link to="/contact">contact form</router-link> when you
            encounter a bug outside of a session.
          </li>
          <li>
            Respond to all the surveys we email you. We promise we read every
            response and take your feedback seriously!
          </li>
        </ul>
      </div>
      <div class="block-section">
        <p><strong>Quick Tips:</strong></p>
        <ul>
          <li>
            <strong>How can I better help you fix bugs?</strong>
            Take screenshots of bugs whenever possible. Try to include as much
            detail as possible about what you did leading up to the bug. Tell us
            what device and browser you were using too!
          </li>
          <li>
            <strong>Are there other ways to help UPchieve?</strong>
            Yes! You can help us recruit more coaches,
            <a href="https://secure.givelively.org/donate/upchieve"
              >make a donation</a
            >, or check out
            <a href="https://upchieve.org/volunteer"
              >our other volunteer opportunities</a
            >. If you have an idea of how you can help that’s not listed, feel
            free to reach out via the
            <router-link to="/contact">contact form</router-link>!
          </li>
        </ul>
      </div>
    </section>
  </full-text-template>
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
