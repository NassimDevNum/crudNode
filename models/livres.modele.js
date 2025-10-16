const mongoose = require("mongoose");


const livreSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    nom: String,
    auteur: String,
    pages: Number,
    desc: String,
    image: {
        type: String,
        default: null  // null si pas d'image
    },
     userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

module.exports = mongoose.model("Livre",livreSchema);