import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { check } from "meteor/check";

export const board = new Mongo.Collection("board");

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish("board", function tasksPublication() {
    return board.find({
      board: board
    });
  });
}
