var express = require("express");
var routeur = express.Router();
const twig = require("twig");
const livreSchema=require("./models/livres.modele");

const mongoose = require("mongoose");

const userSchema = require("./models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

routeur.get("/", (requete, reponse) => {
    reponse.render("accueil.html.twig")
});  


// Route pour afficher le formulaire d'inscription
routeur.get("/register", (requete, reponse) => {
    reponse.render("register.html.twig");
});

// Route pour traiter l'inscription
routeur.post("/register", (requete, reponse) => {
    // 1. Vérifier si l'email existe déjà
    userSchema.findOne({ email: requete.body.email })
        .then(utilisateurExistant => {
            if (utilisateurExistant) {
                // L'email existe déjà
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Cet email est déjà utilisé'
                };
                return reponse.redirect("/register");
            }

            // 2. Hasher le mot de passe
            bcrypt.hash(requete.body.password, 10, (err, hash) => {
                if (err) {
                    console.log(err);
                    return reponse.status(500).json({ error: err });
                }

                // 3. Créer le nouvel utilisateur
                const user = new userSchema({
                    _id: new mongoose.Types.ObjectId(),
                    nom: requete.body.nom,
                    email: requete.body.email,
                    password: hash // On stocke le mot de passe hashé
                });

                // 4. Sauvegarder dans la base de données
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
    // 1. Chercher l'utilisateur par email
    userSchema.findOne({ email: requete.body.email })
        .then(user => {
            if (!user) {
                // Aucun utilisateur trouvé avec cet email
                requete.session.message = {
                    type: 'danger',
                    contenu: 'Email ou mot de passe incorrect'
                };
                return reponse.redirect("/login");
            }

            // 2. Comparer le mot de passe entré avec le hash en BDD
            bcrypt.compare(requete.body.password, user.password, (err, result) => {
                if (err) {
                    requete.session.message = {
                        type: 'danger',
                        contenu: 'Erreur lors de la connexion'
                    };
                    return reponse.redirect("/login");
                }

                if (result) {
                    // 3. Le mot de passe est correct ! Créer un token JWT
                    const token = jwt.sign(
                        {
                            userId: user._id,
                            email: user.email,
                            nom: user.nom
                        },
                        "CLÉ_SECRÈTE_SUPER_SÉCURISÉE", // On changera ça plus tard
                        {
                            expiresIn: "24h" // Le token expire après 24h
                        }
                    );

                    // 4. Stocker les infos de l'utilisateur dans la session
                    requete.session.user = {
                        id: user._id,
                        nom: user.nom,
                        email: user.email,
                        token: token
                    };

                    requete.session.message = {
                        type: 'success',
                        contenu: 'Connexion réussie ! Bienvenue ' + user.nom
                    };
                    
                    reponse.redirect("/livres");
                } else {
                    // Mot de passe incorrect
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

routeur.get("/livres", (requete, reponse)=>{

    livreSchema.find()
    .exec()
    .then(livres => {
         reponse.render("livres/liste.html.twig", {liste: livres, message:reponse.locals.message})
    })
    .catch();
   
});

routeur.post("/livres", (requete, reponse)=>{
    const livre = new livreSchema({
        _id: new mongoose.Types.ObjectId(),
        nom: requete.body.titre,
        auteur: requete.body.auteur,
        pages: requete.body.pages,
        desc: requete.body.desc,
    });
    livre.save()
    .then(resultat =>{
        console.log(resultat);
        reponse.redirect("/livres");
    })
    .catch(error => {
        console.log(error);
    })
});

//afficher desc livre 
routeur.get("/livres/:id", (requete,reponse) => {
    livreSchema.findById(requete.params.id)
    .exec()
    .then(livre => {
        reponse.render("livres/livre.html.twig",{livre : livre, isModification:false})
    })
    .catch(error => {
        console.log(error);
    });
})

//edit livre 
routeur.get("/livre/modification/:id", (requete,reponse)=> {
  livreSchema.findById(requete.params.id)
    .exec()
    .then(livre => {
        reponse.render("livres/livre.html.twig",{livre : livre, isModification:true})
    })
    .catch(error => {
        console.log(error);
    });
})

routeur.post("/livres/modificationLivre", (requete,reponse) => {
    const livreUpdate = {
        nom : requete.body.titre,
        auteur : requete.body.auteur,
        pages : requete.body.pages,
        desc : requete.body.desc,
    }
    livreSchema.updateOne({_id:requete.body.id}, livreUpdate)
    .exec()
    .then(resultat => {        
        requete.session.message = {
            type : 'success',
            contenu : 'modifciation effectuée'
        }
        reponse.redirect("/livres");
    })
    .catch(error => {
        console.log(error);
    });
});

routeur.post("/livres/delete/:id", (requete,reponse) => {
    livreSchema.findByIdAndDelete({_id:requete.params.id})
    .exec()
    .then(resultat => {
        requete.session.message = {
            type : 'success',
            contenu : 'Suppression effectuée'
        }
        reponse.redirect("/livres")
    })
    .catch(error => {
        console.log(error);
    });
});

routeur.use((requete, reponse,suite)=>{
    const error = new Error("page pas trouvée");
    error.status= 404;
    suite(error);
});

routeur.use((error,requete,reponse)=>{
    reponse.status(error.status || 500);
    reponse.end(error.message);
});

module.exports = routeur;


