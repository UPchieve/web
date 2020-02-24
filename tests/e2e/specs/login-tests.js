/**
 *
 * @file Tests user authenication (login and logout) and failed attempts for both
 *
 */

/**
 * @summary Tests authenicating a volunteer and student successfully
 */

const CLIENT_ROOT = Cypress.env("CLIENT_ROOT");
const SERVER_ROOT = Cypress.env("SERVER_ROOT");

describe("Successful Log in and log out", () => {
  before(() => {
    cy.fixture("users/student1").as("student");
    cy.fixture("users/Volunteer1").as("volunteer");
  });

  describe("Authenicate a student logging in and out", () => {
    it("Should log in successfully", function() {
      cy.visit(CLIENT_ROOT);

      cy.get("#inputEmail")
        .type(this.student.email)
        .should("have.value", this.student.email);

      cy.get("#inputPassword")
        .type(this.student.password)
        .should("have.value", this.student.password);

      cy.get("button[type=submit]").click();
      cy.location("pathname").should("eq", "/dashboard");
    });

    it("Should log out successfully", function() {
      cy.login(this.student);
      cy.location("pathname").should("eq", "/dashboard");

      cy.get(".AppSidebar-final-link").click();
      cy.location("pathname").should("eq", "/logout");
    });
  });

  describe("Authenicate a volunteer logging in and out", () => {
    it("Should log in successfully", function() {
      cy.visit(CLIENT_ROOT);

      cy.get("#inputEmail")
        .type(this.volunteer.email)
        .should("have.value", this.volunteer.email);

      cy.get("#inputPassword")
        .type(this.student.password)
        .should("have.value", this.volunteer.password);

      cy.get("button[type=submit]").click();
      cy.location("pathname").should("eq", "/dashboard");
    });

    it("Should log out successfully", function() {
      cy.login(this.volunteer);
      cy.location("pathname").should("eq", "/dashboard");

      cy.get(".AppSidebar-final-link").click();
      cy.location("pathname").should("eq", "/logout");
    });
  });
});

/**
 * @summary Tests failing to log in
 */
describe("Fail logging in", () => {
  beforeEach(() => {
    cy.fixture("users/student1").as("student");
  });

  it("Use incorrect email", function() {
    cy.server();
    cy.route(`${SERVER_ROOT}/api/user`).as("userAPI");
    cy.visit(`${CLIENT_ROOT}/login`);

    cy.get("#inputEmail")
      .type("fake@email.com")
      .should("have.value", "fake@email.com");

    cy.get("#inputPassword")
      .type(this.student.password)
      .should("have.value", this.student.password);

    cy.get("button[type=submit]").click();

    cy.wait("@userAPI").then(function(xhr) {
      const response = xhr.status;
      expect(response).to.equal(401);
    });
  });

  it("Use incorrect password", function() {
    cy.server();
    cy.route(`${SERVER_ROOT}/api/user`).as("userAPI");
    cy.visit(`${CLIENT_ROOT}/login`);

    cy.get("#inputEmail")
      .type(this.student.email)
      .should("have.value", this.student.email);

    cy.get("#inputPassword")
      .type("fakepassword")
      .should("have.value", "fakepassword");

    cy.get("button[type=submit]").click();

    cy.wait("@userAPI").then(function(xhr) {
      const response = xhr.status;
      expect(response).to.equal(401);
    });
  });
});
