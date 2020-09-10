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
            cy.createOpenVolunteer(untrainedVolunteer);
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

    cy.contains("span", "Subject Certifications").click();

    cy.contains("span", "Algebra")
      .parent(".training__cert-title")
      .parent(".training__cert")
      .next(".training__subjects-unlocked")
      .next(".action-btns")
      .children("button")
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
          cy.get("button[type=start]").click();

          questions.forEach((question, i) => {
            const correctAnswer = categoryQuestions.filter(
              cq => cq._id === question._id
            )[0].correctAnswer;

            answerQuestion(i, questions.length, correctAnswer);
          });

          cy.wait("@score")
            .its("response.body")
            .then(data => {
              cy.get(".score-container h2").should("contain", "passed");

              cy.get(".score-container .score").should(
                "contain",
                data.score.toString()
              );
            });
        });
      });
  });

  it("Should fail algebra quiz", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button[type=start]").click();

        questions.forEach((question, i) => {
          answerQuestion(i, questions.length, "a");
        });

        cy.wait("@score")
          .its("response.body")
          .then(data => {
            cy.get(".score-container h2").should("contain", "failed");

            cy.get(".score-container .score").should(
              "contain",
              data.score.toString()
            );
          });
      });
  });

  it("Should not allow incomplete answers", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button[type=start]").click();

        questions.forEach((question, i) => {
          if (i == 0) {
            cy.get("button[type=next]").click();
          } else {
            answerQuestion(i, questions.length, "a");
          }
        });

        cy.get(".quiz-error").should("contain", "must answer all questions");
      });
  });

  it("Should render MathJax on quiz pages and quiz review page", function() {
    cy.wait("@getQuestions")
      .its("response.body.questions")
      .then(questions => {
        cy.get("button[type=start]").click();

        questions.forEach((question, i) => {
          if (question.questionText.includes("\\")) {
            cy.get("div.questionText .mjx-chtml").should("exist");
          }

          question.possibleAnswers
            .filter(answer => answer.txt.includes("\\"))
            .forEach(answer => {
              cy.get(`#answer-${answer.val} .mjx-chtml`).should("exist");
            });

          answerQuestion(i, questions.length, "a");
        });

        cy.get(".review-btn").click();

        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];

          // assert that MathJax is rendered in question text
          if (question.questionText.includes("\\")) {
            cy.get(".question-number")
              .contains((i + 1).toString())
              .parent(".question")
              .children(".question-text")
              .children(".mjx-chtml")
              .should("exist");
          }

          // assert that MathJax is rendered in answers
          question.possibleAnswers
            .filter(answer => answer.txt.includes("\\"))
            .forEach(answer => {
              cy.get(`#question-${i}-answer-${answer.val} .mjx-chtml`).should(
                "exist"
              );
            });
        }
      });
  });
});
