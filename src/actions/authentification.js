"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientSession } from "@/lib/supabase/session";
import { estAutorise, PAGE_CONNEXION } from "@/lib/acces-admin";

// Server Actions de connexion à l'espace équipe /admin.
// Elles s'exécutent sur le serveur, jamais dans le navigateur.

const FORMAT_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Message volontairement identique pour un email inconnu ou un mauvais mot
// de passe : on ne révèle pas quels comptes existent.
const MESSAGE_IDENTIFIANTS = "Email ou mot de passe incorrect.";
const MESSAGE_REFUS = "Ce compte n'a pas accès à l'espace équipe.";
const MESSAGE_PANNE = "Connexion impossible pour le moment. Réessayez dans un instant.";

// Les pages de l'espace équipe dépendent de la session. À chaque connexion
// ou déconnexion, on fait oublier au navigateur les versions qu'il a pu
// garder en mémoire (par exemple « /admin renvoie vers la connexion »).
function oublierPagesEquipe() {
  revalidatePath("/admin", "layout");
}

// Connexion par email et mot de passe.
// État renvoyé au formulaire : { ok: true } en cas de succès (le formulaire
// charge alors le tableau de bord), sinon { message }.
export async function seConnecter(etatPrecedent, formData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!FORMAT_EMAIL.test(email) || !motDePasse) {
    return { message: "Indiquez votre email et votre mot de passe." };
  }

  let supabase;
  try {
    supabase = await creerClientSession();
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    if (error) {
      return { message: MESSAGE_IDENTIFIANTS };
    }
  } catch (erreur) {
    console.error("Connexion admin en échec :", erreur.message);
    return { message: MESSAGE_PANNE };
  }

  // Un compte valide mais absent de la liste d'accès est aussitôt déconnecté.
  if (!(await estAutorise(supabase))) {
    await supabase.auth.signOut();
    return { message: MESSAGE_REFUS };
  }

  // Pas de redirection ici : le formulaire recharge entièrement la page
  // vers /admin, pour repartir d'un navigateur sans rien en mémoire.
  oublierPagesEquipe();
  return { ok: true, message: "" };
}

// Déconnexion, puis retour à la page de connexion.
export async function seDeconnecter() {
  const supabase = await creerClientSession();
  await supabase.auth.signOut();
  oublierPagesEquipe();
  redirect(PAGE_CONNEXION);
}
