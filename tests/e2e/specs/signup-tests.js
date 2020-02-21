describe("Student and volunteer signup", () => {
  before(function() {
    cy.fixture("users/newStudent1").as("newStudent");
    cy.fixture("users/newVolunteer1").as("newVolunteer");
    cy.fixture("users/Volunteer1").as("volunteer");
  });

  describe("Student signup", () => {
    before(function() {
      cy.login(this.volunteer);

      cy.deleteUserByEmail(this.newStudent.email);

      const approvedHighschoolsUrl = `${Cypress.env(
        "SERVER_ROOT"
      )}/school/findeligible`;
      cy.request({
        url: approvedHighschoolsUrl,
        qs: {
          skip: 0,
          limit: 1
        }
      }).as("approvedHighschools");

      cy.logout();
    });

    it("Should successfully create a new student account", function() {
      cy.server();
      cy.route("PUT", "/api/user").as("setProfile");

      cy.visit("/signup");

      cy.location("pathname").should("eq", "/signup");

      cy.get("button")
        .contains("Student")
        .click();

      cy.get("@approvedHighschools").then(response => {
        const highSchool = response.body.eligibleSchools[0];

        cy.get("#inputHighschool")
          .type(highSchool.name)
          .should("have.value", highSchool.name);

        cy.get(".uc-autocomplete-result:first").click();

        cy.get("button[type=submit]").click();

        cy.get("#inputEmail")
          .type(this.newStudent.email)
          .should("have.value", this.newStudent.email);

        cy.get("#inputPassword")
          .type(this.newStudent.password)
          .should("have.value", this.newStudent.password);

        cy.get("button[type=submit]").click();

        cy.get("#firstName")
          .type(this.newStudent.firstName)
          .should("have.value", this.newStudent.firstName);

        cy.get("#lastName")
          .type(this.newStudent.lastName)
          .should("have.value", this.newStudent.lastName);

        cy.get("#userAgreement").click();

        cy.get("button[type=submit]").click();

        cy.wait("@setProfile");
        cy.location("pathname").should("eq", "/dashboard");
      });
    });
  });

  describe("Volunteer signup", () => {
    before(function() {
      cy.login(this.volunteer);

      cy.deleteUserByEmail(this.newVolunteer.email);

      const validCodesUrl = `${Cypress.env(
        "SERVER_ROOT"
      )}/auth/register/volunteercodes`;
      cy.request({
        url: validCodesUrl
      }).as("volunteerCodes");

      cy.logout();
    });

    it("Should successfully create a new volunteer account", function() {
      cy.server();
      cy.route("PUT", "/api/user").as("setProfile");

      cy.visit("/signup");

      cy.location("pathname").should("eq", "/signup");

      cy.get("button")
        .contains("Volunteer")
        .click();

      cy.get("@volunteerCodes").then(response => {
        const code = response.body.volunteerCodes[0];

        cy.get("#inputRegistrationCode")
          .type(code)
          .should("have.value", code);

        cy.get("button[type=submit]").click();

        cy.get("#inputEmail")
          .type(this.newVolunteer.email)
          .should("have.value", this.newVolunteer.email);

        cy.get("#inputPassword")
          .type(this.newVolunteer.password)
          .should("have.value", this.newVolunteer.password);

        cy.get("button[type=submit]").click();

        cy.get("#firstName")
          .type(this.newVolunteer.firstName)
          .should("have.value", this.newVolunteer.firstName);

        cy.get("#lastName")
          .type(this.newVolunteer.lastName)
          .should("have.value", this.newVolunteer.lastName);

        cy.get("#phoneNumber_phone_number")
          .type(this.newVolunteer.phoneNumber)
          .should("have.value", this.newVolunteer.phoneNumber);

        cy.get("#college")
          .type(this.newVolunteer.college)
          .should("have.value", this.newVolunteer.college);

        cy.get("#favoriteAcademicSubject")
          .type(this.newVolunteer.favoriteAcademicSubject)
          .should("have.value", this.newVolunteer.favoriteAcademicSubject);

        cy.get("#userAgreement").click();

        cy.get("button[type=submit]").click();

        cy.wait("@setProfile");
        cy.get("div.uc-form-body").should("contain", "verification email");
      });
    });

    it("Should verify successfully", function() {
      cy.server();
      cy.route("POST", "/api/verify/confirm").as("confirmVerification");

      cy.login(this.newVolunteer);
      cy.request({
        url: `${Cypress.env("SERVER_ROOT")}/api/user`
      }).as("getProfile");
      cy.logout();

      cy.login(this.volunteer);

      const verificationTokenUrl = `${Cypress.env(
        "SERVER_ROOT"
      )}/api/verificationtoken`;
      cy.get("@getProfile")
        .its("body.user._id")
        .then(userid => {
          return cy.request({
            url: verificationTokenUrl,
            qs: { userid }
          });
        })
        .then(response => {
          const token = response.body.verificationToken;
          const verifyPath = `/action/verify/${token}`;

          cy.visit(verifyPath);

          cy.location("pathname").should("eq", verifyPath);

          cy.wait("@confirmVerification");
          cy.location("pathname").should("eq", "/dashboard");
        });

      cy.logout();
    });
  });
});
