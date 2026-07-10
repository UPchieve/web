<script lang="ts" setup>
import type { SimplifiedUpchieveTrainingModule } from '@/views/TrainingCourseView/types'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { defineAsyncComponent } from 'vue'
import TrainingPage from '@/views/TrainingCourseView/Quizzes/TrainingPage.vue'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import ExternalResourceLink from '@/views/TrainingCourseView/ExternalResourceLink.vue'
import SafetyCommunicationScreenUrl from '@/assets/Training/safety_communication_screen.avif?url'
import SafetyCommunicationScreenFallbackUrl from '@/assets/Training/safety_communication_screen.png?url'
import CoachLaptopUrl from '@/assets/Training/coach_laptop.avif?url'
import CoachLaptopFallbackUrl from '@/assets/Training/coach_laptop.png?url'
import ProbingQuestionsUrl from '@/assets/Training/probing_questions.avif?url'
import ProbingQuestionsFallbackUrl from '@/assets/Training/probing_questions.png?url'
import BreakDownConceptsUrl from '@/assets/Training/break_down_concepts.png?url'
import EncourageStudentsUrl from '@/assets/Training/encourage_students.avif?url'
import EncourageStudentsFallbackUrl from '@/assets/Training/encourage_students.png?url'
import GiveSpecificPraiseUrl from '@/assets/Training/give_specific_praise.avif?url'
import GiveSpecificPraiseFallbackUrl from '@/assets/Training/give_specific_praise.png?url'
import BeYourselfUrl from '@/assets/Training/be_yourself.avif?url'
import BeYourselfFallbackUrl from '@/assets/Training/be_yourself.png?url'
import UnderstandAssignmentChatMsgGreenUrl from '@/assets/Training/understand_assignment_chat_ coach_green.png?url'
import UnderstandAssignmentChatMsgWhiteUrl from '@/assets/Training/understand_assignment_chat_ coach_white.png?url'
import WhatLearnersKnowLeftUrl from '@/assets/Training/what_learners_know_left.png?url'
import WhatLearnersKnowRightUrl from '@/assets/Training/what_learners_know_right.png?url'
import InformationBubbleUrl from '@/assets/Training/information_bubble.png?url'
import DeiActiveIlloUrl from '@/assets/Training/dei_active_illo.png?url'
import DeiClassIlloUrl from '@/assets/Training/dei_class_illo.avif?url'
import DeiClassIlloFallbackUrl from '@/assets/Training/dei_class_illo.png?url'
import DeiExpectationsIlloUrl from '@/assets/Training/dei_expectations_illo.avif?url'
import DeiExpectationsIlloFallbackUrl from '@/assets/Training/dei_expectations_illo.png?url'
import DeiLaptopIlloUrl from '@/assets/Training/dei_laptop_illo.avif?url'
import DeiLaptopIlloFallbackUrl from '@/assets/Training/dei_laptop_illo.png?url'
import DeiPlantIlloUrl from '@/assets/Training/dei_plant_illo.png?url'
import SafetyReportChatBoxesUrl from '@/assets/Training/safety_report_chat_boxes.png?url'

const RightArrowGreen = defineAsyncComponent(
  () => import(`@/assets/Training/right_arrow_green.svg`)
)

const store = useStore()
const props = defineProps<{
  module: SimplifiedUpchieveTrainingModule
  hasPreviousModule: boolean
  onPrevious: () => void
  onNext: () => void
}>()

const isMobile = computed(() => store.getters['app/mobileMode'])

function goToResource(externalLink: string) {
  AnalyticsService.captureEvent(EVENTS.TRAINING_CLICKED_ON_EXTERNAL_LINK, {
    link: externalLink,
  })
  window.open(externalLink, '_blank')
}
</script>

