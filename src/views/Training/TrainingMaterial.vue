<script lang="ts">
import type { TrainingMaterial as TrainingMaterialType } from '@/services/TrainingService'
</script>

<script lang="ts" setup>
import Video from '@/views/TrainingCourseView/Material/Video.vue'
import UPchieveLogo from '@/assets/logo-document.svg'

const props = defineProps<{ material: TrainingMaterialType }>()
</script>

<template>
  <div class="material-container">
    <h2 class="material-title">{{ props.material.name }}</h2>
    <div class="material-description" v-if="props.material.description">
      {{ props.material.description }}
    </div>

    <!--    Video materials-->
    <Video
      class="video-material"
      v-if="props.material.type === 'video'"
      :resourceId="props.material.resourceId"
      :pdf="props.material.videoPDF"
      :links="props.material.links"
      cssClass="video-material"
    />

    <!--    Document materials-->
    <!--    For the test, don't embed the document, just recreate as HTML.-->
    <div v-if="props.material.type === 'document'" class="training-document">
      <UPchieveLogo class="upchieve-logo" />
      <h2
        class="document-heading"
        v-if="props.material.name === 'Review Safety Policy'"
      >
        UPchieve Student Safety Policy
      </h2>
      <h2
        class="document-heading"
        v-else-if="props.material.name === 'Review Academic Integrity Policy'"
      >
        UPchieve Academic Integrity Policy
      </h2>
      <h2
        class="document-heading"
        v-else-if="
          props.material.name ===
          'Review Diversity, Equity, and Inclusion Policy'
        "
      >
        UPchieve Diversity, Equity, and Inclusion Policy
      </h2>
      <div v-if="props.material.name === 'Review Safety Policy'">
        <div class="document-contents">
          <h3 class="document-subheading">Introduction</h3>
          Although UPchieve is a virtual platform, we still need to take
          precautions to keep students safe. This is especially important since
          the majority of students using the platform are under 18 years old.
          Students, their parents, their teachers, and our student enrollment
          partners all rely on us to create a safe and welcoming environment.

          <h3 class="document-subheading">
            Your Responsibilities As a Volunteer
          </h3>
          <span class="indent-emphasis"
            >1. Keep communication on the platform</span
          >
          <br /><br />
          All communication between UPchieve students and Academic Coaches
          should occur via UPchieve’s virtual classroom. Taking communication
          off the platform is a serious offense and also puts you at risk in the
          event that the student feels you behaved inappropriately, since we
          will have no record of that outside communication.
          <br /><br />
          If a student asks you to collaborate with them on another platform,
          such as talking via Zoom or editing their essay in Google Docs, you
          should politely refuse and remind them that communication must stay on
          the platform. While you may look at the material they send you, you
          should send any suggestions or feedback you have via the UPchieve chat
          or collaborative tools, like our whiteboard or document editor.
          <br /><br />
          You should never meet a student in real life. If we discover that any
          student and volunteer have met in person, both parties will be banned
          from UPchieve and if possible, we will report the interaction to the
          student’s parents, school, or local authorities.
          <br /><br />

          <span class="indent-emphasis">
            2. Never share or seek personally identifiable information</span
          >
          <br /><br />
          Personally identifiable information (or PII for short) is information
          that could be used to identify or track down an individual. Common
          examples of PII include:

          <ul>
            <li>Full or partial name</li>
            <li>Full or partial physical address</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Birthday or date of birth</li>
            <li>School name</li>
          </ul>

          During a session on UPchieve, the only personal information students
          and volunteers are provided with is each other’s first names. You are
          never allowed to request the PII of students on the platform.
          Additionally, you cannot share your own PII, even if the student asks
          for it.
          <br /><br />
          Instead, remind the student that in order to continue using UPchieve,
          communication must stay on the platform. If a student shares PII with
          you or tries to ask for your own PII, please let us know in the
          post-session form so we can follow up with the student and remind them
          not to do so in the future.
          <br /><br />

          <span class="indent-emphasis"
            >3. Moderate your conversation with students</span
          >
          <br /><br />
          UPchieve’s role is to be a resource for students in achieving their
          academic goals. As a result, your conversation with students should
          strike a balance between being friendly and professional. Keep the
          conversation focused on the student, and refrain from using profanity
          or language that could be interpreted as offensive or derogatory.
          <br /><br />
          While asking some questions about the student’s life may be
          appropriate or help develop a rapport (especially in college
          counseling sessions), make sure you keep the conversation appropriate.
          A good rule of thumb is to think "Would this student's parent/guardian
          be okay with this comment or question?”
          <br /><br />
          Here are some examples of questions that are/ are not acceptable:
          <br /><br />
          <u><i>Never Acceptable</i></u>
          <br /><br />
          You may never ask a student any questions that can be used to discover
          their identity, where they live, or contact them outside of our
          platform. These questions include:
          <ul>
            <li>
              Where do you live?
              <ul>
                <li>
                  Never ask for a student's address or city. State may be
                  applicable (see below)
                </li>
              </ul>
            </li>
            <li>What school do you go to?</li>
            <li>What's your phone number / email / contact information?</li>
            <li>How old are you?</li>
            <li>What's your last name?</li>
          </ul>
          <u><i>Contextually Acceptable</i></u>
          <br /><br />
          These are questions that may be important to ask in some college
          counseling sessions, but would very rarely be required for a tutoring
          session:.
          <ul>
            <li>Do you want to go to college in-state or out of state?</li>
            <li>
              What state do you live in?
              <ul>
                <li>
                  Unlike asking the town/city a student lives in, knowing what
                  state a student lives in can give you the context to provide
                  better support (e.g.any regional specific scholarships or
                  schools nearby)
                </li>
              </ul>
            </li>
            <li>
              What grade are you in? (This is useful to know what potential
              exams a student should be studying for, PSAT/SATs, when to visit
              colleges, etc.)
            </li>
          </ul>
          <u><i>Always Acceptable</i></u>
          <br /><br />
          These are questions that you can ask and that may provide you context
          on how the session should be steered.
          <ul>
            <li>How’s your day going?</li>
            <li>How’s the school year going?</li>
            <li>What subjects or activities do you like best / least?</li>
            <li>What kind of homework does your teacher assign?</li>
            <li>How do you work through problems?</li>
            <li>How do you prepare for an exam / study?</li>
            <li>How do you feel about your teacher/classes?</li>
          </ul>

          <span class="indent-emphasis">4. Keep Chats Private</span>
          <br /><br />
          In the course of volunteering with UPchieve, you will have many
          private conversations with students, some of which may be heartwarming
          or eye opening. However, keep in mind that students speak to their
          coaches in confidence and often assume that you will not share those
          conversations with anyone else. Never post screenshots of sessions
          online.
          <br /><br />

          <span class="indent-emphasis"
            >5. Report Safety Concerns & Behavior In Need of Immediate
            Attention</span
          >
          <br /><br />
          Reporting a student is designed to keep UPchieve a safe and positive
          environment for both coaches and students. In every session you have a
          “report” button on the top of the chat box. Use this button if
          students are in need of immediate attention from UPchieve staff.
          <br /><br />
          <img
            class="indent-emphasis"
            src="@/assets/ReportSessionScreenshot.png"
            alt="Screenshot of the Report button in an UPchieve session"
          />
          <br /><br />
          <span class="indent-emphasis"
            >A. Reporting a student who is extremely rude or inappropriate</span
          >
          <br /><br />
          When you choose this option the student’s account will be temporarily
          suspended while we review the incident. In some cases, your report can
          result in a permanent ban for the student. You should never feel
          uncomfortable or disrespected on UPchieve and we encourage you to
          report bad behavior.
          <br /><br />
          When deciding whether or not to report a student, remember to give
          them the benefit of the doubt and think about their intent. If you
          encounter a behavior that could be due to reluctance to learn or a
          subpar learning environment,
          <strong>please let us know in the post-session form instead.</strong>
          <br /><br />
          Asking for help is hard, so we want to be sure we only suspend
          students who are behaving badly and not those who lack motivation.
          <br /><br />
          <i>Examples of situations you should report:</i>
          <ul>
            <li>The student is using inappropriate language</li>
            <li>The student is asking you overly personal questions</li>
            <li>The student is bullying or trolling</li>
          </ul>

          <i
            >Examples of situations to tell us about in the post-session survey
            instead:</i
          >
          <ul>
            <li>
              The student is slow to respond, doesn’t respond at all, or
              abruptly ends the session
            </li>
            <li>
              The student is not engaging in the questions you ask or you
              perceive a lack of effort
            </li>
            <li>The student is asking you for the answers</li>
          </ul>

          <span class="indent-emphasis"
            >B. Reporting a student whose immediate safety you are worried
            about</span
          >
          <br /><br />
          UPchieve is only qualified to provide academic support to students—we
          are not qualified to support a student in a crisis. In rare cases, a
          student may open up to you about a situation that you deem to be
          unsafe for the student or those around them. If this happens, you
          should take these steps:
          <ol>
            <li>
              Report the student to UPchieve. We want to be able to respond as
              quickly as possible when this happens. After reporting, you can
              continue the session with steps 2 - 5.
            </li>
            <li>
              Validate their experience:
              <ul>
                <li>
                  You can say: "I hear you, it sounds like you're going through
                  a lot."
                </li>
              </ul>
            </li>
            <li>
              Explain that you are not the right person in this situation
              <ul>
                <li>
                  You can say: “I'm not the right person to help you with what
                  you need. I'm a tutor and UPchieve is only for academic
                  support.”
                </li>
              </ul>
            </li>
            <li>
              Help them make a plan by sharing a qualified place they can turn
              to.
              <ul>
                <li>
                  You can say: “It sounds like you need to talk to someone who
                  can help you beyond your academic needs and you should. There
                  are really supportive people that you can reach [choose a
                  resource from below] and they’ll know how to help you because
                  this is what they do.”
                </li>
                <li>
                  Resources to point them to:
                  <ul>
                    <li>
                      Mental health crisis:
                      <a class="link" href="https://www.crisistextline.org"
                        >www.crisistextline.org</a
                      >
                    </li>
                    <li>
                      Emotional support (not a crisis):
                      <a class="link" href="https://need2text.com/"
                        >https://need2text.com/</a
                      >
                    </li>
                    <li>
                      Child abuse:
                      <a class="link" href="https://childhelphotline.org/"
                        >https://childhelphotline.org/</a
                      >
                    </li>
                    <li>
                      Homelessness:
                      <a
                        class="link"
                        href="https://www.1800runaway.org/youth-teens/get-help"
                        >https://www.1800runaway.org/youth-teens/get-help</a
                      >
                    </li>
                    <li>
                      LGBTQ support:
                      <a class="link" href="https://www.thetrevorproject.org/"
                        >https://www.thetrevorproject.org/</a
                      >
                    </li>
                    <li>
                      Sexual assault:
                      <a class="link" href="https://hotline.rainn.org/online"
                        >https://hotline.rainn.org/online</a
                      >
                    </li>
                    <li>
                      Unhealthy romantic relationship:
                      <a class="link" href="https://www.loveisrespect.org/"
                        >https://www.loveisrespect.org/</a
                      >
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              After these steps, you can continue to be present and validate
              their experience or you can end the session.
              <ul>
                <li>
                  You can say: “I’m glad you’re looking for help today and I
                  hope the resources I shared were helpful! Please reach out to
                  the resource I shared and I will be rooting for you.”
                </li>
              </ul>
            </li>
          </ol>

          <h3 class="document-subheading">Consequences</h3>
          <strong
            >Any violation of the student safety policy could result in your
            immediate termination as a volunteer with UPchieve.</strong
          >
          Depending upon the severity of the violation, a volunteer may:
          <ul>
            <li>Receive written warning</li>
            <li>Be temporarily suspended from the platform</li>
            <li>Be fully banned from the platform</li>
          </ul>
        </div>
      </div>

      <div
        v-else-if="props.material.name === 'Review Academic Integrity Policy'"
      >
        <div class="document-contents">
          <h3 class="document-subheading">Introduction</h3>
          Students, along with their parents and educators, expect UPchieve to
          uphold academic integrity in addition to providing high-quality
          tutoring and college counseling. We define academic integrity as “the
          commitment to and demonstration of honest and moral behavior in an
          academic setting”. Coaches play a critical role in upholding academic
          integrity by ensuring that students are actively learning during
          sessions. We’ve written these guidelines to help you understand
          UPchieve's standards for coaching and how you can ensure that students
          leave their sessions better equipped to progress in school.
          <br /><br />

          <h3 class="document-subheading">
            Your Responsibilities As a Volunteer
          </h3>
          <span class="indent-emphasis">1. Encourage active participation</span>
          <br /><br />
          While students may not know what the answer to their question is right
          away, they often have an idea of how to get there! To help students
          get to the answer themselves, tutors must ask a sequence of questions
          to guide student thinking and provide feedback so that students know
          if they’re on the right track. Ultimately, we want students to build
          confidence by helping them discover the solution for themselves rather
          than handing it to them.
          <br /><br />
          Additionally, if a student sends you a question, you should not
          respond with your immediate thoughts on how to approach it. Instead,
          ask what they think the first step should be. If a student is clearly
          struggling or confused on a particular problem, you must make a
          judgment call and decide if they truly need your help or if they want
          you to do their work. If you can tell that the student is attempting
          to solve the problem, engaging in the conversation, and asking
          questions, you should continue to support them in answering the
          question.
          <br /><br />

          <span class="indent-emphasis"
            >2. Refrain from giving students the answers</span
          >
          <br /><br />
          UPchieve Academic Coaches provide support rather than answers, so that
          students will work to understand the concepts and successfully apply
          them on future assignments and assessments. Students need to be active
          participants in every session; they cannot send a question and expect
          you to do all the work. Giving answers is not only a direct violation
          of our Academic Integrity policy, but it could also result in negative
          consequences for the student (e.g., not actually learning the
          material, disciplinary action, loss of credit for an assignment,
          etc.).
          <br /><br />

          <span class="indent-emphasis">3. Verify student answers</span>
          <br /><br />
          UPchieve coaches <strong>are</strong> allowed to verify students'
          answers on the platform. Students can ask if they answered a certain
          number of questions correctly, and you are permitted to let them know
          which are correct and incorrect. It may be tempting to flag this as
          cheating, or feel cautious about helping them in this manner, but it
          <strong>is allowed</strong>! In fact, we explicitly mention to our
          student partners that that is one of the proper use cases of UPchieve.
          <br /><br />
          Even in this scenario, asking prompting questions while verifying
          their answers is a great way to facilitate the tutoring session. For
          example, even if a student had all the right answers, you could say
          “These all look right to me, great job! Is there anything about the
          questions you were confused or unsure about?”. This allows the student
          to reflect on their work and gives you an opportunity to continue
          working with the student and improve their understanding.
          <br /><br />

          <span class="indent-emphasis"
            >4. Assume the best of your students!</span
          >
          <br /><br />
          You should not assume a student wants answers or preface a tutoring
          session by letting them know you can’t give them answers. It may seem
          tempting to lay out expectations right from the beginning, but sending
          some form of “I can’t give you the answer” as one of your first
          messages to a student can make them feel defensive and judged. Many
          students on the platform may seem like they just want the answer, but
          in reality they genuinely just don’t know where to begin.
          <br /><br />
          Reserve that line for situations in which the student is explicitly
          asking for answers, or if you’ve been trying to work with the student
          for a while and they seem to not be involved at all. Otherwise,
          continue to assume the student has the best intentions and try to get
          them more involved. With your guidance, not only will they be able to
          find the answer, but they’ll be able to build the skills they need to
          solve similar problems going forward
          <br /><br />

          <span class="indent-emphasis"
            >5. Refrain from writing students' essays for them</span
          >
          <br /><br />
          As a coach, your role is to focus on improving the writer, not just
          the essay they’re working on. It is crucial that you help students by
          modeling the critical thinking skills necessary to craft a well
          written essay. Copy editing, writing or rewriting sentences or
          paragraphs, or providing a completed outline for students takes away
          their power to learn and develop as a writer. Instead, ask students
          questions like: Who is the audience for this essay? What is the main
          point you want them to know after reading your essay? How can we make
          this transition clearer?
          <br /><br />
          Additionally, personal statements for college admissions are an
          opportunity for the student to tell their story. While you may provide
          the student with feedback on how they can make their essay even
          clearer, you can't take control from the student and tell them to
          write things they wouldn’t have originally. In addition, college
          counselors read thousands of essays. They know what a high school
          student sounds like and is capable of writing. By writing a student’s
          essay, or sections of it, you risk the school becoming suspicious of
          the student and rejecting them.
          <br /><br />

          <span class="indent-emphasis"
            >6. Never help a student cheat on a graded assessment or exam</span
          >
          <br /><br />
          Helping a student on a graded assessment is forbidden, as they’re
          typically meant to be completed without outside support. If the
          student lets you know they need help with a quiz, or if you suspect
          they’re asking test questions, let them know that you can’t explicitly
          help them with any of the questions. Instead, encourage them to do
          their best and suggest that they come back to get help studying for
          their next assessment.
          <br /><br />

          <h3 class="document-subheading">Consequences</h3>
          Remember, this guide is to ensure you know what can and can’t be done
          on our platform. We trust our volunteers to do their best when working
          with students. If you’re ever really unsure about a particular
          scenario, please complete the feedback form, and we’ll reach out if we
          have any feedback.
          <br /><br />
          We believe that most of our volunteers will not break this rule
          intentionally, and when we see it occur, we will reach out with an
          explanation of why the policy was broken. If we deem the violation
          especially severe, or if a volunteer repeatedly makes the same
          mistake, that can result in us pausing your account until you complete
          a live training with us. If it continues after that, your account may
          be permanently banned from the platform.
        </div>
      </div>

      <div
        v-else-if="
          props.material.name ===
          'Review Diversity, Equity, and Inclusion Policy'
        "
      >
        <div class="document-content">
          <h3 class="document-subheading">Introduction</h3>
          Students, along with their parents and educators, expect UPchieve to
          uphold academic integrity in addition to providing high-quality
          tutoring and college counseling. We define academic integrity as “the
          commitment to and demonstration of honest and moral behavior in an
          academic setting”. Coaches play a critical role in upholding academic
          integrity by ensuring that students are actively learning during
          sessions. We’ve written these guidelines to help you understand
          UPchieve's standards for coaching and how you can ensure that students
          leave their sessions better equipped to progress in school.
          <br /><br />

          <h3 class="document-subheading">
            Your Responsibilities As a Volunteer
          </h3>
          <span class="indent-emphasis"
            >1. Treat each student as an individual</span
          >
          <br /><br />
          Treat every student you have as an individual, after a few sessions
          you'll recognize how different each student is even though they may
          share a similar socio-economic status and age group. Recognize that
          our students do not fit into the stereotypes and
          <a
            class="link"
            href="https://www.nytimes.com/video/us/100000004818663/peanut-butter-jelly-and-racism.html"
            >implicit biases</a
          >
          we all hold and actively strive to question and unlearn the
          stereotypes you've acquired throughout your life.
          <!--          @TODO: footnote-->
          <br /><br />

          <span class="indent-emphasis"
            >2. Make all students feel respected and supported</span
          >
          <br /><br />
          We support all students, regardless of their skill or knowledge level.
          Students who attend low-income schools have less access to high
          quality teaching and as a result are more likely to be
          <a class="link" href="https://files.eric.ed.gov/fulltext/ED598342.pdf"
            >behind grade level</a
          >. Comments that make judgments about gaps in skills such as, "you
          should already know this,” or “this is an easy one for 10th grade”
          degrade a student’s confidence. Never make a student feel judged or
          guilty for not understanding, instead work to understand how to tailor
          your coaching to meet the needs of students while boosting their
          self-confidence so that they can thrive as learners. <br /><br />

          <span class="indent-emphasis"
            >3. Hold high expectations for every student</span
          >
          <br /><br />
          Each UPchieve student has different academic strengths and goals. We
          want to avoid making assumptions about a student’s capacity for
          academic success. Research shows that actions like rewriting someone’s
          essay or solving a problem for them give students the message that
          they are incapable of learning and negatively impacts their academic
          outcomes. By having high expectations for the capacity of every
          UPchieve student, we2 signal to them that they are capable of
          achieving their goals.
          <br /><br />
          <!--          @TODO footnote-->

          <span class="indent-emphasis"
            >4. Be mindful of the impact of your words</span
          >
          <br /><br />
          A casual joke or comment might seem trivial to you, but for a student,
          it could impact how they view themselves in this world. This is
          especially the case when a comment centers on a part of a person’s
          identity, such as race, gender, sexual orientation, immigration
          status, etc. because studies suggest that microaggressions will have
          negative social, emotional, and academic outcomes. Remember, it’s
          critical that you be mindful and intentional with the words you use on
          UPchieve.
          <br /><br />

          <span class="indent-emphasis"
            >5. Actively work on eliminating your biases and assumptions</span
          >
          <br /><br />
          Depending on your own background, what you were taught growing up,
          where you live, and other dimensions of your identity, it’s very
          common for individuals to have biases that they’re completely unaware
          of. These implicit biases can influence your actions in ways you don’t
          notice, ultimately hampering your ability to provide high-quality
          academic support to students from marginalized groups.
          <br /><br />
          At UPchieve, we want our coaches to work on recognizing and combating
          their biases on an ongoing basis through taking concrete actions
          <ul>
            <li>
              <strong><i>Action 1:</i></strong> Become aware of your own biases
              <ul>
                <li>
                  The
                  <a
                    class="link"
                    href="www.ncbi.nlm.nih.gov/pmc/articles/PMC3603687/"
                    >first step</a
                  >
                  to combating biases is to become aware of them. One way to do
                  this is to take the well researched
                  <a
                    class="link"
                    href="https://implicit.harvard.edu/implicit/takeatest.html"
                    >implicit association test</a
                  >.
                </li>
              </ul>
            </li>

            <li>
              <strong><i>Action 2:</i></strong> Question your biases & engage in
              perspective talking
              <ul>
                <li>
                  Once you’re aware of biases, you can become more mindful of
                  them. When you feel yourself slipping into a negative bias,
                  ask yourself why. What lived experiences, social norms, or
                  parts of your identity are influencing your actions? Could
                  there be another way of interpreting the interaction? Learning
                  to apply this type of
                  <a
                    class="link"
                    href="https://www.aafp.org/pubs/fpm/issues/2019/0700/p29.html"
                    >introspection</a
                  >
                  has been proven to lessen implicit bias.
                </li>
              </ul>
            </li>

            <li>
              <strong><i>Action 3:</i></strong> Pick up lots of sessions
              <ul>
                <li>
                  Research has demonstrated that
                  <a
                    class="link"
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5507417/"
                    >intergroup contact</a
                  >
                  and exposure to counter-stereotypical examples decreases
                  implicit biases. It's much more difficult to rely on
                  stereotypes, or incorrect implicit biases, about students from
                  low-income backgrounds as a whole if you have meaningful
                  experiences with people from that group.
                </li>
              </ul>
            </li>

            <li>
              <strong><i>Action 4:</i></strong> Keep learning!
              <ul>
                <li>
                  Becoming aware of our own biases is a great first step, but
                  <a
                    class="link"
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3603687/"
                    >studies</a
                  >
                  have shown that we need to become concerned about the
                  consequences of implicit bias in order to be spurred into
                  action.
                </li>
              </ul>
            </li>
          </ul>
          <br /><br />

          <h3 class="document-subheading">Consequences</h3>
          <strong
            >Any violation of the DEI policy could result in your immediate
            termination as a volunteer with UPchieve.</strong
          >
          Depending upon the severity of the violation and our perception of
          your intentions, a volunteer may receive written warning, have their
          account put on probation, be temporarily suspended from the platform,
          or be fully banned from the platform
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.material-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-content: center;
  align-items: center;
  gap: 8px;
}

.material-title {
  @include font-category('display-small');
}

.video-material {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  :deep(.link) {
    font-weight: bold;
  }
}

:deep(.document) {
  width: 60%;
}

.training-document {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 80%;

  .upchieve-logo {
    width: 200px;
    height: auto;
  }

  .document-heading {
    color: $c-success-green;
    @include font-category('display-small');
    font-weight: bold;
  }

  .document-subheading {
    color: $c-success-green;
    @include font-category('subheading');
    font-weight: bold;
  }

  .indent-emphasis {
    position: relative;
    left: 5%;
    font-weight: bold;
  }

  .link {
    font-weight: bold;
  }
}
</style>
