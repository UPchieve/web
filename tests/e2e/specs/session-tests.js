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
      cy.get(".end-session button span").should("contain.text", "Cancel");

      cy.get(".end-session button span").click();

      cy.location("pathname").should("eq", "/dashboard");
    });
  });
});
