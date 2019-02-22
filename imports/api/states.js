import { Mongo } from "meteor/mongo";

export const States = new Mongo.Collection("states");

Meteor.methods({
  "states.update"({ stateId, fieldsToUpdate }) {
    const state = States.findOne(stateId);

    States.update(todoId, {
      $set: { fieldsToUpdate }
    });
  }
});
