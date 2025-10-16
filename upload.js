const multer = require("multer");
const path = require("path");

// Configuration du stockage
const storage = multer.diskStorage({
    // Où stocker les fichiers
    destination: function(req, file, cb) {
        cb(null, './public/uploads/'); // Dossier de destination
    },
    // Comment nommer les fichiers
    filename: function(req, file, cb) {
        // Nom unique : timestamp + nom original
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtrer les fichiers (accepter uniquement les images)
const fileFilter = (req, file, cb) => {
    // Accepter uniquement jpg, jpeg, png
    if (file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/png') {
        cb(null, true); // Accepter le fichier
    } else {
        cb(null, false); // Rejeter le fichier
    }
};

// Exporter la configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limite à 5MB
    },
    fileFilter: fileFilter
});

module.exports = upload;
