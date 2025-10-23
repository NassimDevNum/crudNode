var express = require("express");
var routeur = express.Router();
const livreSchema = require("../models/livres.modele");
const mongoose = require("mongoose");
const upload = require("../upload");
const { isAuthenticated } = require("../middlewares/auth");

// ========== ACCUEIL (tous les livres) ==========

routeur.get("/", async (requete, reponse) => {
    try {
        const livres = await livreSchema.find();
        reponse.render("accueil.html.twig", { 
            livres: livres, 
            message: requete.session.message || null 
        });
        delete requete.session.message;
    } catch (err) {
        console.error(err);
        reponse.status(500).send("Erreur serveur");
    }
});

// ========== LISTE DES LIVRES DE L'UTILISATEUR ==========

routeur.get("/livres", isAuthenticated, (requete, reponse) => {
    livreSchema.find({ userId: requete.session.user.id })
        .exec()
        .then(livres => {
            reponse.render("livres/liste.html.twig", {
                liste: livres, 
                message: reponse.locals.message,
                userName: requete.session.user.nom
            });
        })
        .catch(error => {
            console.log(error);
        });
});

// ========== AJOUTER UN LIVRE ==========

routeur.post("/livres", isAuthenticated, upload.single('image'), (requete, reponse) => {
    const livre = new livreSchema({
        _id: new mongoose.Types.ObjectId(),
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        desc: requete.body.desc,
        image: requete.file ? '/uploads/' + requete.file.filename : null,
        userId: requete.session.user.id
    });
    
    livre.save()
        .then(resultat => {
            console.log(resultat);
            requete.session.message = {
                type: 'success',
                contenu: 'Livre ajouté avec succès'
            };
            reponse.redirect("/livres");
        })
        .catch(error => {
            console.log(error);
            reponse.status(500).json({ error: error });
        });
});

// ========== AFFICHER UN LIVRE ==========

routeur.get("/livres/:id", isAuthenticated, (requete, reponse) => {
    livreSchema.findOne({ 
        _id: requete.params.id,
        userId: requete.session.user.id
    })
    .exec()
    .then(livre => {
        if (!livre) {
            requete.session.message = {
                type: 'danger',
                contenu: 'Livre introuvable ou vous n\'y avez pas accès'
            };
            return reponse.redirect("/livres");
        }
        reponse.render("livres/livre.html.twig", {
            livre: livre, 
            isModification: false
        });
    })
    .catch(error => {
        console.log(error);
    });
});

// ========== AFFICHER LE FORMULAIRE DE MODIFICATION ==========

routeur.get("/livre/modification/:id", isAuthenticated, (requete, reponse) => {
    livreSchema.findOne({ 
        _id: requete.params.id,
        userId: requete.session.user.id
    })
    .exec()
    .then(livre => {
        if (!livre) {
            requete.session.message = {
                type: 'danger',
                contenu: 'Livre introuvable ou vous n\'y avez pas accès'
            };
            return reponse.redirect("/livres");
        }
        reponse.render("livres/livre.html.twig", {
            livre: livre, 
            isModification: true
        });
    })
    .catch(error => {
        console.log(error);
    });
});

// ========== MODIFIER UN LIVRE ==========

routeur.post("/livres/modificationLivre", isAuthenticated, (requete, reponse) => {
    const livreUpdate = {
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        desc: requete.body.desc,
    };

    const filtre = (requete.session.user.role === "admin")
        ? { _id: requete.body.id }
        : { _id: requete.body.id, userId: requete.session.user.id };

    livreSchema.updateOne(filtre, livreUpdate)
        .then(resultat => {
            console.log("Résultat update :", resultat);

            if (resultat.matchedCount === 0) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Livre introuvable ou vous n\'y avez pas accès'
                };
            } else {
                requete.session.message = {
                    type: 'success',
                    contenu: 'Livre modifié avec succès'
                };
            }

            reponse.redirect("/livres");
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la modification'
            };
            reponse.redirect("/livres");
        });
});

// ========== SUPPRIMER UN LIVRE ==========

routeur.post("/livres/delete/:id", isAuthenticated, (requete, reponse) => {
    livreSchema.findOneAndDelete({
        _id: requete.params.id,
        userId: requete.session.user.id
    })
    .exec()
    .then(resultat => {
        if (!resultat) {
            requete.session.message = {
                type: 'danger',
                contenu: 'Livre introuvable ou vous n\'y avez pas accès'
            };
        } else {
            requete.session.message = {
                type: 'success',
                contenu: 'Suppression effectuée'
            };
        }
        reponse.redirect("/livres");
    })
    .catch(error => {
        console.log(error);
    });
});

module.exports = routeur;