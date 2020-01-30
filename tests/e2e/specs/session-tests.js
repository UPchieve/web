describe("Session activity", () => {
  before(function() {
    cy.fixture("users/student1").as("student");
    cy.fixture("users/Volunteer1").as("volunteer");
  });

  describe("Student-only session activity", () => {
    beforeEach(function() {
      cy.login(this.student);
    });

    it("Should start an algebra session", function() {
      cy.visit("/dashboard");

      cy.get(".SubjectCard:nth-of-type(1) .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.get(".SubjectSelectionModal-subtopic:nth-of-type(1)")
        .should("be.visible")
        .click();

      cy.get(".ModalTemplate-form .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.location("pathname").should("eq", "/session/math/algebra");
      cy.wait(7000);

      const sessionUrlPattern = /^\/session\/math\/algebra\/\w{24}$/;
      cy.location("pathname").should("match", sessionUrlPattern);
    });

    it("Should send a chat message", function() {
      const chatMessage = "Hi, I have an algebra question.";

      cy.get(".message-box .messages")
        .find(".message")
        .should("have.length", 0);

      cy.get(".chat .message-textarea")
        .type(chatMessage)
        .type("{enter}");

      cy.get(".message-box .messages")
        .find(".message")
        .should("have.length", 1);

      cy.get(".message-box .messages .message .contents span").should(
        "have.text",
        chatMessage
      );
    });

    it("Should cancel the session", function() {
      cy.get(".end-session button")
        .should("contain.text", "Cancel")
        .click();

      cy.location("pathname").should("eq", "/dashboard");
      cy.get(".RejoinSessionHeader").should("not.exist");
    });
  });

  describe("Student and volunteer session activity", function() {
    const ESSAYS_SESSION_URL_PATTERN = /^\/session\/college\/essays\/\w{24}$/;
    const STUDENT_ESSAY_MSG = "Hi, I have an essay question.";
    const VOLUNTEER_ESSAY_MSG = "Hello! What's your essay question?";

    it("Should start an essays session", function() {
      cy.login(this.student);
      cy.visit("/dashboard");

      cy.get(".SubjectCard:nth-of-type(2) .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.get(".SubjectSelectionModal-subtopic:nth-of-type(2)")
        .should("be.visible")
        .click();

      cy.get(".ModalTemplate-form .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.location("pathname").should("eq", "/session/college/essays");
      cy.wait(7000);

      cy.location("pathname").should("match", ESSAYS_SESSION_URL_PATTERN);

      cy.get(".chat .message-textarea")
        .type(STUDENT_ESSAY_MSG)
        .type("{enter}");
    });

    it("Should return to dashboard during active session", function() {
      cy.login(this.student);

      cy.get(".session-header__dashboard-link").click();
      cy.wait(5000);

      cy.location("pathname").should("eq", "/dashboard");
      cy.get(".RejoinSessionHeader").should("exist");
    });

    it("Should switch to volunteer account and find student help request on dashboard", function() {
      cy.login(this.volunteer);
      cy.visit("/dashboard");
      cy.wait(5000);

      cy.get(".session-list tbody tr:nth-of-type(1) td:nth-of-type(1)").should(
        "contain.text",
        "Student"
      );

      cy.get(".session-list tbody tr:nth-of-type(1) td:nth-of-type(2)").should(
        "contain.text",
        "Essays"
      );
    });

    it("Should join the student essay session", function() {
      cy.login(this.volunteer);

      cy.get(".session-list tbody tr:nth-of-type(1)")
        .should("be.visible")
        .click();

      cy.location("pathname").should("match", ESSAYS_SESSION_URL_PATTERN);

      cy.wait(5000);

      cy.get(
        ".message-box .messages .message:nth-of-type(1) .contents span"
      ).should("have.text", STUDENT_ESSAY_MSG);
    });

    it("Should send a chat response to the student", function() {
      cy.login(this.volunteer);

      cy.get(".message-box .messages")
        .find(".message")
        .should("have.length", 1);

      cy.get(".chat .message-textarea")
        .type(VOLUNTEER_ESSAY_MSG)
        .type("{enter}");

      cy.get(
        ".message-box .messages .message:nth-of-type(2) .contents span"
      ).should("have.text", VOLUNTEER_ESSAY_MSG);
    });
  });
});
