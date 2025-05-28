const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  owner: String,
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  organizedBy: {
    type: String,
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  eventTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  likes : {
    type : Number,
  },
  ticketSold:{
    type:[mongoose.Schema.Types.ObjectId],
    ref:"Ticket",
  }
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
