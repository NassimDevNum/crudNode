// Middleware d'authentification

function isAuthenticated(requete, reponse, suite) {
    if (requete.session.user) {
        suite();
    } else {
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
        suite();
    } else {
        requete.session.message = {
            type: 'danger',
            contenu: 'Accès refusé : vous devez être administrateur'
        };
        reponse.redirect("/livres");
    }
}

module.exports = { isAuthenticated, isAdmin };