import { STOCKAGE_ARTICLES } from "@/lib/articles";
import { FORMATS_IMAGE } from "@/lib/validation-article";

// Service « articles » de l'espace équipe : lecture de tous les articles
// (brouillons compris), écriture, et images de couverture.
//
// Toutes les fonctions reçoivent le client Supabase de la session du
// membre connecté (lib/supabase/session.js). C'est la base qui autorise
// ou refuse chaque opération (règles RLS, fonction est_admin) : la clé
// secrète de Supabase n'est jamais utilisée.

const COLONNES =
  "id_article, titre, slug, resume, contenu, image_couverture, statut, published_at, created_at, updated_at";

// Code d'erreur de Postgres quand une valeur unique existe déjà.
const VALEUR_DEJA_PRISE = "23505";

// Tous les articles, du plus récemment modifié au plus ancien.
export async function listerArticles(supabase) {
  const { data, error } = await supabase
    .from("article")
    .select("id_article, titre, slug, statut, published_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Un article d'après son identifiant, ou null s'il n'existe pas.
export async function lireArticle(supabase, idArticle) {
  const { data, error } = await supabase
    .from("article")
    .select(COLONNES)
    .eq("id_article", idArticle)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Crée un article, ou le modifie si « idArticle » est fourni.
// Renvoie { article } en cas de succès, ou { slugDejaPris: true } si un
// autre article utilise déjà cette adresse.
export async function enregistrerArticle(supabase, idArticle, valeurs) {
  const requete = idArticle
    ? supabase.from("article").update(valeurs).eq("id_article", idArticle)
    : supabase.from("article").insert(valeurs);

  const { data, error } = await requete.select(COLONNES).maybeSingle();

  if (error?.code === VALEUR_DEJA_PRISE) return { slugDejaPris: true };
  if (error) throw new Error(error.message);
  // Aucune ligne renvoyée : la base a refusé l'écriture (accès retiré)
  // ou l'article a été supprimé entre-temps.
  if (!data) throw new Error("Article introuvable ou écriture refusée.");

  return { article: data };
}

// Supprime un article. Renvoie le chemin de son image de couverture (ou
// null), pour que l'appelant puisse la supprimer à son tour.
export async function supprimerArticle(supabase, idArticle) {
  const { data, error } = await supabase
    .from("article")
    .delete()
    .eq("id_article", idArticle)
    .select("image_couverture")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.image_couverture ?? null;
}

// Envoie une image de couverture (déjà validée) dans le stockage.
// Le fichier reçoit un nom aléatoire : son adresse ne peut pas être
// devinée, et deux images ne peuvent pas s'écraser. Renvoie son chemin.
export async function envoyerCouverture(supabase, fichier) {
  const chemin = `${crypto.randomUUID()}.${FORMATS_IMAGE[fichier.type]}`;

  const { error } = await supabase.storage.from(STOCKAGE_ARTICLES).upload(chemin, fichier, {
    contentType: fichier.type,
    // Le nom étant unique, les navigateurs peuvent garder l'image un an.
    cacheControl: "31536000",
  });

  if (error) throw new Error(error.message);
  return chemin;
}

// Supprime une image de couverture devenue inutile. Un échec n'est pas
// bloquant : il laisse seulement un fichier orphelin dans le stockage.
export async function supprimerCouverture(supabase, chemin) {
  if (!chemin) return;
  const { error } = await supabase.storage.from(STOCKAGE_ARTICLES).remove([chemin]);
  if (error) console.error("Suppression d'une image de couverture impossible :", error.message);
}