<template>
  <TrainingPage>
    <template v-slot:main-content>
      <div v-if="props.module.key === 'introduction'" class="module-intro">
        <strong>OVERVIEW</strong>
        <p>
          In this training, you'll learn how to be a successful academic coach
          on UPchieve.
        </p>
        <p>
          Once you've completed UPchieve Training and your security screening,
          you'll meet students like Aaron, an UPchieve student alumni who was
          recently admitted to Yale University. Hear Aaron's story in the video
          below!
        </p>

        <!--        @TODO move to Vimeo-->
        <div class="video-content">
          <iframe
            src="https://www.youtube.com/embed/zlxwGBg4fqU?si=Pf6jGYEU30TaipU8"
            title="YouTube video player"
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
              web-share;
            "
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      <div
        v-else-if="
          props.module.material.materialKey ===
          'UPCHIEVE_TRAINING-IMPLEMENTING_EFFECTIVE_COACHING_STRATEGIES'
        "
      >
        <div class="section">
          <p>
            Effective coaching supports students' learning, helping them build
            skills, knowledge, and confidence as they grow. This training will
            help you use proven strategies to make every session impactful.
          </p>

          <div class="video-content">
            <iframe
              title="vimeo-player"
              src="https://player.vimeo.com/video/760386859?h=abee3e6389"
              frameborder="0"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="
                autoplay;
                fullscreen;
                picture-in-picture;
                clipboard-write;
                encrypted-media;
                web-share;
              "
              allowfullscreen
            ></iframe>
            <button
              class="video-transcript-link"
              @click="
                goToResource(
                  'https://cdn.upchieve.org/training-courses/upchieve101/video-decks/implementing-effective-coaching-strategies-deck.pdf'
                )
              "
              type="button"
            >
              <span>Video Transcript & Slides</span><right-arrow-green />
            </button>
          </div>

          <hr class="divider" />
          <h2>What Makes an Effective Coach?</h2>
          <p>
            Great coaches are equally supportive and challenging. They help
            students feel welcome, encourage effort, and push them to think for
            themselves.
          </p>
          <div class="coaching-strategies-grid">
            <div class="coaching-strategies-item two-col">
              <div>
                <h3>1. Build Rapport</h3>
                <p class="main-text">
                  Start every session with a friendly greeting and welcome the
                  student by name.
                </p>
                <p class="main-text">
                  While sessions are mostly chat-based, you can still
                  communicate positivity with friendly language, emojis 🎉, and
                  punctuation (!) to build trust with students.
                </p>
              </div>
              <div class="mobile-center">
                <picture>
                  <source :srcset="CoachLaptopUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="CoachLaptopFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
            </div>

            <div class="coaching-strategies-item two-col">
              <div>
                <h3>2. Understand the Assignment or Task</h3>
                <p class="main-text">
                  Ask questions to clarify what the student is working on.
                  Ensure you have the information you need to support and set
                  reasonable expectations for the time you have.
                </p>
              </div>
              <div>
                <div>
                  <img
                    class="img"
                    :src="UnderstandAssignmentChatMsgGreenUrl"
                    type="image/png"
                  />
                </div>
                <div>
                  <img
                    class="img"
                    :src="UnderstandAssignmentChatMsgWhiteUrl"
                    type="image/png"
                  />
                </div>
              </div>
            </div>

            <div class="coaching-strategies-item full">
              <h3>3. Determine What Learners Know & Start There</h3>
              <p class="main-text">
                Use questions to find out what the student already understands.
                If the student didn't already tell you, ask them what they need
                help on and then tailor your approach to their needs.
              </p>
            </div>

            <div class="what-learners-know">
              <div>
                <img
                  class="img"
                  :src="WhatLearnersKnowLeftUrl"
                  type="image/png"
                />
              </div>
              <div>
                <img
                  class="img"
                  :src="WhatLearnersKnowRightUrl"
                  type="image/png"
                />
              </div>
            </div>

            <div class="coaching-strategies-item full">
              <p class="main-text">
                Remember, students are coming to UPchieve because they are
                struggling with an assignment or task, and your job is to
                support them without judgement.
              </p>
            </div>

            <div class="coaching-strategies-item two-col">
              <div>
                <picture>
                  <source :srcset="ProbingQuestionsUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="ProbingQuestionsFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
              <div>
                <h3>4. Ask Probing Questions</h3>
                <p class="main-text">
                  Questions are your most powerful coaching tool to actively
                  engage students in learning. They help students clarify their
                  thinking, guide them to the next step, and check their
                  understanding.
                </p>
                <p class="main-text">
                  Challenge students to learn concepts and accomplish their own
                  goals with your support. Instead of giving answers, ask:
                  <i>'How did you get that?'</i>, or
                  <i>'How are ... and ... similar?'</i>
                </p>
              </div>
            </div>

            <div class="coaching-strategies-item two-col">
              <div>
                <img class="img" :src="BreakDownConceptsUrl" type="image/png" />
              </div>
              <div>
                <h3>5. Break Down Concepts</h3>
                <p class="main-text">
                  If a student is struggling, break down complex ideas into
                  manageable, smaller steps.
                </p>
                <p class="main-text">
                  Use examples, outlines, or visual aids to make concepts
                  clearer. You may have to explain foundational concepts in
                  multiple ways.
                </p>
              </div>
            </div>

            <div class="coaching-strategies-item full">
              <h3>6. Encourage Students</h3>
              <p class="main-text">
                Coaching is as much about building student confidence as it is
                about supporting their academic journey. It takes courage to ask
                for help, so always encourage students to make an effort and
                persevere, especially when they struggle or make mistakes.
              </p>
              <p class="main-text">
                Aim for every student to leave feeling more confident and
                willing to return to UPchieve for support.
              </p>
            </div>

            <div class="coaching-strategies-item full">
              <picture>
                <source :srcset="EncourageStudentsUrl" type="image/avif" />
                <img
                  class="img"
                  :src="EncourageStudentsFallbackUrl"
                  type="image/png"
                />
              </picture>
            </div>

            <div class="coaching-strategies-item two-col">
              <div>
                <h3>7. Give Specific Praise</h3>
                <p class="main-text">
                  Learning is hard, especially if students are stressed or
                  feeling behind.
                </p>
                <p class="main-text">
                  Sharing specific, authentic, and action-oriented praise is a
                  great way to keep students motivated to keep learning. Give
                  details about what they did well, celebrate progress, and
                  focus on persistence vs. getting answers right.
                </p>
              </div>
              <div>
                <picture>
                  <source :srcset="GiveSpecificPraiseUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="GiveSpecificPraiseFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
            </div>

            <div class="coaching-strategies-item two-col">
              <div>
                <h3>8. Be Yourself! You'll be amazing :)</h3>
                <p class="main-text">
                  Don't feel overwhelmed by these strategies, you're going to do
                  great!
                </p>
                <p class="main-text">
                  Bring your personality to sessions, be patient, and remember
                  that coaching skills improve with each session you coach. Our
                  UPchieve community is always here to help you.
                </p>
              </div>
              <div>
                <picture>
                  <source :srcset="BeYourselfUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="BeYourselfFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
            </div>
          </div>

          <hr class="divider" />
          <h3 class="all-caps-heading">DIVE DEEPER</h3>
          <button
            class="link"
            @click="
              goToResource(
                'https://cdn.upchieve.org/training-courses/upchieve101/upchieve-coaching-strategies-v2.pdf'
              )
            "
            type="button"
          >
            UPchieve Coaching Strategies & Questions
            <right-arrow-green class="arrow" />
          </button>
        </div>
      </div>
      <div v-else-if="props.module.key === 'academic-integrity'">
        <div class="section">
          <p>
            At UPchieve, students, parents, and educators trust us to provide
            high-quality support.
          </p>
          <p>
            Academic integrity means always behaving honestly, helping students
            actively learn, and not giving them the answers. Here's how you can
            uphold these standards in every session.
          </p>

          <div class="video-content">
            <iframe
              title="vimeo-player"
              src="https://player.vimeo.com/video/776267126?h=4b09b31c01"
              frameborder="0"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="
                autoplay;
                fullscreen;
                picture-in-picture;
                clipboard-write;
                encrypted-media;
                web-share;
              "
              allowfullscreen
            ></iframe>
          </div>

          <hr class="divider" />
          <h2>Your Responsibilities as a Volunteer</h2>
          <p>
            Your job is to help students think through assignments, rather than
            simply giving them the answers. Ask a sequence of probing questions,
            give feedback, guide student thinking, and encourage students to try
            their own ideas. This builds confidence and equips students to
            succeed in school.
          </p>

          <table class="do-donts-table">
            <tr class="do-donts-row">
              <th class="do-donts-cell">DO</th>
              <th class="do-donts-cell">DON'T</th>
            </tr>

            <tr class="do-donts-header">
              <th colspan="1" class="do-donts-cell">
                Encourage active participation
              </th>
            </tr>
            <tr class="do-donts-row">
              <td class="do-donts-cell">
                <p>
                  ✅ Ask guiding questions to help students think through
                  problems on their own.
                </p>
              </td>
              <td class="do-donts-cell">
                <p>❌ Give students the answers</p>
              </td>
            </tr>
            <tr class="do-donts-header">
              <th colspan="1" class="do-donts-cell">
                Believe Students Want to Learn
              </th>
            </tr>
            <tr class="do-donts-row">
              <td class="do-donts-cell">
                <p>
                  ✅ Break down concepts, then encourage students to work
                  through problems on their own as a first step.
                </p>
              </td>
              <td class="do-donts-cell">
                <p>❌ Help students cheat on assignments, quizzes, or tests.</p>
              </td>
            </tr>

            <tr class="do-donts-header">
              <th colspan="1" class="do-donts-cell">
                Guide Students to Develop Their Own Essays
              </th>
            </tr>
            <tr class="do-donts-row">
              <td class="do-donts-cell">
                <p>✅ Brainstorm ideas and guide research for essays.</p>
                <p>✅ Provide feedback on content, structure, and grammar.</p>
              </td>
              <td class="do-donts-cell">
                <p>
                  ❌ Tell students exactly what to write, especially in personal
                  statements.
                </p>
                <p>❌ Re-write student essays for them.</p>
              </td>
            </tr>

            <tr class="do-donts-header">
              <th colspan="1" class="do-donts-cell">Check Student Work</th>
            </tr>
            <tr class="do-donts-row">
              <td class="do-donts-cell">
                <p>
                  ✅ When students ask whether they got certain questions
                  correct, confirm which are right and which are wrong.
                </p>
              </td>
              <td class="do-donts-cell">
                <p>❌ Say, “#5 is wrong. The answer is actually XYZ.”</p>
              </td>
            </tr>

            <tr class="do-donts-header">
              <th colspan="1" class="do-donts-cell">Use AI Responsibly</th>
            </tr>
            <tr class="do-donts-row">
              <td class="do-donts-cell">
                <p>
                  ✅ Use UPbot to find alternative explanations, generate
                  practice problems, clarify language, and refresh your memory.
                </p>
              </td>
              <td class="do-donts-cell">
                <p>
                  ❌ Use AI to write or rewrite essays, provide feedback on
                  essays, or generate full explanations.
                </p>
              </td>
            </tr>
          </table>

          <div class="blue-information-box do-donts-information">
            <div class="information-bubble">
              <img class="img" :src="InformationBubbleUrl" type="image/png" />
            </div>
            <div class="text-box">
              <p>
                We trust you to do the right thing. If you're unsure about a
                situation, please let us know in the post-session feedback form
                or on Slack.
              </p>
              <p>
                If you break the policy, we'll reach out to explain what went
                wrong. Repeated or serious violations can lead to an account
                suspension or a permanent ban.
              </p>
            </div>
          </div>
          <hr class="divider" />
          <h3 class="all-caps-heading">DIVE DEEPER</h3>
          <div class="read-policy">
            <button
              class="link"
              @click="
                goToResource(
                  'https://cdn.upchieve.org/training-courses/upchieve101/academic-integrity-v2.pdf'
                )
              "
              type="button"
            >
              Read our Academic Integrity Policy<right-arrow-green
                class="arrow"
              />
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="props.module.key === 'dei'">
        <div class="section">
          <p>
            At UPchieve, our mission is to break down barriers for students from
            low-income backgrounds, regardless of their race, gender identity,
            sexual orientation, religion, and physical or mental ability. Our
            commitment to diversity, equity, and inclusion (DEI) is at the heart
            of our work to empower all students to succeed.
          </p>
          <p>
            As a volunteer, you help make each student feel welcome and
            respected by treating everyone as an individual, believing that all
            students are capable of success, using thoughtful language, and
            challenging your own biases and assumptions.
          </p>

          <div class="video-content">
            <iframe
              title="vimeo-player"
              src="https://player.vimeo.com/video/459021056?h=8b6ff78fa6"
              frameborder="0"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="
                autoplay;
                fullscreen;
                picture-in-picture;
                clipboard-write;
                encrypted-media;
                web-share;
              "
              allowfullscreen
            ></iframe>
          </div>

          <hr class="divider" />
          <h2>Your Responsibilities as a Volunteer</h2>
          <div class="dei-grid">
            <div class="dei-item two-col">
              <div class="dei-image">
                <img class="img" :src="DeiPlantIlloUrl" type="image/png" />
              </div>
              <div class="main-text">
                <p><strong>Treat each student as an individual</strong></p>
                <p>
                  Despite similarities in socioeconomic status and age, every
                  student is unique. Recognize that students don't fit into
                  stereotypes and work hard to meet them where they are.
                </p>
              </div>
            </div>

            <div class="dei-item two-col">
              <div class="dei-image">
                <picture>
                  <source :srcset="DeiClassIlloUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="DeiClassIlloFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
              <div class="main-text">
                <p>
                  <strong
                    >Make all students feel respected and supported</strong
                  >
                </p>
                <p>
                  Students who attend low-income schools have less access to
                  high-quality teaching and are more likely to be
                  <span class="bold-underline">behind grade level.</span>
                </p>
                <p>
                  Never make a student feel judged for not understanding; tailor
                  your coaching to meet their needs and build their confidence.
                </p>
              </div>
            </div>

            <div class="dei-item two-col">
              <div class="dei-image">
                <picture>
                  <source :srcset="DeiExpectationsIlloUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="DeiExpectationsIlloFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
              <div class="main-text">
                <p><strong>Hold high expectations for every student</strong></p>
                <p>
                  Every UPchieve student is capable of mastering their academic
                  work…
                </p>
                <p>
                  Unfortunately, low-income students are often held to lower
                  expectations than peers with similar potential.
                </p>
                <p>
                  Assume ability, give challenging work with scaffolding, and
                  use language that communicates belief.
                </p>
              </div>
            </div>

            <div class="dei-item two-col">
              <div class="dei-image">
                <picture>
                  <source :srcset="DeiLaptopIlloUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="DeiLaptopIlloFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
              <div class="main-text">
                <p><strong>Be mindful of the impact of your words</strong></p>
                <p>
                  Even harmless-seeming jokes can hurt, especially when related
                  to a student’s identity.
                </p>
                <p>
                  Microaggressions can leave real scars. Choose words that
                  empower and uplift.
                </p>
              </div>
            </div>

            <div class="dei-item two-col">
              <div class="dei-image">
                <picture>
                  <source :srcset="DeiActiveIlloUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="DeiClassIlloFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
              <div class="main-text">
                <p><strong>Actively work on eliminating your biases</strong></p>
                <p>
                  Your background, upbringing, and identity all shape
                  unconscious biases.
                </p>
                <p>
                  These biases influence behavior in ways you may not notice, so
                  coaches must continually work to recognize and counteract
                  them.
                </p>
              </div>
            </div>
          </div>

          <hr class="divider" />
          <h2>Actions You Can Take</h2>
          <ol class="actions-you-can-take">
            <li>
              Become aware of your own
              <span class="bold-underline">biases</span>
            </li>
            <li>
              Question your biases & practice
              <span class="bold-underline">active introspection</span>
            </li>
            <li>
              Connect with people from
              <span class="bold-underline">different backgrounds</span> (pick up
              lots of sessions!)
            </li>
            <li>Keep learning; DEI is a lifelong journey</li>
          </ol>

          <div class="dei-quote">
            <div class="vertical-quote-divider"></div>
            <div class="dei-quote-text">
              Every student deserves to feel seen, valued, and confident. When
              you uphold these values, you change lives and help us achieve our
              mission.
            </div>
          </div>

          <div class="blue-information-box">
            <div class="information-bubble">
              <img class="img" :src="InformationBubbleUrl" type="image/png" />
            </div>
            <div class="text-box">
              We take these principles seriously. Violating the DEI policy could
              mean a warning, account suspension, or even an immediate ban from
              volunteering on UPchieve's platform.
            </div>
          </div>
          <hr class="divider" />
          <h3 class="all-caps-heading">DIVE DEEPER</h3>
          <div class="dei-links">
            <button
              class="link"
              @click="
                goToResource(
                  'https://cdn.upchieve.org/training-courses/upchieve101/volunteer-dei-policy-v2.pdf'
                )
              "
              type="button"
            >
              Read our DEI Policy<right-arrow-green class="arrow" />
            </button>
            <button
              class="link"
              @click="
                goToResource(
                  'https://implicit.harvard.edu/implicit/takeatest.html'
                )
              "
              type="button"
            >
              Harvard Implicit Bias Association Test<right-arrow-green
                class="arrow"
              />
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="props.module.key === 'safety'">
        <div class="section">
          <p>
            Most students using UPchieve are under 18 years old. Students, their
            parents, teachers, and our enrollment partners all rely on us to
            create a safe and welcoming environment.
          </p>
          <p>
            That's why keeping students and volunteers safe is our top priority.
            Our platform is designed to protect everyone's privacy and ensure a
            positive, respectful environment for learning.
          </p>

          <div class="video-content">
            <iframe
              title="vimeo-player"
              src="https://player.vimeo.com/video/773599358?h=6edf900bfc"
              frameborder="0"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="
                autoplay;
                fullscreen;
                picture-in-picture;
                clipboard-write;
                encrypted-media;
                web-share;
              "
              allowfullscreen
            ></iframe>
            <button
              class="video-transcript-link"
              @click="
                goToResource(
                  'https://cdn.upchieve.org/training-courses/upchieve101/video-decks/community-safety-&-success-deck.pdf'
                )
              "
              type="button"
            >
              <span>Video Transcript & Slides</span><right-arrow-green />
            </button>
          </div>

          <hr class="divider" />

          <h2>Your Responsibilities as a Volunteer</h2>

          <div class="safety-grid">
            <div class="safety-item two-col">
              <div>
                <h3>1. Keep All Communication on UPchieve</h3>
                <div>
                  <p>
                    <strong
                      >All communication between UPchieve students and Academic
                      Coaches should occur via UPchieve's platform.</strong
                    >
                  </p>
                  <p>
                    Never communicate with students via email, phone, video
                    call, or social media.
                  </p>
                  <p>
                    You should never meet a student in real life. If we discover
                    that any student and volunteer have met in person, both
                    parties will be banned from UPchieve and if possible, we
                    will report the interaction to the student’s parents,
                    school, or local authorities.
                  </p>
                </div>
              </div>
              <div class="image-center">
                <picture>
                  <source
                    :srcset="SafetyCommunicationScreenUrl"
                    type="image/avif"
                  />
                  <img
                    class="img"
                    :src="SafetyCommunicationScreenFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
            </div>

            <div class="safety-item full">
              <div class="blue-information-box">
                <div class="information-bubble">
                  <img
                    class="img"
                    :src="InformationBubbleUrl"
                    type="image/png"
                  />
                </div>
                <div class="text-box">
                  <p>
                    <strong>A note about Google Docs and External Links</strong>
                  </p>
                  <p>
                    If a student sends you a Google Doc or external assignment
                    link, you have 2 options:
                  </p>
                  <ol>
                    <li>
                      Politely ask them to copy and paste their work into the
                      platform's whiteboard or doc editor. Let them know you
                      can't comment on or edit documents outside UPchieve.
                    </li>
                    <li>
                      Ask them to set the document's sharing settings to “Anyone
                      with the link can view”. They may then paste the link into
                      UPchieve's chat and you can use a
                      <span class="bold-underline"
                        >private or incognito browser window</span
                      >
                      to view the document. This ensures that you'll stay
                      anonymous while viewing the document and the student will
                      not be able to see your email.
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div class="safety-item full">
              <h3>2. Protect Personal Information</h3>
              <p>Only first names are used on UPchieve to protect privacy.</p>
              <p>
                <strong
                  >Never share your personal contact information with students,
                  and never ask for theirs.
                </strong>
              </p>
              <p>Common forms of personal information include:</p>

              <div class="protect-pii-container">
                <ul class="column-one">
                  <li>❌ Full or last name</li>
                  <li>❌ Full or partial address (i.e. City, Country)</li>
                  <li>❌ Email address</li>
                  <li>❌ Phone number</li>
                </ul>
                <ul class="column-two">
                  <li>❌ Social media username</li>
                  <li>❌ Date of birth, age, or birthday</li>
                  <li>❌ School name</li>
                  <li>❌ Grade level (if applicable)</li>
                </ul>
              </div>

              <p>
                If a student asks for your contact info or to connect outside
                the platform for more help, politely explain that UPchieve
                policy requires all communication to stay on the platform.
                Please also let us know in the post-session form so we can
                follow up with the student to keep them safe.
              </p>
            </div>

            <div class="safety-item full">
              <div class="blue-information-box">
                <div class="information-bubble">
                  <img
                    class="img"
                    :src="InformationBubbleUrl"
                    type="image/png"
                  />
                </div>
                <div class="text-box">
                  <p><strong>College Counseling</strong></p>
                  <p>
                    During a college counseling session, you may ask about a
                    student's state if it's needed to provide contextual,
                    relevant advice (for example, about in-state colleges or
                    regional scholarships).
                  </p>
                </div>
              </div>
            </div>

            <div class="safety-item two-col">
              <div>
                <h3>3. Keep Conversations Appropriate</h3>
                <p>
                  Use appropriate language and keep conversations focused on
                  learning and support. While asking some questions about the
                  student's life may help you develop rapport, make sure to keep
                  the conversation appropriate.
                </p>
                <p>Do not use profane, offensive, or derogatory language.</p>
              </div>
              <div class="image-center">
                <picture>
                  <source :srcset="CoachLaptopUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="CoachLaptopFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
            </div>

            <div class="safety-item full">
              <div class="dei-quote">
                <div class="vertical-quote-divider"></div>
                <div class="dei-quote-text">
                  A good rule of thumb is to think, "Would this student's
                  parent/guardian be okay with this comment?”
                </div>
              </div>
            </div>

            <div class="safety-item two-col">
              <div class="image-center">
                <picture>
                  <source :srcset="ProbingQuestionsUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="ProbingQuestionsFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
              <div>
                <h3>4. Keep Chats Private</h3>
                <p>
                  While volunteering at UPchieve, you will have many private
                  conversations with students, some of which may be heartwarming
                  or eye opening.
                </p>
                <p>
                  However, keep in mind that students speak to their coaches in
                  confidence and often assume that you will not share those
                  conversations with anyone else. Never post screenshots of
                  sessions online.
                </p>
              </div>
            </div>

            <div class="safety-item full">
              <h3>5. Report Behavior In Need of Immediate Attention</h3>
              <p>
                If a student is rude, uses inappropriate language, or
                bullies/trolls, click the “Report” button at the top of the
                chat. Their account will immediately be suspended temporarily
                while our staff reviews their behavior.
              </p>
              <p>
                Reporting is considered fairly serious, and doesn't need to be
                done for minor infractions. For issues like slow responses or
                lack of engagement, use the post-session feedback form instead.
                Asking for help is hard, so we want to be sure we only suspend
                students who are behaving badly and not those who lack
                motivation.
              </p>
            </div>

            <div class="safety-item full">
              <picture>
                <source :srcset="EncourageStudentsUrl" type="image/avif" />
                <img
                  class="img"
                  :src="EncourageStudentsFallbackUrl"
                  type="image/png"
                />
              </picture>
            </div>

            <div class="safety-item two-col">
              <div>
                <h3>6. Report Student Safety Concerns</h3>
                <p>
                  UPchieve coaches provide
                  <strong>academic support only</strong>. You are not a trained
                  crisis counselor. In rare cases, a student may share something
                  that suggests <strong>unsafe behavior or situations</strong>,
                  such as:
                </p>
                <ul class="safety-concerns-list">
                  <li><strong>Wanting to harm themselves</strong></li>
                  <li>
                    <strong>That someone is harming them </strong> (physical,
                    sexual, neglect, or emotional abuse)
                  </li>
                  <li><strong>Wanting to harm someone else</strong></li>
                </ul>
              </div>
              <div class="image-center">
                <img
                  class="img"
                  :src="SafetyReportChatBoxesUrl"
                  type="image/png"
                />
              </div>
            </div>

            <div class="safety-item full">
              <p>
                Professionals like teachers, doctors, and youth program staff
                are “mandated reporters” and legally required to report these
                issues. Most UPchieve coaches are not in that category and
                likely won't have the information to report even if you are, but
                <strong
                  >you should always use the report button so UPchieve staff can
                  take the next steps</strong
                >. You can feel confident that if you report a student safety
                concern, UPchieve staff will swiftly respond appropriately to
                keep the student safe.
              </p>
              <p>If this happens:</p>
              <ol class="safety-concerns-list">
                <li><strong>Validate</strong> the student's feelings</li>
                <li>
                  <strong>Clarify</strong> your role: you're an academic coach,
                  not a crisis counselor
                </li>
                <li><strong>Share</strong> a resource (see below)</li>
                <li>
                  <strong>Report</strong> it to UPchieve during the session so
                  staff can follow up immediately
                </li>
              </ol>
            </div>

            <div class="safety-item two-col">
              <div>
                <h3>Qualified Resources to Share</h3>
                <ul class="resources-list">
                  <li>
                    <ExternalResourceLink
                      link="https://www.crisistextline.org/"
                      text="Crisis Text Line"
                      class="bold-underline safety-link"
                    />
                    (mental health crisis)
                  </li>
                  <li>
                    <ExternalResourceLink
                      link="https://childhelphotline.org/"
                      text="Childhelp"
                      class="bold-underline safety-link"
                    />
                    (child abuse)
                  </li>
                  <li>
                    <ExternalResourceLink
                      link="https://www.1800runaway.org/youth-teens/get-help"
                      text="National Runaway Safeline"
                      class="bold-underline safety-link"
                    />
                    (homelessness)
                  </li>
                </ul>
              </div>
              <div class="image-center">
                <picture>
                  <source :srcset="BeYourselfUrl" type="image/avif" />
                  <img
                    class="img"
                    :src="BeYourselfFallbackUrl"
                    type="image/png"
                  />
                </picture>
              </div>
            </div>
          </div>

          <hr class="divider" />
          <h3 class="all-caps-heading">DIVE DEEPER</h3>
          <div class="read-policy">
            <button
              class="link"
              @click="
                goToResource(
                  'https://cdn.upchieve.org/training-courses/upchieve101/upchieve-student-safety-policy.pdf'
                )
              "
              type="button"
            >
              Read our Safety Policy<right-arrow-green class="arrow" />
            </button>
          </div>
        </div>
      </div>
      <div v-else>
        {{ props.module.key }}
        <h2>Complete</h2>
      </div>
    </template>
    <template v-slot:previous-button>
      <LargeButton
        class="previous-button"
        v-if="hasPreviousModule"
        variant="secondary"
        @click="props.onPrevious"
        :showArrow="true"
        arrowDirection="left"
        >{{ isMobile ? ' ' : 'Previous' }}</LargeButton
      >
    </template>
    <template v-slot:next-button>
      <LargeButton
        variant="primary-blue"
        :showArrow="true"
        @click="props.onNext"
        class="next-button"
        data-testid="training-next-button"
        >Next</LargeButton
      >
    </template>
  </TrainingPage>
