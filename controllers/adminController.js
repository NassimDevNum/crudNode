var express = require("express");
var routeur = express.Router();
const livreSchema = require("../models/livres.modele");
const userSchema = require("../models/user.model");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");

// ========== DASHBOARD ADMIN ==========

routeur.get("/", isAuthenticated, isAdmin, (requete, reponse) => {
    Promise.all([
        userSchema.countDocuments(),
        livreSchema.countDocuments(),
        userSchema.find().select('nom email role createdAt'),
        livreSchema.find().populate('userId', 'nom email')
    ])
    .then(([nbUsers, nbLivres, users, livres]) => {
        reponse.render("admin/dashboard.html.twig", {
            nbUsers: nbUsers,
            nbLivres: nbLivres,
            users: users,
            livres: livres,
            message: reponse.locals.message
        });
    })
    .catch(error => {
        console.log(error);
        reponse.status(500).send("Erreur serveur");
    });
});

// ========== GESTION DES UTILISATEURS ==========

// Supprimer un utilisateur
routeur.post("/users/delete/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    const userId = requete.params.id;
    
    if (userId === requete.session.user.id.toString()) {
        requete.session.message = {
            type: 'danger',
            contenu: 'Vous ne pouvez pas supprimer votre propre compte'
        };
        return reponse.redirect("/admin");
    }
    
    livreSchema.deleteMany({ userId: userId })
        .then(() => {
            return userSchema.findByIdAndDelete(userId);
        })
        .then(() => {
            requete.session.message = {
                type: 'success',
                contenu: 'Utilisateur et ses livres supprimés'
            };
            reponse.redirect("/admin");
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la suppression'
            };
            reponse.redirect("/admin");
        });
});

// Afficher le formulaire de modification d'un utilisateur
routeur.get("/user/edit/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    userSchema.findById(requete.params.id)
        .exec()
        .then(user => {
            if (!user) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'User introuvable'
                };
                return reponse.redirect("/admin");
            }
            reponse.render("admin/editUser.html.twig", {
                user: user
            });
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la récupération de l utilisateur'
            };
            reponse.redirect("/admin");
        });
});

// Traiter la modification d'un utilisateur
routeur.post("/user/edit/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    const userUpdate = {
        nom: requete.body.nom,
        email: requete.body.email,
    };

    userSchema.updateOne({ _id: requete.params.id }, userUpdate)
        .exec()
        .then(resultat => {
            if (resultat.matchedCount === 0) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Utilisateur introuvable'
                };
            } else {
                requete.session.message = {
                    type: 'success',
                    contenu: 'Utilisateur modifié par l\'admin avec succès !'
                };
            }
            reponse.redirect("/admin");
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la modification'
            };
            reponse.redirect("/admin");
        });
});

// ========== GESTION DES LIVRES ==========

// Afficher le formulaire de modification d'un livre
routeur.get("/livres/edit/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    livreSchema.findById(requete.params.id)
        .populate('userId', 'nom email')
        .exec()
        .then(livre => {
            if (!livre) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Livre introuvable'
                };
                return reponse.redirect("/admin");
            }
            reponse.render("admin/editLivre.html.twig", {
                livre: livre
            });
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la récupération du livre'
            };
            reponse.redirect("/admin");
        });
});

// Traiter la modification d'un livre
routeur.post("/livres/edit/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    const livreUpdate = {
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        desc: requete.body.desc,
    };

    livreSchema.updateOne({ _id: requete.params.id }, livreUpdate)
        .exec()
        .then(resultat => {
            if (resultat.matchedCount === 0) {
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Livre introuvable'
                };
            } else {
                requete.session.message = {
                    type: 'success',
                    contenu: 'Livre modifié par l\'admin avec succès !'
                };
            }
            reponse.redirect("/admin");
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la modification'
            };
            reponse.redirect("/admin");
        });
});

// Supprimer un livre
routeur.post("/livres/delete/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    livreSchema.findByIdAndDelete(requete.params.id)
        .then(() => {
            requete.session.message = {
                type: 'success',
                contenu: 'Livre supprimé par l\'admin'
            };
            reponse.redirect("/admin");
        })
        .catch(error => {
            console.log(error);
            requete.session.message = {
                type: 'danger',
                contenu: 'Erreur lors de la suppression'
            };
            reponse.redirect("/admin");
        });
});

module.exports = routeur;