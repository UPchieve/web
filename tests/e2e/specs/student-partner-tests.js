describe("Student partner activity", () => {
  before(function() {
    cy.fixture("users/partnerStudent1").as("partnerStudent");
    cy.fixture("users/volunteer1").as("volunteer");
  });

  describe("Student partner signup", () => {
    before(function() {
      cy.login(this.volunteer);
      cy.deleteUserByEmail(this.partnerStudent.email);
      cy.logout();
    });

    it("Should successfully use student partner signup to create account", function() {
      cy.visit("/signup/student/example");

      cy.location("pathname").should("eq", "/signup/student/example");

      cy.get("#inputEmail")
        .type(this.partnerStudent.email)
        .should("have.value", this.partnerStudent.email);

      cy.get("#inputPassword")
        .type(this.partnerStudent.password)
        .should("have.value", this.partnerStudent.password);

      cy.get("button[type=submit]").click();

      cy.get("#firstName")
        .type(this.partnerStudent.firstName)
        .should("have.value", this.partnerStudent.firstName);

      cy.get("#lastName")
        .type(this.partnerStudent.lastName)
        .should("have.value", this.partnerStudent.lastName);

      cy.get("#userAgreement").click();

      cy.get("button[type=submit]").click();

      cy.location("pathname").should("eq", "/dashboard");
    });
  });
});
