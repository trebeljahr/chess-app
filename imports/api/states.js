import { Mongo } from "meteor/mongo";
import { getDefaultState } from "../frontend/src/helpers/getDefaultState.js";
export const States = new Mongo.Collection("states");

Meteor.methods({
  "states.createNew"(id) {
    States.insert({ id, ...getDefaultState() });
  },
  "states.update"({ id, fieldsToUpdate }) {
    States.update({ id }, { $set: { ...fieldsToUpdate } });
  },
  "states.list"() {
    return getDefaultState();
  }
});
