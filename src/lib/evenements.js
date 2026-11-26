// Réglages et outils communs aux événements (site public et espace équipe).

// Étiquette du cache des événements : les pages publiques gardent les
// événements en mémoire, et l'espace équipe vide cette mémoire à chaque
// modification.
export const ETIQUETTE_CACHE_EVENEMENTS = "evenements";

// Nom de l'espace de stockage Supabase des photos d'événements.
export const STOCKAGE_EVENEMENTS = "evenements";

// Statuts, tels qu'ils sont affichés.
export const STATUTS_EVENEMENT = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publié",
  ANNULE: "Annulé",
  TERMINE: "Terminé",
};

export const STATUTS_INSCRIPTION = {
  INSCRIT: "Inscrit",
  PRESENT: "Présent",
  ABSENT: "Absent",
  DESISTE: "Désisté",
};

// Adresse publique d'une photo, à partir de son chemin dans le stockage.
export function adressePhoto(chemin) {
  if (!chemin) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${STOCKAGE_EVENEMENTS}/${chemin}`;
}

// 500 → "500 DA" ; vide → "Gratuit".
export function prixLisible(prix) {
  return prix ? `${Number(prix).toLocaleString("fr-FR")} DA` : "Gratuit";
}

// Typographie française : espace insécable avant « : ; ! ? » et à
// l'intérieur des guillemets, pour qu'un signe ne se retrouve jamais seul
// en début de ligne. "Atelier : pitch" → "Atelier : pitch".
export function insecables(texte) {
  if (!texte) return texte;
  return texte
    .replace(/ ([:;!?»])/g, " $1")
    .replace(/« /g, "« ");
}

// Texte saisi « un élément par ligne » → liste sans lignes vides.
export function lignes(texte) {
  return String(texte ?? "")
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter(Boolean);
}
