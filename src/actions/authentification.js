"use server";

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

// Connexion par email et mot de passe.
// État renvoyé au formulaire : { message } en cas d'échec ; en cas de
// succès, redirection vers le tableau de bord.
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

  redirect("/admin");
}

// Déconnexion, puis retour à la page de connexion.
export async function seDeconnecter() {
  const supabase = await creerClientSession();
  await supabase.auth.signOut();
  redirect(PAGE_CONNEXION);
}
