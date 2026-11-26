import { redirect } from "next/navigation";
import { creerClientSession } from "@/lib/supabase/session";
import { NIVEAUX } from "@/lib/droits";

export const PAGE_CONNEXION = "/admin/connexion";

// Contrôle d'accès de l'espace /admin, exécuté sur le serveur au début de
// chaque page protégée, AVANT toute lecture de données.
//
//   1. Une session valide existe-t-elle ? (jeton vérifié, pas seulement lu)
//   2. Quel est le niveau du compte (fonction mon_niveau) ? Il faut au
//      moins le niveau « membre du Noyau ».
//
// Sinon, la personne est renvoyée vers la page de connexion. Même si ce
// contrôle était contourné, la base refuserait de livrer les données.
//
// Renvoie le client Supabase de la session, l'email du compte et son niveau.
export async function verifierAccesAdmin() {
  const supabase = await creerClientSession();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) {
    redirect(PAGE_CONNEXION);
  }

  const niveau = await lireNiveau(supabase);
  if (niveau < NIVEAUX.MEMBRE) {
    redirect(`${PAGE_CONNEXION}?acces=refuse`);
  }

  return { supabase, email: claims.email ?? "", niveau };
}

// Même contrôle, mais sans redirection : renvoie { supabase, niveau } si
// l'accès est autorisé, sinon null. Sert aux actions d'un formulaire en
// cours de saisie, qui préfèrent afficher un message plutôt que de
// quitter la page (et perdre le texte).
export async function obtenirAccesAdmin() {
  const supabase = await creerClientSession();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const niveau = await lireNiveau(supabase);
  return niveau >= NIVEAUX.MEMBRE ? { supabase, niveau } : null;
}

// Le compte connecté a-t-il accès à l'espace équipe ?
export async function estAutorise(supabase) {
  return (await lireNiveau(supabase)) >= NIVEAUX.MEMBRE;
}

// Niveau du compte connecté (0 en cas d'erreur : l'accès est refusé).
async function lireNiveau(supabase) {
  const { data, error } = await supabase.rpc("mon_niveau");
  if (error) {
    console.error("Lecture du niveau d'accès impossible :", error.message);
    return 0;
  }
  return Number(data) || 0;
}