</template>
<style lang="scss" scoped>
.module-intro {
  display: flex;
  flex-direction: column;
  text-align: start;
}

.video-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  iframe {
    aspect-ratio: 16 / 9;
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
}

.section {
  margin: 24px;
}

.video-transcript-link {
  margin: 16px;
  font-weight: 450;
  font-size: 14px;

  span {
    margin-right: 12px;
  }
}

.divider {
  background-color: $border-grey;
  border: none;
  height: 1px;
  width: 100%;
  margin: 16px 0;
}
h2 {
  font-weight: 500;
  font-size: 20px;
}

h3 {
  font-weight: 500;
  font-size: 18px;
}

h4 {
  font-weight: 500;
}

.bold-underline {
  font-weight: 500;
  text-decoration: underline;
}
.read-policy {
  button {
    margin: 16px 0;
    padding-left: 0;
  }
}

.what-learners-know {
  @include flex-container(row, center, center);
}

@media screen and (max-width: 1024px) {
  .what-learners-know {
    @include flex-container(column, center, center);
  }
}

.coaching-strategies-grid {
  display: grid;
  gap: 24px;
  width: 100%;
}

.coaching-strategies-item {
  padding: 16px;
}

.coaching-strategies-item.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.coaching-strategies-item.full {
  display: block;
}

