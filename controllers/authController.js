var express = require("express");
var routeur = express.Router();
const userSchema = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// ========== INSCRIPTION ==========

// Route pour afficher le formulaire d'inscription
routeur.get("/register", (requete, reponse) => {
    reponse.render("register.html.twig");
});

// Route pour traiter l'inscription
routeur.post("/register", (requete, reponse) => {
    userSchema.findOne({ email: requete.body.email })
        .then(utilisateurExistant => {
            if (utilisateurExistant) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Cet email est déjà utilisé'
                };
                return reponse.redirect("/register");
            }

            bcrypt.hash(requete.body.password, 10, (err, hash) => {
                if (err) {
                    console.log(err);
                    return reponse.status(500).json({ error: err });
                }

                const user = new userSchema({
                    _id: new mongoose.Types.ObjectId(),
                    nom: requete.body.nom,
                    email: requete.body.email,
                    password: hash
                });

                user.save()
                    .then(resultat => {
                        console.log("Utilisateur créé:", resultat);
                        requete.session.message = {
                            type: 'success',
                            contenu: 'Inscription réussie ! Vous pouvez maintenant vous connecter.'
                        };
                        reponse.redirect("/login");
                    })
                    .catch(error => {
                        console.log(error);
                        reponse.status(500).json({ error: error });
                    });
            });
        })
        .catch(error => {
            console.log(error);
            reponse.status(500).json({ error: error });
        });
});

// ========== CONNEXION ==========

// Route pour afficher le formulaire de connexion
routeur.get("/login", (requete, reponse) => {
    reponse.render("login.html.twig");
});

// Route pour traiter la connexion
routeur.post("/login", (requete, reponse) => {
    userSchema.findOne({ email: requete.body.email })
        .then(user => {
            if (!user) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Email ou mot de passe incorrect'
                };
                return reponse.redirect("/login");
            }

            bcrypt.compare(requete.body.password, user.password, (err, result) => {
                if (err) {
                    requete.session.message = {
                        type: 'danger',
                        contenu: 'Erreur lors de la connexion'
                    };
                    return reponse.redirect("/login");
                }

                if (result) {
                    const token = jwt.sign(
                        {
                            userId: user._id,
                            email: user.email,
                            nom: user.nom
                        },
                        "CLÉ_SECRÈTE_SUPER_SÉCURISÉE",
                        {
                            expiresIn: "24h"
                        }
                    );

                    requete.session.user = {
                        id: user._id,
                        nom: user.nom,
                        email: user.email,
                        role: user.role,
                        token: token
                    };

                    requete.session.message = {
                        type: 'success',
                        contenu: 'Connexion réussie ! Bienvenue ' + user.nom
                    };
                    
                    reponse.redirect("/livres");
                } else {
                    requete.session.message = {
                        type: 'danger',
                        contenu: 'Email ou mot de passe incorrect'
                    };
                    reponse.redirect("/login");
                }
            });
        })
        .catch(error => {
            console.log(error);
            reponse.status(500).json({ error: error });
        });
});

// ========== DÉCONNEXION ==========

// Route pour se déconnecter
routeur.get("/logout", (requete, reponse) => {
    requete.session.destroy();
    reponse.redirect("/");
});

module.exports = routeur;