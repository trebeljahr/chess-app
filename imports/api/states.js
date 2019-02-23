import { Mongo } from "meteor/mongo";
import { getDefaultState } from "../src/helpers/getDefaultState.js";
export const States = new Mongo.Collection("states");

Meteor.methods({
  "states.createNew"({ name }) {
    States.insert({ name, ...getDefaultState() });
  },
  "states.update"({ title, fieldsToUpdate }) {
    States.update({ title }, { $set: { ...fieldsToUpdate } });
  },
  "states.deleteById"({ _id }) {
    States.remove({ _id });
  }
});
