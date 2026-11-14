import { cacheLife } from "next/cache";
import { creerClientSupabase } from "@/lib/supabase/server";

// Service « centres d'intérêt » : lecture de la liste proposée dans le formulaire.

// Lecture dans la base, gardée en mémoire environ une heure.
//
// « use cache » évite d'interroger la base à chaque visite. Un centre
// d'intérêt ajouté dans Supabase apparaît donc sur le site dans l'heure.
//
// En cas d'échec, la fonction lève une erreur : une erreur n'est jamais mise
// en mémoire, donc la lecture sera retentée à la visite suivante.
async function lireCentresInteret() {
  "use cache";
  cacheLife("hours");

  const supabase = creerClientSupabase();
  const { data, error } = await supabase
    .from("centre_interet")
    .select("id_centre_interet, nom")
    .order("nom");

  if (error) throw new Error(error.message);
  return data;
}

// Liste des centres d'intérêt pour le formulaire.
// Si la base est injoignable, renvoie une liste vide : le formulaire reste
// utilisable, simplement sans cette rubrique.
export async function getCentresInteret() {
  try {
    return await lireCentresInteret();
  } catch (erreur) {
    console.error("Lecture des centres d'intérêt impossible :", erreur.message);
    return [];
  }
}
