const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  userid: { required: true, type: String },
  eventid: { required: true, type: String },
  ticketDetails: {
    name: { required: true, type: String },
    email: { required: true, type: String },
    eventname: { required: true, type: String },
    eventdate: { required: true, type: Date },
    eventtime: { required: true, type: String },
    ticketprice: { required: true, type: Number },
    qr: { required: true, type: String },
  },
  count: { type: Number, default: 0 },
});

const TicketModel = mongoose.model(`Ticket`, ticketSchema);
module.exports = TicketModel;
