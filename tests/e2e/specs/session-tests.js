function clickSubjectButton(title) {
  return cy
    .get(".SubjectCard-title")
    .contains(title)
    .parents(".SubjectCard")
    .children(".LargeButton-primary")
    .should("be.visible")
    .click();
}

function clickSubtopicButton(title) {
  return cy
    .get(".SubjectSelectionModal-subtopic-title")
    .contains(title)
    .parents(".SubjectSelectionModal-subtopic")
    .should("be.visible")
    .click();
}

function clickStartChat() {
  return cy
    .get(".ModalTemplate-form .LargeButton-primary")
    .should("be.visible")
    .click();
}

function startSession(topicTitle, subtopicTitle) {
  return clickSubjectButton(topicTitle)
    .then(() => clickSubtopicButton(subtopicTitle))
    .then(() => clickStartChat());
}

describe("Session activity", () => {
  before(function() {
    cy.fixture("users/student1").as("student");
    cy.fixture("users/volunteer1").as("volunteer");
    cy.fixture("users/volunteer2").as("volunteer2");
  });

  describe("Student-only algebra session activity", () => {
    before(function() {
      cy.login(this.student)
        .endAllSessions()
        .clock(Date.now() + 6 * 60 * 1000);
    });

    beforeEach(function() {
      cy.login(this.student);
    });

    it("Should start an algebra session", function() {
      const SESSION_URL_PATTERN = /^\/session\/math\/algebra\/\w{24}$/;
      const STUDENT_ALGEBRA_MSG = "Hi, I have an algebra question.";
      const user = cy;
      user
        .visit("/dashboard")
        .then(() => clickSubjectButton("Math Tutoring"))
        .then(() => clickSubtopicButton("Algebra"))
        .then(() => clickStartChat())
        .location("pathname")
        .should("eq", "/session/math/algebra")
        .clock()
        .then(clock => clock.restore())
        .location("pathname")
        .should("match", SESSION_URL_PATTERN)
        .vuex()
        .its("getters")
        .its("user/isSessionAlive")
        .should("be.true")
        .get(".message-box .messages")
        .find(".message")
        .should("have.length", 0)
        .get(".chat .message-textarea")
        .type(STUDENT_ALGEBRA_MSG)
        .type("{enter}")
        .get(".message-box .messages")
        .find(".message")
        .should("have.length", 1)
        .get(".message-box .messages .message .contents span")
        .should("have.text", STUDENT_ALGEBRA_MSG);
    });

    it("Should cancel the session", function() {
      cy.get(".end-session button")
        .should("contain.text", "Cancel")
        .click()
        .location("pathname")
        .should("eq", "/dashboard")
        .get(".RejoinSessionHeader")
        .should("not.exist");
    });
  });

  describe("Student and volunteer essay session activity", function() {
    const ESSAYS_SESSION_URL_PATTERN = /^\/session\/college\/essays\/\w{24}$/;
    const STUDENT_ESSAY_MSG = "Hi, I have an essay question.";
    const VOLUNTEER_ESSAY_MSG = "Hello! What's your essay question?";

    before(function() {
      cy.login(this.student)
        .endAllSessions()
        .logout()
        .login(this.volunteer)
        .endAllSessions()
        .logout()
        .clock(Date.now() + 6 * 60 * 1000);
    });

    it("Should start an essay session", function() {
      cy.login(this.student)
        .visit("/dashboard")
        .then(() => clickSubjectButton("College Counseling"))
        .then(() => clickSubtopicButton("Essays"))
        .then(() => clickStartChat())
        .location("pathname")
        .should("eq", "/session/college/essays")
        .clock()
        .then(clock => clock.restore())
        .location("pathname")
        .should("match", ESSAYS_SESSION_URL_PATTERN)
        .vuex()
        .its("getters")
        .its("user/isSessionAlive")
        .should("be.true")
        .get(".chat .message-textarea")
        .type(STUDENT_ESSAY_MSG)
        .type("{enter}")
        .get(".message-box .messages")
        .find(".message")
        .should("have.length", 1)
        .get(".message-box .messages .message .contents span")
        .should("have.text", STUDENT_ESSAY_MSG);
    });

    it("Should return to dashboard during active session", function() {
      cy.login(this.student)
        .get(".session-header__dashboard-link")
        .click()
        .location("pathname")
        .should("eq", "/dashboard")
        .get(".RejoinSessionHeader")
        .should("exist");
    });

    it("Should switch to volunteer account and see student help request on dashboard", function() {
      cy.login(this.volunteer)
        .visit("/dashboard")
        .get(".session-list tbody tr:nth-of-type(1) td:nth-of-type(1)")
        .should("contain.text", "Student")
        .get(".session-list tbody tr:nth-of-type(1) td:nth-of-type(2)")
        .should("contain.text", "Essays");
    });

    it("Should join the student essay session", function() {
      cy.login(this.volunteer)
        .get(".session-list tbody tr:nth-of-type(1)")
        .should("be.visible")
        .click()
        .location("pathname")
        .should("match", ESSAYS_SESSION_URL_PATTERN)
        .clock()
        .then(clock => clock.restore())
        .get(".message-box .messages .message .contents span")
        .should("have.text", STUDENT_ESSAY_MSG);
    });

    it("Should send a chat response to the student", function() {
      cy.login(this.volunteer)
        .get(".message-box .messages")
        .find(".message")
        .should("have.length", 1)
        .get(".chat .message-textarea")
        .type(VOLUNTEER_ESSAY_MSG)
        .type("{enter}")
        .get(".message-box .messages .message:nth-of-type(2) .contents span")
        .should("have.text", VOLUNTEER_ESSAY_MSG);
    });

    it("Should end the essay session and direct volunteer to feedback form", function() {
      const VOLUNTEER_FEEDBACK_URL_PATTERN = /^\/feedback\/\w{24}\/college\/essays\/volunteer\/\w{24}\/\w{24}$/;
      cy.login(this.volunteer)
        .get(".end-session button")
        .should("contain.text", "End session")
        .click()
        .location("pathname")
        .should("match", VOLUNTEER_FEEDBACK_URL_PATTERN);
    });

    it("Should submit volunteer feedback form", function() {
      cy.get(".vue-star-rating-pointer")
        .eq(2)
        .click()
        .get(".radio-question-selection-cell")
        .eq(4)
        .click()
        .get(".radio-question-selection-cell")
        .eq(6)
        .click()
        .get(".radio-question-selection-cell")
        .eq(13)
        .click()
        .get(".radio-question-selection-cell")
        .eq(18)
        .click()
        .get(".radio-question-selection-cell")
        .eq(22)
        .click()
        .get(".text-question-textarea")
        .type(
          "Hey, the review materials were great! They helped me prepare for my tutoring session."
        )
        .get(".submit-button")
        .click()
        .location("pathname")
        .should("eq", "/dashboard");
    });

    it("Should visit Student feedback form and submit feedback", function() {
      const CALCULUS_SESSION_URL_PATTERN = /^\/session\/math\/calculus\/\w{24}$/;
      const STUDENT_FEEDBACK_URL_PATTERN = /^\/feedback\/\w{24}\/math\/calculus\/student\/\w{24}\/\w{24}$/;

      cy.login(this.student)
        .clock(Date.now() + 6 * 60 * 1000)
        .visit("/dashboard")
        .then(() => startSession("Math Tutoring", "Calculus"))
        .location("pathname")
        .should("match", CALCULUS_SESSION_URL_PATTERN)
        .login(this.volunteer)
        .visit("/dashboard")
        .get(".session-list tbody tr:nth-of-type(1)")
        .should("be.visible")
        .click()
        .location("pathname")
        .should("match", CALCULUS_SESSION_URL_PATTERN)
        .vuex()
        .its("getters")
        .its("user/isSessionInProgress")
        .should("be.true")
        .login(this.student)
        .visit("/dashboard")
        .get(".LargeButton-primary--reverse")
        .click()
        .get(".end-session button")
        .should("contain.text", "End session")
        .click()
        .location("pathname")
        .should("match", STUDENT_FEEDBACK_URL_PATTERN)
        .get(".vue-star-rating-pointer")
        .eq(2)
        .click()
        .get(".radio-list__option")
        .eq(3)
        .click()
        .get(".radio-question-selection-cell")
        .eq(4)
        .click()
        .get(".radio-question-selection-cell")
        .eq(6)
        .click()
        .get(".radio-question-selection-cell")
        .eq(13)
        .click()
        .get(".text-question-textarea")
        .type("It was lit, very cool, nice 100.")
        .get(".submit-button")
        .click()
        .location("pathname")
        .should("eq", "/dashboard");
    });
  });

  describe("Student and volunteer revisiting a session that has ended", () => {
    beforeEach(function() {
      const sessionSubTopic = "calculus";
      const sessionType = "math";
      cy.login(this.student)
        .clock(Date.now() + 6 * 60 * 1000)
        .visit("/dashboard")
        .then(() => cy.createNewSession({ sessionSubTopic, sessionType }))
        .then(sessionId => {
          cy.wrap(sessionId).as("sessionId");
          cy.wrap(`/session/${sessionType}/${sessionSubTopic}/${sessionId}`).as(
            "sessionUrl"
          );
          cy.visit(`/session/${sessionType}/${sessionSubTopic}/${sessionId}`);
        });
    });

    afterEach(function() {
      // Have a student end their own session
      cy.login(this.student).endAllSessions();
    });

    it("Should see 'Session Canceled' when a student visits a canceled session", function() {
      cy.url()
        .should("contain", this.sessionId)
        .vuex()
        .its("getters")
        .its("user/isSessionWaitingForVolunteer")
        .should("be.true")
        .get(".end-session button")
        .should("contain.text", "Cancel" || "End session")
        .click()
        .location("pathname")
        .should("eq", "/dashboard")
        .visit(this.sessionUrl)
        .get(".SessionFulfilledModal")
        .children()
        .then(modalElement => {
          const modalTitle = modalElement[0];
          const modalMessage = modalElement[1];
          expect(modalTitle).to.have.text("Session Canceled");
          expect(modalMessage).to.have.text("You have canceled your request.");
          return cy.get(".LargeButton-primary").click();
        })
        .location("pathname")
        .should("eq", "/dashboard");
    });

    it("Should see 'Session Canceled' when a volunteer visits a canceled session", function() {
      cy.url()
        .should("contain", this.sessionId)
        .vuex()
        .its("getters")
        .its("user/isSessionWaitingForVolunteer")
        .should("be.true")
        .get(".end-session button")
        .should("contain.text", "Cancel")
        .click()
        .location("pathname")
        .should("eq", "/dashboard")
        .login(this.volunteer)
        .visit(this.sessionUrl)
        .get(".SessionFulfilledModal")
        .children()
        .then(modalElement => {
          const modalTitle = modalElement[0];
          const modalMessage = modalElement[1];
          expect(modalTitle).to.have.text("Session Canceled");
          expect(modalMessage).to.have.text(
            "The student has canceled their request. Thanks for trying, we really appreciate it!"
          );
          return cy.get(".LargeButton-primary").click();
        })
        .location("pathname")
        .should("eq", "/dashboard");
    });

    it("Should see 'Session Fulfilled' when another volunteer visits an active fulfilled session", function() {
      cy.url()
        .should("contain", this.sessionId)
        .vuex()
        .its("getters")
        .its("user/isSessionWaitingForVolunteer")
        .should("be.true")
        .login(this.volunteer)
        .visit(this.sessionUrl)
        .vuex()
        .its("getters")
        .its("user/isSessionInProgress")
        .should("be.true")
        .login(this.volunteer2)
        .visit(this.sessionUrl)
        .get(".SessionFulfilledModal")
        .children()
        .then(modalElement => {
          const modalTitle = modalElement[0];
          const modalMessage = modalElement[1];
          expect(modalTitle).to.have.text("Session Fulfilled");
          expect(modalMessage).to.have.text(
            "Another volunteer has already joined this session. Thanks for trying, we really appreciate it!"
          );
          return cy.get(".LargeButton-primary").click();
        })
        .location("pathname")
        .should("eq", "/dashboard")
        .logout();
    });

    it("Should see 'Session Fulfilled' when a volunteer vists a previous fulfilled session", function() {
      cy.url()
        .should("contain", this.sessionId)
        .vuex()
        .its("getters")
        .its("user/isSessionWaitingForVolunteer")
        .should("be.true")
        .login(this.volunteer)
        .visit(this.sessionUrl)
        .vuex()
        .its("getters")
        .its("user/isSessionInProgress")
        .should("be.true")
        .get(".end-session button")
        .should("contain.text", "End session")
        .click()
        .visit(this.sessionUrl)
        .get(".SessionFulfilledModal")
        .children()
        .then(modalElement => {
          const modalTitle = modalElement[0];
          const modalMessage = modalElement[1];
          expect(modalTitle).to.have.text("Session Fulfilled");
          expect(modalMessage).to.have.text(
            "This session has already finished."
          );
          return cy.get(".LargeButton-primary").click();
        })
        .location("pathname")
        .should("eq", "/dashboard");
    });

    it("Should see 'Session Fulfilled' when a student vists a previous fulfilled session", function() {
      cy.url()
        .should("contain", this.sessionId)
        .vuex()
        .its("getters")
        .its("user/isSessionWaitingForVolunteer")
        .should("be.true")
        .login(this.volunteer)
        .visit(this.sessionUrl)
        .vuex()
        .its("getters")
        .its("user/isSessionInProgress")
        .should("be.true")
        .login(this.student)
        .visit(this.sessionUrl)
        .vuex()
        .its("getters")
        .its("user/isSessionInProgress")
        .should("be.true")
        .get(".end-session button")
        .should("contain.text", "End session")
        .click()
        .location("pathname")
        .should("not.equal", this.sessionUrl)
        .visit(this.sessionUrl)
        .get(".SessionFulfilledModal")
        .children()
        .then(modalElement => {
          const modalTitle = modalElement[0];
          const modalMessage = modalElement[1];
          expect(modalTitle).to.have.text("Session Fulfilled");
          expect(modalMessage).to.have.text(
            "This session has already finished."
          );
          return cy.get(".LargeButton-primary").click();
        })
        .location("pathname")
        .should("eq", "/dashboard");
    });
  });
});
