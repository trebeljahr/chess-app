import "../imports/api/states.js";

Meteor.publish("states.public", function(id) {
  return States.find();
});
