// https://docs.cypress.io/api/introduction/api.html

describe("Student tests", () => {
  beforeEach(() => {
    cy.fixture("users/student1").as("user");
  });

  it("Should log in successfully", function() {
    cy.visit("/");

    cy.get("#inputEmail")
      .type(this.user.email)
      .should("have.value", this.user.email);

    cy.get("#inputPassword")
      .type(this.user.password)
      .should("have.value", this.user.password);

    cy.get("button[type=submit]").click();

    cy.location("pathname").should("eq", "/dashboard");
  });

  it("Should log out successfully", () => {
    cy.get("body")
      .contains("Log out")
      .click();

    cy.get("body", { timeout: 50000 }).should($p => {
      expect($p.first()).to.contain("logged out");
    });
    //cy.location("pathname", { timeout: 5000 }).should("eq", "/logout");
  });
});