@media (max-width: 1024px) {
  .coaching-strategies-item.two-col {
    grid-template-columns: 1fr;
  }

  .mobile-center {
    text-align: center;
  }
}

.text-section {
  margin: 12px 0;
}

.img {
  margin-top: 16px;
  width: 100%;
  object-fit: contain;
  @media (min-width: 500px) {
    width: 60%;
  }
  @media (min-width: 1024px) {
    width: 100%;
  }
}

.all-caps-heading {
  color: $c-hover-green;
  font-weight: 400;
}

.arrow {
  font-size: 12px;
  color: red;
  margin-left: 8px;
}

.row-heading {
  display: flex;
  text-align: left;
}

.do-donts-cell {
  vertical-align: top;
  text-align: left;
  width: 50%;
  padding-left: 12px;

  p {
    margin-top: 8px;
  }
}

.do-donts-table {
  width: 100%;
  border-collapse: collapse;
}

.do-donts-cell:first-child {
  border-right: 2px solid black;
}

.do-donts-header {
  th {
    padding-top: 16px;
  }
}

.do-donts-row {
  border-bottom: 1px solid $c-border-grey;
}

.blue-information-box {
  @include flex-container(row, center, center);
  background-color: $c-background-blue;
  border: 1px solid $c-information-blue;
  margin: 20px 16px;
  border-radius: 8px;
  font-size: 14px;

  .information-bubble {
    margin-left: 16px;
  }

  .text-box {
    margin: 16px;
  }
}

