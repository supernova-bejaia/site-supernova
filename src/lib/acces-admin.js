import { redirect } from "next/navigation";
import { creerClientSession } from "@/lib/supabase/session";

export const PAGE_CONNEXION = "/admin/connexion";

// Contrôle d'accès de l'espace /admin, exécuté sur le serveur au début de
// chaque page protégée, AVANT toute lecture de données.
//
//   1. Une session valide existe-t-elle ? (jeton vérifié, pas seulement lu)
//   2. Le compte figure-t-il dans la liste d'accès (fonction est_admin) ?
//
// Sinon, la personne est renvoyée vers la page de connexion. Même si ce
// contrôle était contourné, la base refuserait de livrer les données.
//
// Renvoie le client Supabase de la session et l'email du compte.
export async function verifierAccesAdmin() {
  const supabase = await creerClientSession();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims) {
    redirect(PAGE_CONNEXION);
  }

  const autorise = await estAutorise(supabase);
  if (!autorise) {
    redirect(`${PAGE_CONNEXION}?acces=refuse`);
  }

  return { supabase, email: claims.email ?? "" };
}

// Le compte connecté figure-t-il dans la liste d'accès ?
export async function estAutorise(supabase) {
  const { data, error } = await supabase.rpc("est_admin");
  if (error) {
    console.error("Vérification de l'accès admin impossible :", error.message);
    return false;
  }
  return data === true;
}
