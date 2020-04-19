describe("Student and volunteer signup", () => {
  before(function() {
    cy.fixture("users/newStudent1").as("newStudent");
    cy.fixture("users/newVolunteer1").as("newVolunteer");
    cy.fixture("users/volunteer1").as("volunteer");
  });

  describe("Student signup", () => {
    before(function() {
      cy.login(this.volunteer);

      cy.deleteUserByEmail(this.newStudent.email);

      const approvedHighschoolsUrl = `${Cypress.env(
        "SERVER_ROOT"
      )}/eligibility/school/findeligible`;
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

        cy.get("#inputZipCode").type("11201");

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

    it("Should add student to waitlist", function() {
      cy.visit("/signup");

      cy.location("pathname").should("eq", "/signup");

      cy.get("button")
        .contains("Student")
        .click();

      cy.get("#inputHighschool")
        .type(this.newStudent.highSchool)
        .should("have.value", this.newStudent.highSchool);

      cy.get(".uc-autocomplete-result:first").click();

      cy.get("#inputZipCode").type("10001");

      cy.get("button[type=submit]").click();

      cy.get("#inputWaitlistEmail")
        .type(this.newStudent.email)
        .should("have.value", this.newStudent.email);

      cy.get("button[type=submit]").click();

      cy.get(".step-title").should("contain", "Thank you!");
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

      cy.get("@volunteerCodes")
        .then(response => {
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

          cy.wait("@setProfile")
            .its("responseBody.user._id")
            .as("userId");
          cy.get("div.uc-form-body").should("contain", "verification email");

          cy.route("POST", "/api/verify/confirm").as("confirmVerification");

          return cy.get("@userId");
        })
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

    it("Should not accept invalid code", function() {
      cy.visit("/signup");

      cy.location("pathname").should("eq", "/signup");

      cy.get("button")
        .contains("Volunteer")
        .click();

      cy.get("#inputRegistrationCode")
        .type(this.newVolunteer.code)
        .should("have.value", this.newVolunteer.code);

      cy.get("button[type=submit]").click();

      cy.get(".uc-form-body:last-child").should("contain", "invalid");
    });
  });

  describe("Fail verification", function() {
    before(function() {
      cy.login(this.volunteer);

      cy.deleteUserByEmail(this.newVolunteer.email);

      cy.getVolunteerCodes().then(codes => {
        cy.logout();

        // register unverified new volunteer
        const userObj = Object.assign({}, this.newVolunteer);
        userObj.code = codes[0];
        cy.createUser(userObj);
      });
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