.dei-grid {
  display: grid;
  gap: 24px;
  width: 100%;
}

.dei-item.two-col {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  padding: 16px 0;
}

.main-text {
  margin-left: 20px;
}

.dei-image {
  @include flex-container(column, center, center);
}

@media (max-width: 1024px) {
  .dei-item.two-col {
    grid-template-columns: 1fr;
  }

  .dei-image {
    display: block;
    text-align: center;
    padding: 0;
  }
}

.actions-you-can-take {
  padding-left: 16px;
}

.dei-quote {
  @include flex-container(row, flex-start, center);
  gap: 24px;
  padding: 16px;
}
.vertical-quote-divider {
  width: 5px;
  height: 80px;
  background-color: $c-success-green;
  border-radius: 4px;
  margin-left: 24px;
}

.dei-quote-text {
  font-size: 20px;
  font-weight: 500;
}

@include breakpoint-below('large') {
  .dei-quote-text {
    font-size: 16px;
  }
}

.dei-links {
  @include flex-container(column, flex-start, flex-start);
  gap: 8px;
  margin: 16px 0;

  .link {
    padding: 0;
    margin: 10px 0;
  }
}

.protect-pii-container {
  @include flex-container(row);
}

.safety-grid {
  display: grid;
  gap: 24px;
  width: 100%;
}

.safety-item {
  width: 100%;
}

.safety-item.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.safety-item.full {
  display: block;
}

.image-center {
  text-align: center;
}

@media (max-width: 1024px) {
  .safety-item.two-col {
    grid-template-columns: 1fr;
  }

  .image-center {
    text-align: center;
  }
}

.safety-link {
  color: #000;
}

.safety-concerns-list,
.resources-list {
  padding-left: 16px;
}

.resources-list {
  font-size: 14px;
}
</style>
