import { Mongo } from "meteor/mongo";
import { getDefaultState } from "../src/helpers/getDefaultState.js";
export const States = new Mongo.Collection("states");

Meteor.methods({
  "states.createNew"({ name }) {
    States.insert({ name, ...getDefaultState() });
    return States.findOne({ name });
  },
  "states.update"({ _id, fieldsToUpdate }) {
    States.update(_id, { $set: { ...fieldsToUpdate } });
  },
  "states.deleteById"({ _id }) {
    States.remove({ _id });
  }
});
