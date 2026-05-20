const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true
    },

    sender: {
        type: String,
        required: true
    },

    time: {
        type: String,
        required: true
    }

});

module.exports = mongoose.model(
    "Message",
    messageSchema
);