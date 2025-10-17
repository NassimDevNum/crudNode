const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    nom: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Empêche d'avoir 2 comptes avec le même email
        lowercase: true, // Convertit l'email en minuscules
        match: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/ // Validation format email
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Limite les valeurs possibles
        default: 'user',          // Par défaut
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);