var express = require("express");
var routeur = express.Router();
const twig = require("twig");
const livreSchema=require("./models/livres.modele");

const mongoose = require("mongoose");



routeur.get("/", (requete, reponse) => {
    reponse.render("accueil.html.twig")
});  



routeur.get("/livres", (requete, reponse)=>{

    livreSchema.find()
    .exec()
    .then(livres => {
         reponse.render("livres/liste.html.twig", {liste: livres})
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

routeur.get("/livres/:id", (requete,reponse) => {
    livreSchema.findById(requete.params.id)
    .exec()
    .then(livre => {
        reponse.render("livres/livre.html.twig",{livre : livre})
    })
    .catch(error => {
        console.log(error);
    });
})

routeur.post("/livres/delete/:id", (requete,reponse) => {
    livreSchema.findByIdAndDelete({_id:requete.params.id})
    .exec()
    .then(resultat => {
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


