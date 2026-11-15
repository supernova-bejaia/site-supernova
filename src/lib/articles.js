// Réglages et outils communs aux articles (site public et espace équipe).

// Étiquette du cache des articles : les pages publiques gardent les
// articles en mémoire, et l'espace équipe vide cette mémoire à chaque
// publication ou modification.
export const ETIQUETTE_CACHE_ARTICLES = "articles";

// Nom de l'espace de stockage Supabase des images de couverture.
export const STOCKAGE_ARTICLES = "articles";

// Forme d'un slug valide : minuscules, chiffres, tirets (comme dans la base).
const FORME_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function estSlugValide(slug) {
  return typeof slug === "string" && slug.length <= 120 && FORME_SLUG.test(slug);
}

// Temps de lecture estimé d'un texte, en minutes (au moins 1), sur la
// base d'environ 200 mots par minute.
export function tempsDeLecture(texte) {
  const mots = String(texte ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(mots / 200));
}

// Adresse publique d'une image de couverture, à partir de son chemin dans
// le stockage (colonne image_couverture). Renvoie null s'il n'y en a pas.
export function adresseCouverture(chemin) {
  if (!chemin) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${STOCKAGE_ARTICLES}/${chemin}`;
}
