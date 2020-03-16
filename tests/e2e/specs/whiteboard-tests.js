/**
 *
 * Potential issues that may relate to undo, redo, clearing whiteboard and the pan tool tests
 * not accurately getting the mismatched pixels between the base snapshot and the new snapshot.
 * Tests involving those tools are passing regardless of the error threshold passed into compareSnapshot().
 * https://github.com/mapbox/pixelmatch/issues/21
 * https://github.com/mapbox/pixelmatch/issues/26
 *
 */

describe("Whiteboard interaction", () => {
  before(function() {
    cy.fixture("users/student1").as("student");
    cy.fixture("users/Volunteer1").as("volunteer");
  });

  after(function() {
    cy.login(this.student);
    cy.endAllSessions();
  });

  describe("Whiteboard tools", () => {
    before(function() {
      cy.login(this.student);
      cy.endAllSessions();

      cy.visit("/dashboard");

      cy.get(".SubjectCard:nth-of-type(1) .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.get(".SubjectSelectionModal-subtopic:nth-of-type(1)")
        .should("be.visible")
        .click();

      cy.get(".ModalTemplate-form .LargeButton-primary")
        .should("be.visible")
        .click();

      cy.location("pathname").should("eq", "/session/math/algebra");
      cy.wait(7000);

      const SESSION_URL_PATTERN = /^\/session\/math\/algebra\/\w{24}$/;
      cy.location("pathname").should("match", SESSION_URL_PATTERN);
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot("clear-whiteboard");
    });

    it("Should draw on the whiteboard successfully", function() {
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot("brush-stroke");
      cy.get(".toolbar-item")
        .eq(3)
        .click();
      cy.get(".color-button")
        .eq(1)
        .click();
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown")
        .trigger("pointerup", 100, 100);
      cy.get(".zwibbler-canvas-holder").compareSnapshot("brush-stroke", 0.1);
    });

    it("Should show handles when selecting a brush stroke", () => {
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot(
        "select-brush-stroke"
      );
      cy.get(".toolbar-item--pick").click();
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown", 100, 100)
        .trigger("pointerup", 100, 100);
      cy.get(".zwibbler-canvas-holder").compareSnapshot(
        "select-brush-stroke",
        0.1
      );
    });

    it("Should resize the selected brush stroke", () => {
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot(
        "resize-brush-stroke"
      );
      cy.get(".toolbar-item--pick").click();
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown", 100, 100)
        .trigger("pointerup", 200, 200);
      cy.get(".zwibbler-canvas-holder").compareSnapshot(
        "resize-brush-stroke",
        0.1
      );
    });

    it("Should move brush stroke across the whiteboard", () => {
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot(
        "move-brush-stroke"
      );
      cy.get(".toolbar-item--pick").click();
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown", 250, 250)
        .trigger("pointerup", 400, 300);
      cy.get(".zwibbler-canvas-holder").compareSnapshot(
        "move-brush-stroke",
        0.1
      );
    });

    /**
     * The tests below are passing regardless of the threshold placed.
     * See the comment at the top of this file for potential related issues.
     */
    it("Should undo moved brush stroke", () => {
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot(
        "undo-brush-stroke"
      );
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown", 400, 300)
        .trigger("pointerup", 300, 300);

      cy.get(".toolbar-item")
        .eq(4)
        .click();

      cy.get(".zwibbler-canvas-holder").compareSnapshot(
        "undo-brush-stroke",
        0.0
      );
    });

    it("Should redo after undo action", () => {
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot(
        "redo-brush-stroke"
      );

      cy.get(".toolbar-item")
        .eq(4)
        .click();

      cy.get(".toolbar-item")
        .eq(5)
        .click();

      cy.get(".zwibbler-canvas-holder").compareSnapshot(
        "redo-brush-stroke",
        0.0
      );
    });

    it("Should clear whiteboard", () => {
      cy.get(".toolbar-item")
        .eq(6)
        .click();
      cy.get(".zwibbler-canvas-holder").compareSnapshot(
        "clear-whiteboard",
        0.0
      );
    });

    it("Should use pan tool", () => {
      cy.get(".toolbar-item--pick").click();
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown", 100, 100)
        .trigger("pointerup", 200, 200);

      // Use pan tool to drag view to a blank whiteboard
      cy.get(".toolbar-item")
        .eq(0)
        .click();
      cy.get(".zwibbler-canvas-holder").captureBaseSnapshot("pan-tool");
      cy.get(".zwibbler-canvas-holder")
        .trigger("pointerdown", 100, 100, { force: true })
        .trigger("pointerup", 2600, 300, { force: true });

      cy.get(".zwibbler-canvas-holder").compareSnapshot("pan-tool", 0.0);
    });
  });
});
