import { cacheLife, cacheTag } from "next/cache";
import { creerClientSupabase } from "@/lib/supabase/server";
import { ETIQUETTE_CACHE_ARTICLES, estSlugValide } from "@/lib/articles";

// Service « articles » du site public : lecture des articles publiés.
//
// Ces lectures se font sans session, avec les droits d'un visiteur : la
// base ne renvoie que les articles au statut PUBLIE (règle RLS). Un
// brouillon ne peut donc jamais sortir d'ici.
//
// « use cache » garde les résultats en mémoire. L'espace équipe vide cette
// mémoire (étiquette « articles ») dès qu'un article est publié, modifié
// ou retiré : le site public est alors à jour immédiatement.
//
// En cas d'échec, les fonctions de lecture lèvent une erreur : une erreur
// n'est jamais mise en mémoire, la lecture sera donc retentée.

async function lireArticlesPublies() {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETTE_CACHE_ARTICLES);

  const supabase = creerClientSupabase();
  const { data, error } = await supabase
    .from("article")
    .select("id_article, titre, slug, resume, image_couverture, published_at")
    .eq("statut", "PUBLIE")
    .order("published_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

async function lireArticlePublie(slug) {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETTE_CACHE_ARTICLES);

  const supabase = creerClientSupabase();
  const { data, error } = await supabase
    .from("article")
    .select("id_article, titre, slug, resume, contenu, image_couverture, published_at, updated_at")
    .eq("statut", "PUBLIE")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data; // null si aucun article publié ne porte ce slug
}

// Liste des articles publiés, du plus récent au plus ancien.
// Si la base est injoignable, renvoie une liste vide : la page reste
// affichable.
export async function getArticlesPublies() {
  try {
    return await lireArticlesPublies();
  } catch (erreur) {
    console.error("Lecture des articles impossible :", erreur.message);
    return [];
  }
}

// Un article publié, d'après son slug. Renvoie null s'il n'existe pas
// (ou s'il n'est pas publié). Un slug mal formé n'interroge pas la base.
export async function getArticlePublie(slug) {
  if (!estSlugValide(slug)) return null;
  return lireArticlePublie(slug);
}
