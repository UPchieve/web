describe("Session activity", () => {
  before(function() {
    cy.fixture("users/student1").as("student");
  });

  describe("Student session activity without volunteer", () => {
    beforeEach(function() {
      cy.login(this.student);
    });

    it("Should start an algebra session", function() {
      cy.visit("/dashboard");

      cy.get(".SubjectCard:first-of-type .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.get(".SubjectSelectionModal-subtopic:first-of-type")
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

      const sessionUrlPattern = /^\/session\/college\/essays\/\w{24}$/;
      cy.location("pathname").should("match", sessionUrlPattern);
    });

    it("Should return to dashboard during active session", function() {
      cy.login(this.student);

      cy.get(".session-header__dashboard-link").click();

      cy.location("pathname").should("eq", "/dashboard");
      cy.get(".RejoinSessionHeader").should("exist");
    });
  });
});
