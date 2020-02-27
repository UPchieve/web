describe("Volunteer availability", () => {
  before(function() {
    cy.fixture("users/Volunteer1").as("volunteer");
  });

  describe("Modify availability calendar", () => {
    beforeEach(function() {
      cy.login(this.volunteer);
    });

    /**
     * TODO:
     * Get first unchecked time (unless all selected)
     * cy.get('.timeOfDay input:not(:checked)').first()
     */

    it("Should display accurate availability on dashboard", function() {
      cy.visit("/dashboard");
      cy.location("pathname").should("eq", "/dashboard");

      const hoursSelectedRegex = /^(\d+) hours selected$/;

      cy.get(
        ".volunteer-impact__stat:first-of-type .volunteer-impact__stat-value"
      )
        .invoke("text")
        .then(hoursSelectedText => {
          expect(hoursSelectedText).to.match(hoursSelectedRegex);

          const hoursSelected = parseInt(
            hoursSelectedText.match(hoursSelectedRegex)[0]
          );

          cy.visit("/calendar");

          cy.get(".dayTimeContainer")
            .find(".timeOfDay input:checked")
            .should("have.length", hoursSelected);
        });
    });
  });
});
