describe("Training quizzes", function() {
  before(function() {
    cy.fixture("users/volunteer1").as("adminVolunteer");
    cy.fixture("users/volunteer3").as("untrainedVolunteer");
  });

  beforeEach(function() {
    cy.login(this.untrainedVolunteer);

    const getProfileUrl = `${Cypress.env("SERVER_ROOT")}/api/user`;

    cy.request({
      url: getProfileUrl
    }).then(response => {
      // if untrainedVolunteer is trained, delete and recreate it
      if (
        response.body.user.certifications.algebra.passed ||
        response.body.user.certifications.algebra.tries === 3
      ) {
        cy.logout();

        cy.login(this.adminVolunteer);
        cy.deleteUserByEmail(this.untrainedVolunteer.email);

        cy.getVolunteerCodes()
          .then(codes => {
            cy.logout();

            const userObj = Object.assign({}, this.untrainedVolunteer);
            userObj.code = codes[0];

            return cy.createUser(userObj);
          })
          .then(() => {
            cy.login(this.adminVolunteer);
            cy.getVerificationToken().as("token");
            cy.logout();

              const verifyUserUrl = `${Cypress.env(
                "SERVER_ROOT"
              )}/api/verify/confirm?userid=${user._id}`;

            cy.login(this.untrainedVolunteer);
            cy.request({
              url: verifyUserUrl
            });
          });
      }
    });

    cy.server();
    cy.route("POST", "/api/training/questions").as("questions");
    cy.route("POST", "/api/training/score").as("score");

    cy.visit("/");

    cy.location("pathname").should("eq", "/dashboard");

    cy.contains("p", "Training")
      .parent(".SidebarLink")
      .click();

    cy.location("pathname").should("eq", "/training");

    cy.contains(".supercategory", "Math").click();

    cy.contains("div", "Algebra")
      .parent(".category")
      .children(".test")
      .children(".test-container")
      .children(".test-label")
      .click();

    cy.wait("@questions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button.start").click();

        questions.forEach((question, i) => {
          cy.get("form.possibleAnswers > div:first-child")
            .children(".options")
            .children("input[type=radio]")
            .click();

          if (i < questions.length - 1) {
            cy.get("button[type=next]").click();
          } else {
            cy.get("button[type=submit]").click();
          }
        });

        cy.wait("@score")
          .its("response.body")
          .as("scoreData");
      });
  });

  it("Should fail algebra quiz", function() {
    cy.get("@scoreData").then(data => {
      cy.get(".passed").should("contain", "failed");

      cy.get(".score").should("contain", data.score.toString());
    });
  });
});
