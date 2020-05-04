// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

const AUTH_ROOT = `${Cypress.env("SERVER_ROOT")}/auth`;
const API_ROOT = `${Cypress.env("SERVER_ROOT")}/api`;

Cypress.Commands.add("login", user => {
  cy.request({
    method: "POST",
    url: `${AUTH_ROOT}/login`,
    body: {
      email: user.email,
      password: user.password
    }
  });
});

Cypress.Commands.add("logout", () => {
  cy.request({
    url: `${AUTH_ROOT}/logout`
  });
});

Cypress.Commands.add("deleteUserByEmail", email => {
  cy.request({
    method: "DELETE",
    url: `${API_ROOT}/user`,
    body: {
      email
    }
  });
});

Cypress.Commands.add("getVolunteerCodes", () => {
  //get valid codes from server
  const validCodesUrl = `${Cypress.env(
    "SERVER_ROOT"
  )}/auth/register/volunteercodes`;

  return cy
    .request({
      url: validCodesUrl
    })
    .its("body.volunteerCodes");
});

Cypress.Commands.add("createUser", userObj => {
  const registerUrl = `${Cypress.env("SERVER_ROOT")}/auth/register`;
  const setProfileUrl = `${Cypress.env("SERVER_ROOT")}/api/user`;

  cy.request({
    url: registerUrl,
    method: "POST",
    body: {
      isVolunteer: userObj.isVolunteer,
      email: userObj.email,
      password: userObj.password,
      code: userObj.code,
      college: userObj.college,
      phone: userObj.phoneNumber,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      terms: true
    }
  }).then(response => {
    const user = response.body.user;
    user.email = userObj.email;
    user.college = userObj.college;
    user.phone = userObj.phoneNumber;
    (user.firstname = userObj.firstName.trim()),
      (user.lastname = userObj.lastName.trim());

    cy.request({
      url: setProfileUrl,
      method: "PUT",
      body: user
    });
  });
});

Cypress.Commands.add("getVerificationToken", userid => {
  const verificationTokenUrl = `${Cypress.env(
    "SERVER_ROOT"
  )}/api/verificationtoken`;

  cy.request({
    url: verificationTokenUrl,
    qs: { userid }
  }).its("body.verificationToken");
});

Cypress.Commands.add("getSessionId", url => {
  let index = url.length - 1;

  while (url[index - 1] !== "/") {
    index--;
  }
  const sessionId = url.slice(index, url.length);

  return sessionId;
});

Cypress.Commands.add("endAllSessions", () => {
  cy.request({
    method: "POST",
    url: `${API_ROOT}/session/end-all`,
    body: {}
  });
});

Cypress.Commands.add("getVolunteerCodes", () => {
  //get valid codes from server
  const validCodesUrl = `${Cypress.env(
    "SERVER_ROOT"
  )}/auth/register/volunteercodes`;

  return cy
    .request({
      url: validCodesUrl
    })
    .its("body.volunteerCodes");
});

Cypress.Commands.add("createUser", userObj => {
  const registerUrl = `${Cypress.env("SERVER_ROOT")}/auth/register`;
  const setProfileUrl = `${Cypress.env("SERVER_ROOT")}/api/user`;

  cy.request({
    url: registerUrl,
    method: "POST",
    body: {
      isVolunteer: userObj.isVolunteer,
      email: userObj.email,
      password: userObj.password,
      code: userObj.code,
      college: userObj.college,
      phone: userObj.phoneNumber,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      terms: true
    }
  }).then(response => {
    const user = response.body.user;
    user.email = userObj.email;
    user.college = userObj.college;
    user.phone = userObj.phoneNumber;
    (user.firstname = userObj.firstName.trim()),
      (user.lastname = userObj.lastName.trim());

    cy.request({
      url: setProfileUrl,
      method: "PUT",
      body: user
    });
  });
});

Cypress.Commands.add("getVerificationToken", userid => {
  const verificationTokenUrl = `${Cypress.env(
    "SERVER_ROOT"
  )}/api/verificationtoken`;

  cy.request({
    url: verificationTokenUrl,
    qs: { userid }
  }).its("body.verificationToken");
});

Cypress.Commands.add("vuex", options => {
  cy.window(options).its("app.$store");
});
