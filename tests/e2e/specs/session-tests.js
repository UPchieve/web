describe("Student session creation", () => {
  before(function() {
    cy.fixture("users/student1").as("student");
  });

  it("Should start an algebra session", function() {
    cy.login(this.student);

    cy.visit("/dashboard");
    cy.location("pathname").should("eq", "/dashboard");

    cy.get(".SubjectCard:first-of-type .LargeButton-primary").click();
    cy.get(".SubjectSelectionModal-subtopic:first-of-type").click();
    cy.get(".ModalTemplate-form .LargeButton-primary").click();

    cy.location("pathname").should("contain", "/session/math/algebra");
  });
});
