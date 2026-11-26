// Niveaux de droits de l'espace équipe et ce qu'ils permettent.
//
// Le niveau vient de la base (fonction mon_niveau()). La base vérifie
// elle-même chaque opération : ces règles servent seulement à n'afficher
// que les boutons utiles et à donner un message clair avant d'essayer.
// Elles doivent rester identiques aux règles de la migration
// « droits_par_niveau ».

export const NIVEAUX = {
  MEMBRE: 1,
  HEAD_OF: 2,
  DIRECTION: 3,
  PROPRIETAIRE: 4,
};

export const LIBELLES_NIVEAU = {
  1: "Membre du Noyau",
  2: "Head of",
  3: "Direction",
  4: "Compte propriétaire",
};

// Ce que le compte connecté peut faire d'un article.
//   article   : l'article (statut, published_at), ou null pour un nouveau
//   niveau    : niveau du compte connecté
//   estAuteur : vrai si le compte connecté a créé cet article
export function droitsArticle(article, niveau, estAuteur) {
  const headOf = niveau >= NIVEAUX.HEAD_OF;

  if (!article) {
    return { modifier: niveau >= NIVEAUX.MEMBRE, publier: headOf, archiver: false, supprimer: false };
  }

  const brouillon = article.statut === "BROUILLON";
  return {
    // Un membre modifie ses brouillons ; un Head of, tout.
    modifier: headOf || (estAuteur && brouillon),
    publier: headOf,
    archiver: headOf,
    // La direction supprime tout ; un membre, ses brouillons jamais publiés.
    supprimer:
      niveau >= NIVEAUX.DIRECTION || (estAuteur && brouillon && !article.published_at),
  };
}

export const LIBELLES_STATUT_ARTICLE = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publié",
  ARCHIVE: "Archivé",
};
