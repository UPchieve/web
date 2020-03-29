const DEFAULT_TIMEZONE = "America/New_York";
const SELECTED_TIMES_SELECTOR = ".timeOfDay input:checked";
const THURSDAY_8AM_SELECTOR =
  ".dayTime div:nth-of-type(5) .times .timeOfDay:nth-of-type(8) input[type='checkbox']";

describe("Volunteer availability", () => {
  before(function() {
    cy.fixture("users/volunteer1").as("volunteer");
  });

  describe("Modify availability calendar", () => {
    before(function() {
      cy.login(this.volunteer);

      const clearScheduleUrl = `${Cypress.env(
        "SERVER_ROOT"
      )}/api/calendar/clear`;

      cy.request({
        method: "POST",
        url: clearScheduleUrl,
        body: {
          tz: DEFAULT_TIMEZONE
        }
      });
    });

    beforeEach(function() {
      cy.login(this.volunteer);
    });

    it("Should modify but not save the calendar", function() {
      cy.visit("/calendar");
      cy.location("pathname").should("eq", "/calendar");

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 0);

      cy.get(THURSDAY_8AM_SELECTOR)
        .should("not.be.checked")
        .check()
        .should("be.checked");

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 1);

      cy.reload();

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 0);
    });

    it("Should modify and then save the calendar", function() {
      cy.visit("/calendar");
      cy.location("pathname").should("eq", "/calendar");

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 0);

      cy.get(THURSDAY_8AM_SELECTOR)
        .should("not.be.checked")
        .check()
        .should("be.checked");

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 1);

      cy.get(".save-button")
        .should("contain.text", "Save")
        .click()
        .should("contain.text", "Saved");

      cy.reload();

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 1);
    });

    it("Should modify and then save the timezone", function() {
      cy.visit("/calendar");
      cy.location("pathname").should("eq", "/calendar");

      cy.get(THURSDAY_8AM_SELECTOR).should("be.checked");

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 1);

      const NEW_TIMEZONE = "Antarctica/Troll";

      cy.get(".tz-selector-container select")
        .should("have.value", DEFAULT_TIMEZONE)
        .select(NEW_TIMEZONE)
        .should("have.value", NEW_TIMEZONE);

      cy.get(".save-button")
        .should("contain.text", "Save")
        .click()
        .should("contain.text", "Saved");

      cy.reload();

      cy.get(".tz-selector-container select").should(
        "have.value",
        NEW_TIMEZONE
      );

      cy.get(THURSDAY_8AM_SELECTOR).should("be.checked");

      cy.get(".dayTimeContainer")
        .find(SELECTED_TIMES_SELECTOR)
        .should("have.length", 1);
    });

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
            .find(SELECTED_TIMES_SELECTOR)
            .should("have.length", hoursSelected);
        });
    });
  });
});
