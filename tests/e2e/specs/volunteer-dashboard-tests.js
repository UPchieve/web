describe("Volunteer dashboard", () => {
  before(function() {
    cy.fixture("users/volunteer3").as("openVolunteer");
    cy.fixture("users/partnerVolunteer").as("partnerVolunteer");
  });

  describe("Open Volunteer", () => {
    describe("Photo ID upload", () => {
      beforeEach(function() {
        cy.login(this.openVolunteer);
        cy.server();
        cy.visit("/");

        cy.contains("Proof of identity").click();

        cy.get("input[type=file]").attachFile("images/placeholder.jpg");
      });

      it("Should upload a photo id", function() {
        cy.route("/api/user/volunteer-approval/photo-url", {
          success: true,
          message: "AWS SDK S3 pre-signed URL generated successfully",
          uploadUrl: "noop"
        });

        cy.get(".submit-btn")
          .click()
          .get(".upc-modal")
          .should("not.exist");

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[0])
          .contains("In review");
      });

      it("Should unsuccessfully upload a photo id", function() {
        cy.route("/api/user/volunteer-approval/photo-url", {
          success: false,
          message: "Pre-signed URL error",
          uploadUrl: ""
        });

        cy.get(".submit-btn")
          .click()
          .get(".upc-modal")
          .should("exist")
          .get(".error")
          .contains("Sorry, we had trouble uploading your photo.");

        cy.get(".upc-modal-close-icon")
          .click()
          .get("upc-modal")
          .should("not.exist");

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[0])
          .contains("Add photo");
      });

      it("Should upload a photo id and remove it", function() {
        cy.get(".trash-icon-container")
          .click()
          .get(".upc-modal")
          .should("exist");

        cy.get(".upload-photo-btn")
          .contains("Upload Photo")
          .get(".upc-modal-close-icon")
          .click()
          .get("upc-modal")
          .should("not.exist");

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[0])
          .contains("Add photo");
      });
    });

    describe("Adding references", () => {
      beforeEach(function() {
        cy.login(this.openVolunteer);
        cy.server();
        cy.visit("/");

        cy.contains("Reference check")
          .click()
          .get(".add-reference-btn")
          .click();
      });

      it("Should see incomplete status when only one reference is added", function() {
        cy.get("#reference-name")
          .type("Jane Doe")
          .get("#reference-email")
          .type("janedoe@anon.com");

        cy.route({
          url: "/api/user/volunteer-approval/reference",
          method: "POST",
          status: 200,
          response: {}
        });

        cy.get(".save-btn").click();

        cy.get(".references-container")
          .contains("janedoe@anon.com")
          .get(".done-btn")
          .click();

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[1])
          .contains("Incomplete: 1 out of 2 references submitted");
      });

      it("Should remove a reference", function() {
        cy.get("#reference-name")
          .type("Jane Doe")
          .get("#reference-email")
          .type("janedoe@anon.com");

        cy.route({
          url: "/api/user/volunteer-approval/reference",
          method: "POST",
          status: 200,
          response: {}
        });

        cy.get(".save-btn")
          .click()
          .get(".trash-icon")
          .click();

        cy.get(".references-container")
          .contains("janedoe@anon.com")
          .should("not.exist")
          .get(".done-btn")
          .click();

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[1])
          .contains("Add references");
      });

      it("Should add two references", function() {
        cy.get("#reference-name")
          .type("Jane Doe")
          .get("#reference-email")
          .type("janedoe@anon.com");

        cy.route({
          url: "/api/user/volunteer-approval/reference",
          method: "POST",
          status: 200,
          response: {}
        });

        cy.get(".save-btn")
          .click()
          .get(".add-reference-btn")
          .click();

        cy.get("#reference-name")
          .type("John Doe")
          .get("#reference-email")
          .type("johndoe@anon.com")
          .get(".save-btn")
          .click();

        cy.get(".done-btn").click();

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[1])
          .contains("Pending");
      });
    });
  });

  describe("Partner Volunteer", () => {
    describe("Not approved", () => {
      beforeEach(function() {
        cy.login(this.partnerVolunteer);
        cy.server();
        cy.visit("/");
      });

      it("Should see add background information account action", function() {
        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[0])
          .contains("Background Information");
      });

      it("Should see not be able to submit background info when required fields are empty", function() {
        cy.server();

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[0])
          .contains("Background Information")
          .click();

        cy.route({
          url: "/api/user/volunteer-approval/background-information",
          method: "POST",
          status: 200,
          response: {}
        });

        cy.get(".uc-form-col")
          .eq(0)
          .get(".uc-form-checkbox input")
          .eq(2)
          .check();

        cy.get(".uc-form-col")
          .eq(1)
          .get(".uc-form-checkbox input")
          .eq(4)
          .check();

        cy.get(".submit-btn").should("be.disabled");
      });

      it.only("Should success message after submitting background info", function() {
        cy.server();

        cy.get(".account-action")
          .then(accountActionElems => accountActionElems[0])
          .contains("Background Information")
          .click();

        cy.get(".uc-form-col")
          .eq(0)
          .find(".uc-form-checkbox input")
          .eq(2)
          .check();

        cy.get(".uc-form-col")
          .eq(1)
          .find(".uc-form-checkbox input")
          .eq(1)
          .check();

        cy.get(".uc-form-col")
          .eq(3)
          .find(".uc-form-radio input")
          .eq(3)
          .check();

        cy.route({
          url: "/api/user/volunteer-approval/background-information",
          method: "POST",
          status: 200,
          response: {}
        });

        cy.get(".submit-btn").click();

        cy.get(".background-info__wrapper").contains("Thank you");
      });
    });
  });
});
