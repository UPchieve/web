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
    })
      .its("body.user")
      .then(user => {
        // if untrainedVolunteer is trained, delete and recreate it
        if (
          user.certifications.algebra.passed ||
          user.certifications.algebra.tries === 3
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
    cy.route("POST", "/api/training/questions").as("getQuestions");
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

    cy.wait("@getQuestions")
      .its("response.body.questions")
      .as("questions");
  });

  it("Should pass algebra quiz", function() {
    cy.get("button.start").click();

    cy.logout();
    cy.login(this.adminVolunteer);
    const categoryQuestionsUrl = `${Cypress.env(
      "SERVER_ROOT"
    )}/edu/categoryquestions`;

    cy.request({
      method: "POST",
      url: categoryQuestionsUrl,
      body: { category: "algebra" }
    })
      .its("body.questions")
      .as("categoryQuestions");
    cy.logout();
    cy.login(this.untrainedVolunteer);

    Promise.all([cy.get("@questions"), cy.get("@categoryQuestions")]).then(
      results => {
        const questions = results[0];
        const categoryQuestions = results[1];

        questions.forEach((question, i) => {
          const correctAnswer = categoryQuestions.filter(
            cq => cq._id === question._id
          )[0].correctAnswer;

          cy.get(`input[type=radio][value=${correctAnswer}]`).click();

          if (i < questions.length - 1) {
            cy.get("button[type=next]").click();
          } else {
            cy.get("button[type=submit]").click();
          }
        });

        cy.wait("@score")
          .its("response.body")
          .then(data => {
            cy.get(".passed").should("contain", "passed");

            cy.get(".score").should("contain", data.score.toString());
          });
      }
    );
  });

  it("Should fail algebra quiz", function() {
    cy.get("button.start").click();

    cy.get("@questions").then(questions => {
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
        .then(data => {
          cy.get(".passed").should("contain", "failed");

          cy.get(".score").should("contain", data.score.toString());
        });
    });
  });
});
