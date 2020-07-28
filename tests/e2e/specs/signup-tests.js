describe("Student and volunteer signup", () => {
  before(function() {
    cy.fixture("users/newStudent1").as("newStudent");
    cy.fixture("users/newVolunteer1").as("newVolunteer");
    cy.fixture("users/volunteer1").as("volunteer");
  });

  describe("Student signup", () => {
    beforeEach(function() {
      cy.login(this.volunteer);

      cy.deleteUserByEmail(this.newStudent.email);

      const approvedHighschoolsUrl = `${Cypress.env(
        "SERVER_ROOT"
      )}/api-public/eligibility/school/findeligible`;
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

      cy.visit("/sign-up");

      cy.location("pathname").should("eq", "/sign-up");

      cy.get("button")
        .contains("I need an Academic Coach")
        .click();

      cy.get("@approvedHighschools").then(response => {
        const highSchool = response.body.eligibleSchools[0];

        cy.get("#inputHighschool")
          .type(highSchool.name)
          .should("have.value", highSchool.name);

        cy.get(".uc-autocomplete-result:first").click();

        cy.get("#inputZipCode").type("11201");

        cy.get("#inputEligibilityEmail")
          .type(this.newStudent.email)
          .should("have.value", this.newStudent.email);

        cy.get("button[type=submit]").click();

        cy.get("h3").should("contain", "Woohoo");

        cy.get("button")
          .contains("Continue")
          .click();

        cy.get("#firstName")
          .type(this.newStudent.firstName)
          .should("have.value", this.newStudent.firstName);

        cy.get("#lastName")
          .type(this.newStudent.lastName)
          .should("have.value", this.newStudent.lastName);

        cy.get("#inputPassword")
          .type(this.newStudent.password)
          .should("have.value", this.newStudent.password);

        cy.get("#userAgreement").click();

        cy.get("button[type=submit]").click();

        cy.location("pathname").should("eq", "/dashboard");
      });
    });

    it("Should not let ineligible student sign up", function() {
      cy.visit("/sign-up");

      cy.location("pathname").should("eq", "/sign-up");

      cy.get("button")
        .contains("I need an Academic Coach")
        .click();

      cy.get("#inputHighschool")
        .type(this.newStudent.highSchool)
        .should("have.value", this.newStudent.highSchool);

      cy.get(".uc-autocomplete-result:first").click();

      cy.get("#inputZipCode").type("10001");

      cy.get("#inputEligibilityEmail")
        .type(this.newStudent.email)
        .should("have.value", this.newStudent.email);

      cy.get("button[type=submit]").click();

      cy.get("h3").should("contain", "Sorry");
    });
  });

  describe("Volunteer signup", () => {
    before(function() {
      cy.login(this.volunteer);
      cy.deleteUserByEmail(this.newVolunteer.email);
      cy.logout();
    });

    it("Should successfully create a new volunteer account", function() {
      cy.server();
      cy.route("POST", "/auth/register/volunteer/open").as(
        "registerOpenVolunteer"
      );

      cy.visit("/sign-up");

      cy.location("pathname").should("eq", "/sign-up");

      cy.get("button")
        .contains("I’d like to become an Academic Coach")
        .click();

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

      cy.get("#userAgreement").click();

      cy.get("button[type=submit]").click();

      cy.wait("@registerOpenVolunteer")
        .its("responseBody.user._id")
        .as("userId");

      cy.get("div.uc-form-body").should("contain", "verification email");

      cy.route("POST", "/api/verify/confirm").as("confirmVerification");

      cy.get("@userId")
        .then(userid => {
          cy.login(this.volunteer);

          cy.getVerificationToken(userid).as("token");

          cy.logout();
          // We need to be logged in as the new volunteer for the
          // confirmation step. Normally, a new user would still be logged
          // in after signing up and then checking email, but for this
          // test we had to log in as the admin to get the token
          cy.login(this.newVolunteer);

          return cy.get("@token");
        })
        .then(token => {
          const verifyPath = `/action/verify/${token}`;

          cy.visit(verifyPath);

          cy.wait("@confirmVerification");
          cy.location("pathname").should("eq", "/dashboard");
          cy.get(".SidebarInfo-name").should(
            "contain",
            this.newVolunteer.firstName
          );
          cy.get(".DashboardBanner-greeting").should(
            "contain",
            this.newVolunteer.firstName
          );
        });
    });
  });

  describe("Fail verification", function() {
    before(function() {
      cy.login(this.volunteer);
      cy.deleteUserByEmail(this.newVolunteer.email);
      cy.logout();
      cy.createOpenVolunteer(this.newVolunteer);
    });

    it("Should not accept invalid verification token", function() {
      cy.server();
      cy.route("POST", "/api/verify/confirm").as("verifyAPI");

      cy.visit("/action/verify/00aa11bb22cc33dd44ee55ff66778899");

      cy.wait("@verifyAPI").then(function(xhr) {
        const response = xhr.status;
        expect(response).to.equal(404);
      });
    });
  });
});
