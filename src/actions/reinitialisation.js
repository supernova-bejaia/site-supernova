"use server";

import { revalidatePath } from "next/cache";
import { creerClientSession } from "@/lib/supabase/session";

// Server Actions de la réinitialisation du mot de passe (page
// /admin/reset-password, ouverte depuis l'email « Reset Password »).
//
// Tout passe par le serveur, comme la connexion : la session ouverte par
// le lien est rangée dans les cookies httpOnly de l'espace équipe.

const LONGUEUR_MINIMALE = 8;
const MESSAGE_LIEN = "Ce lien a expiré ou a déjà été utilisé. Demandez un nouvel email de réinitialisation.";
const MESSAGE_PANNE = "Impossible pour le moment. Réessayez dans un instant.";

// 1. Vérifie le lien reçu par email et ouvre une session de récupération.
// Appelée par la page au chargement (et non pendant le rendu serveur) :
// un logiciel qui « pré-ouvre » les liens des emails sans exécuter de
// JavaScript ne consomme donc pas le lien à la place de la personne.
export async function verifierLienRecuperation(tokenHash) {
  if (typeof tokenHash !== "string" || !/^[\w-]{10,200}$/.test(tokenHash)) {
    return { ok: false, message: MESSAGE_LIEN };
  }

  try {
    const supabase = await creerClientSession();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (error) return { ok: false, message: MESSAGE_LIEN };
  } catch (erreur) {
    console.error("Vérification du lien de réinitialisation en échec :", erreur.message);
    return { ok: false, message: MESSAGE_PANNE };
  }
  return { ok: true };
}

// 2. Enregistre le nouveau mot de passe, puis ferme toutes les sessions :
// on se reconnecte ensuite normalement avec le nouveau mot de passe.
// État renvoyé au formulaire : { ok: true } ou { message }.
export async function changerMotDePasse(etatPrecedent, formData) {
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (motDePasse.length < LONGUEUR_MINIMALE) {
    return { message: `Le mot de passe doit contenir au moins ${LONGUEUR_MINIMALE} caractères.` };
  }
  if (motDePasse !== confirmation) {
    return { message: "Les deux mots de passe ne correspondent pas." };
  }

  try {
    const supabase = await creerClientSession();

    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) return { message: MESSAGE_LIEN, lienPerime: true };

    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    if (error) {
      if (error.code === "same_password") {
        return { message: "Choisissez un mot de passe différent de l'ancien." };
      }
      if (error.code === "weak_password") {
        return { message: "Ce mot de passe est trop faible : allongez-le ou variez les caractères." };
      }
      console.error("Changement de mot de passe en échec :", error.message);
      return { message: MESSAGE_PANNE };
    }

    await supabase.auth.signOut();
  } catch (erreur) {
    console.error("Changement de mot de passe en échec :", erreur.message);
    return { message: MESSAGE_PANNE };
  }

  revalidatePath("/admin", "layout");
  return { ok: true, message: "" };
}
