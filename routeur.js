var express = require("express");
var routeur = express.Router();
const twig = require("twig");
const livreSchema = require("./models/livres.modele");
const mongoose = require("mongoose");
const userSchema = require("./models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("./upload");

// ========== MIDDLEWARE D'AUTHENTIFICATION ==========
function isAuthenticated(requete, reponse, suite) {
    if (requete.session.user) {
        // L'utilisateur est connecté, on continue
        suite();
    } else {
        // L'utilisateur n'est pas connecté, on redirige vers login
        requete.session.message = {
            type: 'warning',
            contenu: 'Vous devez être connecté pour accéder à cette page'
        };
        reponse.redirect("/login");
    }
}

// Middleware pour vérifier si l'utilisateur est admin
function isAdmin(requete, reponse, suite) {
    if (requete.session.user && requete.session.user.role === 'admin') {
        // L'utilisateur est admin, on continue
        suite();
    } else {
        // L'utilisateur n'est pas admin
        requete.session.message = {
            type: 'danger',
            contenu: 'Accès refusé : vous devez être administrateur'
        };
        reponse.redirect("/livres");
    }
}

// ========== ROUTES PUBLIQUES ==========
// routeur.get("/", (requete, reponse) => {
//     reponse.render("accueil.html.twig")
// });

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
                        role: user.role,  // ← Ajouter le rôle
                        token: token
                    };

                    // AJOUTE CES LIGNES
console.log("🔍 User connecté:", requete.session.user);
console.log("🔍 Role récupéré:", user.role);
console.log("🔍 User complet depuis DB:", user);

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

// Route pour se déconnecter
routeur.get("/logout", (requete, reponse) => {
    requete.session.destroy();
    reponse.redirect("/");
});

// ========== ROUTES ADMIN ==========

// Dashboard Admin
routeur.get("/admin", isAuthenticated, isAdmin, (requete, reponse) => {
    // Récupérer les statistiques
    Promise.all([
        userSchema.countDocuments(),  // Nombre total d'utilisateurs
        livreSchema.countDocuments(), // Nombre total de livres
        userSchema.find().select('nom email role createdAt'), // Liste des users
        livreSchema.find().populate('userId', 'nom email')    // Tous les livres avec infos user
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

// Supprimer un utilisateur (ADMIN uniquement)
routeur.post("/admin/users/delete/:id", isAuthenticated, isAdmin, (requete, reponse) => {
    const userId = requete.params.id;
    
    // Empêcher l'admin de se supprimer lui-même
    if (userId === requete.session.user.id.toString()) {
        requete.session.message = {
            type: 'danger',
            contenu: 'Vous ne pouvez pas supprimer votre propre compte'
        };
        return reponse.redirect("/admin");
    }
    
    // Supprimer tous les livres de cet utilisateur
    livreSchema.deleteMany({ userId: userId })
        .then(() => {
            // Puis supprimer l'utilisateur
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

// Supprimer n'importe quel livre (ADMIN uniquement)
routeur.post("/admin/livres/delete/:id", isAuthenticated, isAdmin, (requete, reponse) => {
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


// ========== ROUTES POUR AFFICHER LES LIVRE A L'ACCUEIL (LIVRES) ==========

routeur.get("/", async (req, res) => {
    try {
        // On récupère tous les livres
        const livres = await livreSchema.find(); // sans filtre userId
        res.render("accueil.html.twig", { livres: livres, message: req.session.message || null });
        delete req.session.message;
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur");
    }
});


// ========== ROUTES PROTÉGÉES (LIVRES) ==========

// Afficher la liste des livres de l'utilisateur connecté
routeur.get("/livres", isAuthenticated, (requete, reponse) => {
    livreSchema.find({ userId: requete.session.user.id })
        .exec()
        .then(livres => {
            reponse.render("livres/liste.html.twig", {
                liste: livres, 
                message: reponse.locals.message,
                userName: requete.session.user.nom
            })
        })
        .catch(error => {
            console.log(error);
        });
});

// Ajouter un livre (avec image)
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

// Afficher un livre spécifique
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
        reponse.render("livres/livre.html.twig", {livre: livre, isModification: false})
    })
    .catch(error => {
        console.log(error);
    });
});

// Afficher le formulaire de modification
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
        reponse.render("livres/livre.html.twig", {livre: livre, isModification: true})
    })
    .catch(error => {
        console.log(error);
    });
});

// Modifier un livre
routeur.post("/livres/modificationLivre", isAuthenticated, (requete, reponse) => {
    const livreUpdate = {
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        desc: requete.body.desc,
    };
    
    livreSchema.updateOne({
        _id: requete.body.id,
        userId: requete.session.user.id
    }, livreUpdate)
    .exec()
    .then(resultat => {
        if (resultat.matchedCount === 0) {
            requete.session.message = {
                type: 'danger',
                contenu: 'Livre introuvable ou vous n\'y avez pas accès'
            };
        } else {
            requete.session.message = {
                type: 'success',
                contenu: 'Modification effectuée'
            };
        }
        reponse.redirect("/livres");
    })
    .catch(error => {
        console.log(error);
    });
});

// Supprimer un livre
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

// ========== GESTION DES ERREURS ==========
routeur.use((requete, reponse, suite) => {
    const error = new Error("page pas trouvée");
    error.status = 404;
    suite(error);
});

routeur.use((error, requete, reponse, suite) => {
    reponse.status(error.status || 500);
    reponse.end(error.message);
});

module.exports = routeur;