const hello = function(userId, info) {
  console.log(userId, info);
};
var pwd = AccountsTemplates.removeField("password");
AccountsTemplates.removeField("email");
AccountsTemplates.addFields([
  {
    _id: "username",
    type: "text",
    displayName: "username",
    required: true,
    minLength: 1
  },
  pwd
]);
var mySubmitFunc = function(error, state) {
  if (!error) {
    if (Meteor.isServer) {
    } else {
      console.log("Hi?");
      FlowRouter.redirect("/");
    }
  }
};
AccountsTemplates.configure({
  onSubmitHook: mySubmitFunc,
  postSignUpHook: mySubmitFunc,
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
  //privacyUrl: "privacy",
  //termsUrl: "terms-of-use",

  // Redirects

  // Hooks
  onLogoutHook: () => {
    FlowRouter.go("Login");
  }
});
