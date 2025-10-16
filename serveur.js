var express = require("express");
var serveur = express();
var morgan = require("morgan");
var router = require("./routeur");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
serveur.use(session({
  secret:'keyboarc cat',
  resave:true,
  saveUninitialized: true,
  cookie: { maxAge :60000 }
}))


mongoose.connect("mongodb://localhost/biblio2")
    
      .then(() => console.log('Connecté à Mongo DB'))
  .catch(err => console.error('Erreur de co MongoDB:', err));
  
//   {useNewUrlParser:true, useUnifiedTopology:true});





serveur.use(express.static("public"));

serveur.use(morgan("dev"));
serveur.use(bodyParser.urlencoded({extended:false}));
serveur.set('trust proxy', 1);

serveur.use((requete, response, suite) => {
  response.locals.message = requete.session.message;
  delete requete.session.message;

    // Passer les infos de l'utilisateur connecté à toutes les vues
  response.locals.user = requete.session.user || null;
  
  suite();
})

serveur.use("/", router);

serveur.listen(3001); 




