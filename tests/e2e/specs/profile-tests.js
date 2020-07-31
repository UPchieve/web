describe("Profile modification", () => {
  beforeEach(function() {
    cy.fixture("users/volunteer1").then(volunteer => {
      cy.login(volunteer);
    });
    cy.visit("/profile");
  });

  it("Should be able to edit phone number", function() {
    cy.get("button")
      .contains("Edit")
      .click();

    // Force the element to be cleared because Cypress incorrectly believes it's
    // being covered by another element.
    cy.get("#phone")
      .find("#VuePhoneNumberInput_phone_number")
      .clear({ force: true })
      .type("2125550212")
      .should("have.value", "(212) 555-0212");

    cy.get("button")
      .contains("Save")
      .click();

    cy.reload();

    cy.get("#phone").should("contain", "+1 212-555-0212");
  });

  it("Should not be able to save an invalid phone number", function() {
    cy.get("button")
      .contains("Edit")
      .click();

    // Force the element to be cleared because Cypress incorrectly believes it's
    // being covered by another element.
    cy.get("#phone")
      .find("#VuePhoneNumberInput_phone_number")
      .clear({ force: true })
      .type("5550212")
      .should("have.value", "(555) 021-2");

    cy.get("button")
      .contains("Save")
      .click();

    cy.get(".errors-list").should(
      "contain",
      "Please enter a valid phone number."
    );
  });
});
