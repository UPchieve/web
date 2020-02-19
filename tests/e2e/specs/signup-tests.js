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
      cy.logout();
    });

    it("Should successfully create a new student account", function() {
      cy.visit("/signup");

      cy.location("pathname").should("eq", "/signup");

      cy.get("button")
        .contains("Student")
        .click();

      cy.get("#inputHighschool")
        .type(this.newStudent.highSchool)
        .should("have.value", this.newStudent.highSchool);

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

      cy.location("pathname").should("eq", "/dashboard");
    });
  });

  describe("Volunteer signup", () => {
    it("Should successfully create a new volunteer account", function() {
      cy.visit("/signup");

      cy.location("pathname").should("eq", "/signup");

      cy.get("button")
        .contains("Volunteer")
        .click();

      cy.get("#inputRegistrationCode")
        .type(this.newVolunteer.code)
        .should("have.value", this.newVolunteer.code);

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

      cy.get("#phoneNumber")
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

      cy.get("div.uc-form-body").should("contain", "verification email");
    });
  });
});
