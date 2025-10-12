var express = require("express");
var serveur = express();
var morgan = require("morgan");
var router = require("./routeur");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");


mongoose.connect("mongodb://localhost/biblio2")
    
      .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));
  
//   {useNewUrlParser:true, useUnifiedTopology:true});





serveur.use(express.static("public"));

serveur.use(morgan("dev"));
serveur.use(bodyParser.urlencoded({extended:false}));

serveur.use("/", router);

serveur.listen(3001); 




