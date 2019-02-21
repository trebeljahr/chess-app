import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";

export const Boards = new Mongo.Collection("boards");

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish("boards", function tasksPublication() {
    return Boards.find({
      board: board
    });
  });
}
Boards.insert({
  board: "Hello world!"
});
