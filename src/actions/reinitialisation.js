"use server";

import { revalidatePath } from "next/cache";
import { creerClientSession } from "@/lib/supabase/session";

// Server Actions de la réinitialisation du mot de passe (page
// /admin/reset-password, ouverte depuis l'email « Reset Password »).
//
// Tout passe par le serveur, comme la connexion : la session ouverte par
// le lien est rangée dans les cookies httpOnly de l'espace équipe.

const LONGUEUR_MINIMALE = 8;
const MESSAGE_LIEN =
  "Ce lien a expiré, a déjà été utilisé, ou date de plus de 15 minutes. Demandez un nouvel email de réinitialisation.";
const MESSAGE_PANNE = "Impossible pour le moment. Réessayez dans un instant.";

// Le lien de l'email peut arriver de deux façons :
//   a. lien personnalisé (modèle d'email modifié dans Supabase) :
//      /admin/reset-password?token_hash=…&type=recovery
//      → verifierLienRecuperation
//   b. lien par défaut de Supabase : Supabase vérifie le lien lui-même,
//      puis renvoie vers le site avec la session après le « # »
//      (#access_token=…&refresh_token=…&type=recovery)
//      → ouvrirSessionRecuperation
// Dans les deux cas, la session est rangée dans les cookies httpOnly.

// 1a. Vérifie le lien reçu par email et ouvre une session de récupération.
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

// 1b. Ouvre la session transmise par le lien par défaut de Supabase.
// Les jetons sont validés par Supabase (setSession), puis la session n'est
// gardée que si elle vient bien d'un lien de réinitialisation récent : on
// ne peut pas s'en servir pour faire passer une session ordinaire pour une
// réinitialisation.
const FORME_JETON_ACCES = /^[\w-]+\.[\w-]+\.[\w-]+$/;
const FORME_JETON_RENOUVELLEMENT = /^[\w-]{6,200}$/;

export async function ouvrirSessionRecuperation(jetonAcces, jetonRenouvellement) {
  if (
    typeof jetonAcces !== "string" ||
    jetonAcces.length > 4096 ||
    !FORME_JETON_ACCES.test(jetonAcces) ||
    typeof jetonRenouvellement !== "string" ||
    !FORME_JETON_RENOUVELLEMENT.test(jetonRenouvellement)
  ) {
    return { ok: false, message: MESSAGE_LIEN };
  }

  try {
    const supabase = await creerClientSession();
    const { error } = await supabase.auth.setSession({
      access_token: jetonAcces,
      refresh_token: jetonRenouvellement,
    });
    if (error) return { ok: false, message: MESSAGE_LIEN };

    const { data } = await supabase.auth.getClaims();
    if (!estSessionDeRecuperation(data?.claims)) {
      // Session valide mais pas de réinitialisation : on ne la garde pas.
      await supabase.auth.signOut({ scope: "local" });
      return { ok: false, message: MESSAGE_LIEN };
    }
  } catch (erreur) {
    // Un jeton illisible fait lever une erreur à Supabase : pour la
    // personne, c'est un lien invalide.
    console.error("Ouverture de la session de réinitialisation en échec :", erreur.message);
    return { ok: false, message: MESSAGE_LIEN };
  }
  return { ok: true };
}

// Durée pendant laquelle on peut choisir son mot de passe après avoir
// ouvert le lien de l'email.
const DUREE_MAX_SECONDES = 15 * 60;

// La session vient-elle d'un lien de réinitialisation ouvert récemment ?
// Supabase l'indique dans le jeton (« amr », méthodes de connexion, la
// plus récente en premier) : « recovery », ou « otp » selon la façon dont
// le lien a été vérifié, avec l'heure de la vérification.
function estSessionDeRecuperation(claims) {
  const derniere = Array.isArray(claims?.amr) ? claims.amr[0] : null;
  if (!derniere || !["recovery", "otp"].includes(derniere.method)) return false;
  const age = Date.now() / 1000 - Number(derniere.timestamp);
  return age >= 0 && age <= DUREE_MAX_SECONDES;
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

    // Seule une session ouverte par un lien de réinitialisation récent
    // peut changer le mot de passe : une session ordinaire (téléphone resté
    // connecté, par exemple) ne le peut pas sans connaître l'ancien.
    const { data } = await supabase.auth.getClaims();
    if (!estSessionDeRecuperation(data?.claims)) return { message: MESSAGE_LIEN, lienPerime: true };

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
