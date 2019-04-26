import { Accounts } from "meteor/accounts-base";

const redirect = err => {
  if (err) {
    console.error(err);
    return;
  }
  window.location.href = "/";
  AccountsTemplates.setState("hide");
};

AccountsTemplates.configure({
  // Behavior
  confirmPassword: true,
  enablePasswordChange: true,
  forbidClientAccountCreation: false,
  overrideLoginErrors: true,
  sendVerificationEmail: false,
  lowercaseUsername: false,
  focusFirstInput: true,

  // Appearance
  showAddRemoveServices: false,
  showForgotPasswordLink: false,
  showLabels: true,
  showPlaceholders: true,
  showResendVerificationEmailLink: false,

  // Client-side Validation
  continuousValidation: false,
  negativeFeedback: false,
  negativeValidation: true,
  positiveValidation: true,
  positiveFeedback: true,
  showValidating: true,

  // Privacy Policy and Terms of Use
  privacyUrl: "privacy",
  termsUrl: "terms-of-use",

  // Redirects
  homeRoutePath: "/",
  redirectTimeout: 4000,

  // Hooks
  onLogoutHook: () => {
    window.location.href = "/login/";
    AccountsTemplates.setState("signIn");
  },
  onSubmitHook: redirect,
  postSignUpHook: redirect
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
