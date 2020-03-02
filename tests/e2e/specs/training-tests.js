// Helper function to answer a question and click to the
// next question or submit the test
const answerQuestion = function(index, numOfQuestions, answer) {
  cy.get(`input[type=radio][value=${answer}]`).click();

  if (index < numOfQuestions - 1) {
    cy.get("button[type=next]").click();
  } else {
    cy.get("button[type=submit]").click();
  }
};

describe("Training quizzes", function() {
  beforeEach(function() {
    cy.fixture("users/volunteer1").as("adminVolunteer");
    cy.fixture("users/volunteer3").as("untrainedVolunteer");

    const getProfileUrl = `${Cypress.env("SERVER_ROOT")}/api/user`;

    cy.get("@untrainedVolunteer").then(untrainedVolunteer =>
      cy.login(untrainedVolunteer)
    );

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
          cy.get("@adminVolunteer").then(adminVolunteer =>
            cy.login(adminVolunteer)
          );

          cy.get("@untrainedVolunteer")
            .its("email")
            .then(email => cy.deleteUserByEmail(email));

          cy.logout();

          cy.get("@untrainedVolunteer").then(untrainedVolunteer => {
            const userObj = Object.assign({}, untrainedVolunteer);

            cy.get("@adminVolunteer").then(adminVolunteer =>
              cy.login(adminVolunteer)
            );

            cy.getVolunteerCodes().then(codes => {
              userObj.code = codes[0];

              cy.createUser(userObj);
            });
          });

          cy.request({
            url: getProfileUrl
          })
            .its("body.user")
            .then(user => {
              cy.get("@adminVolunteer").then(adminVolunteer =>
                cy.login(adminVolunteer)
              );

              cy.getVerificationToken(user._id).then(token => {
                cy.logout();

                const verifyUserUrl = `${Cypress.env(
                  "SERVER_ROOT"
                )}/api/verify/confirm?userid=${user._id}`;

                cy.get("@untrainedVolunteer").then(untrainedVolunteer =>
                  cy.login(untrainedVolunteer)
                );

                cy.request({
                  method: "POST",
                  url: verifyUserUrl,
                  body: { token }
                });
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
  });

  it("Should pass algebra quiz", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
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

        cy.get("@categoryQuestions").then(categoryQuestions => {
          cy.get("button.start").click();

          questions.forEach((question, i) => {
            const correctAnswer = categoryQuestions.filter(
              cq => cq._id === question._id
            )[0].correctAnswer;

            answerQuestion(i, questions.length, correctAnswer);
          });

          cy.wait("@score")
            .its("response.body")
            .then(data => {
              cy.get(".passed").should("contain", "passed");

              cy.get(".score").should("contain", data.score.toString());
            });
        });
      });
  });

  it("Should fail algebra quiz", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button.start").click();

        questions.forEach((question, i) => {
          answerQuestion(i, questions.length, "a");
        });

        cy.wait("@score")
          .its("response.body")
          .then(data => {
            cy.get(".passed").should("contain", "failed");

            cy.get(".score").should("contain", data.score.toString());
          });
      });
  });

  it("Should not allow incomplete answers", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button.start").click();

        questions.forEach((question, i) => {
          if (i == 0) {
            cy.get("button[type=next]").click();
          } else {
            answerQuestion(i, questions.length, "a");
          }
        });

        cy.get(".score").should("contain", "must answer all questions");
      });
  });

  it("Should render MathJax on quiz pages and quiz review page", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button.start").click();

        questions.forEach((question, i) => {
          if (question.questionText.includes("\\")) {
            cy.get("div.questionText > script[type~=math\\/tex]").should(
              "exist"
            );
          }

          if (question.possibleAnswers.some(answer => answer.txt.includes("\\"))) {
            cy.get(".possibleAnswers label > script[type~=math\\/tex]").should(
              "exist"
            );
          }

          answerQuestion(i, questions.length, "a");
        });

        cy.get(".reviewBtn").click();

        if (questions.some(question => question.questionText.includes("\\"))) {
          cy.get("div.questionText > script[type~=math\\/tex]").should("exist");
        }

        if (
          questions.some(question =>
            question.possibleAnswers.some(answer => answer.txt.includes("\\"))
          )
        ) {
          cy.get(".possibleAnswers label > script[type~=math\\/tex]").should(
            "exist"
          );
        }
      });
  });
});
