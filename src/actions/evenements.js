"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirAccesAdmin, verifierAccesAdmin } from "@/lib/acces-admin";
import { ETIQUETTE_CACHE_EVENEMENTS, STATUTS_EVENEMENT, STATUTS_INSCRIPTION } from "@/lib/evenements";
import { droitsEvenement } from "@/lib/droits";
import { FORMAT_UUID } from "@/lib/validation";
import { validerImage } from "@/lib/validation-article";
import {
  validerDetailsPhoto,
  validerEvenement,
  validerParticipant,
  validerPartenaire,
  validerSuivi,
} from "@/lib/validation-evenement";
import {
  ajouterParticipant as ajouterDansLaBase,
  ajouterPartenaire as ajouterPartenaireDansLaBase,
  ajouterPhoto as ajouterPhotoDansLaBase,
  changerStatutInscription as changerStatutDansLaBase,
  changerValidationPhoto,
  definirCouverture,
  enregistrerEvenement as enregistrerDansLaBase,
  enregistrerSuivi as enregistrerSuiviDansLaBase,
  lireEvenement,
  lireSaisonActive,
  listerMesEvenements,
  retirerPartenaire as retirerPartenaireDansLaBase,
  supprimerEvenement as supprimerEvenementDansLaBase,
  supprimerPhoto,
} from "@/services/evenements-admin";

// Server Actions des événements (espace équipe).
// Chacune revérifie l'accès avant d'agir : une action peut être appelée
// directement, sans passer par la page. La base revérifie à son tour.

const MESSAGE_SESSION = "Votre session a expiré. Reconnectez-vous, puis réessayez.";
const MESSAGE_PANNE = "L'enregistrement a échoué. Réessayez dans un instant : votre saisie est conservée.";

const echec = (message, erreurs = {}) => ({ ok: false, message, erreurs });

// Après une écriture : le site public relira les événements, et le
// navigateur oublie les pages de l'espace équipe qu'il a en mémoire.
function rafraichirApresEcriture() {
  updateTag(ETIQUETTE_CACHE_EVENEMENTS);
  revalidatePath("/admin", "layout");
}

const idValide = (formData, nom) => {
  const id = String(formData.get(nom) ?? "");
  return FORMAT_UUID.test(id) ? id : null;
};

// L'événement et ce que le compte connecté peut en faire (lib/droits.js).
// La base vérifie de toute façon chaque opération ; ces règles servent à
// refuser tôt, avec un message clair. evenement vaut null s'il n'existe pas.
async function lireAvecDroits(supabase, niveau, idEvenement) {
  const [evenement, mesEvenements] = await Promise.all([
    lireEvenement(supabase, idEvenement),
    listerMesEvenements(supabase),
  ]);
  const estAuteur = Boolean(evenement) && mesEvenements.has(evenement.id_evenement);
  return { evenement, droits: droitsEvenement(evenement, niveau, estAuteur) };
}

const MESSAGE_LECTURE_SEULE =
  "Cet événement n'est plus un brouillon : seuls les Head of et la direction peuvent le modifier.";

// Crée ou modifie un événement (formulaire principal).
// Un nouvel événement est un brouillon ; sa publication se fait ensuite
// depuis sa page (changerStatutEvenement).
//
// État renvoyé : { ok: true, id } ou { ok: false, message, erreurs }.
export async function enregistrerEvenement(etatPrecedent, formData) {
  try {
    const acces = await obtenirAccesAdmin();
    if (!acces) return echec(MESSAGE_SESSION);
    const { supabase, niveau } = acces;

    const idSaisi = String(formData.get("id") ?? "");
    if (idSaisi) {
      if (!FORMAT_UUID.test(idSaisi)) return echec("Cet événement n'existe plus.");
      const { evenement, droits } = await lireAvecDroits(supabase, niveau, idSaisi);
      if (!evenement) return echec("Cet événement n'existe plus.");
      if (!droits.modifier) return echec(MESSAGE_LECTURE_SEULE);
    }

    const { valeurs, erreurs } = validerEvenement(formData);
    if (Object.keys(erreurs).length > 0) return echec("Certains champs sont à corriger.", erreurs);

    // Un nouvel événement est rattaché à la saison en cours.
    if (!idSaisi) valeurs.id_saison = await lireSaisonActive(supabase);

    const resultat = await enregistrerDansLaBase(supabase, idSaisi || null, valeurs);
    if (resultat.slugDejaPris) {
      return echec("Certains champs sont à corriger.", {
        slug: "Un autre événement utilise déjà cette adresse. Choisissez-en une autre.",
      });
    }

    rafraichirApresEcriture();
    return { ok: true, id: resultat.evenement.id_evenement };
  } catch (erreur) {
    console.error("Enregistrement d'un événement en échec :", erreur.message);
    return echec(MESSAGE_PANNE);
  }
}

// Publier, repasser en brouillon, annuler, marquer comme terminé.
// La date de publication est fixée à la première mise en ligne, puis
// conservée : un événement annulé ou terminé reste ainsi visible du public.
export async function changerStatutEvenement(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  const statut = String(formData.get("statut") ?? "");
  if (!id || !STATUTS_EVENEMENT[statut]) redirect("/admin/evenements");

  // Publier, annuler, terminer : Head of et direction seulement.
  if (!droitsEvenement(null, niveau, false).changerStatut) {
    redirect(`/admin/evenements/${id}?etat=refuse`);
  }

  let etat = `statut-${statut.toLowerCase()}`;
  try {
    const existant = await lireEvenement(supabase, id);
    if (!existant) throw new Error("Événement introuvable.");
    await enregistrerDansLaBase(supabase, id, {
      statut,
      published_at:
        statut === "PUBLIE"
          ? (existant.published_at ?? new Date().toISOString())
          : existant.published_at,
    });
    rafraichirApresEcriture();
  } catch (erreur) {
    console.error("Changement de statut d'un événement en échec :", erreur.message);
    etat = "echec";
  }

  redirect(`/admin/evenements/${id}?etat=${etat}`);
}

// Responsable et bilan.
export async function enregistrerSuivi(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  if (!id) redirect("/admin/evenements");

  const { valeurs, erreur } = validerSuivi(formData);
  let etat = erreur ? "bilan-trop-long" : "bilan";
  if (!erreur) {
    try {
      const { droits } = await lireAvecDroits(supabase, niveau, id);
      if (!droits.modifier) etat = "refuse";
      else await enregistrerSuiviDansLaBase(supabase, id, valeurs);
    } catch (e) {
      console.error("Enregistrement d'un bilan en échec :", e.message);
      // Responsable refusé par la base : il n'est pas (ou plus) membre du Noyau.
      etat = /responsable/i.test(e.message) ? "responsable-refuse" : "echec";
    }
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/evenements/${id}/bilan?etat=${etat}`);
}

// Envoi d'une photo, avec sa description (obligatoire).
export async function ajouterPhoto(formData) {
  const { supabase } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  if (!id) redirect("/admin/evenements");

  const fichier = formData.get("photo");
  const { valeurs, erreur } = validerDetailsPhoto(formData);

  let etat = "photo-ajoutee";
  if (!(fichier instanceof File) || fichier.size === 0) etat = "photo-manquante";
  else if (erreur === "description") etat = "photo-sans-description";
  else if (erreur || (await validerImage(fichier))) etat = "photo-refusee";
  else {
    try {
      await ajouterPhotoDansLaBase(supabase, id, fichier, valeurs);
      rafraichirApresEcriture();
    } catch (e) {
      console.error("Envoi d'une photo en échec :", e.message);
      etat = "echec";
    }
  }

  redirect(`/admin/evenements/${id}/photos?etat=${etat}`);
}

// Valider, masquer, choisir comme couverture ou supprimer une photo.
export async function agirSurPhoto(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  const idPhoto = idValide(formData, "id_photo");
  if (!id || !idPhoto) redirect("/admin/evenements");

  // Valider, masquer, couverture, suppression : Head of et direction.
  if (!droitsEvenement(null, niveau, false).gererPhotos) {
    redirect(`/admin/evenements/${id}/photos?etat=refuse`);
  }

  const operation = String(formData.get("operation") ?? "");
  let etat = `photo-${operation}`;
  try {
    if (operation === "valider") await changerValidationPhoto(supabase, idPhoto, true);
    else if (operation === "masquer") await changerValidationPhoto(supabase, idPhoto, false);
    else if (operation === "couverture") await definirCouverture(supabase, id, idPhoto);
    else if (operation === "supprimer") await supprimerPhoto(supabase, idPhoto);
    else etat = "echec";
    rafraichirApresEcriture();
  } catch (e) {
    console.error("Modification d'une photo en échec :", e.message);
    etat = "echec";
  }

  redirect(`/admin/evenements/${id}/photos?etat=${etat}`);
}

// Pointage d'une inscription (INSCRIT, PRESENT, ABSENT, DESISTE).
export async function changerStatutInscription(formData) {
  const { supabase } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  const idInscription = idValide(formData, "id_inscription");
  const statut = String(formData.get("statut") ?? "");
  if (!id) redirect("/admin/evenements");

  let etat = "pointe";
  if (!idInscription || !STATUTS_INSCRIPTION[statut]) etat = "echec";
  else {
    try {
      await changerStatutDansLaBase(supabase, idInscription, statut);
    } catch (e) {
      console.error("Pointage en échec :", e.message);
      etat = "echec";
    }
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/evenements/${id}/inscrits?etat=${etat}#ligne-${idInscription}`);
}

// Ajout d'une personne par l'équipe : présente sans inscription préalable,
// ou inscrite à sa place.
export async function ajouterParticipant(formData) {
  const { supabase } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  if (!id) redirect("/admin/evenements");

  const statut = formData.get("statut") === "INSCRIT" ? "INSCRIT" : "PRESENT";
  const { valeurs, erreurs } = validerParticipant(formData);

  let etat = "ajoute";
  if (Object.keys(erreurs).length > 0) etat = "ajout-invalide";
  else {
    try {
      await ajouterDansLaBase(supabase, id, valeurs, statut);
    } catch (e) {
      console.error("Ajout d'un participant en échec :", e.message);
      etat = "echec";
    }
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/evenements/${id}/inscrits?etat=${etat}`);
}

// Supprime définitivement un événement (direction ; ou son auteur, tant
// que c'est un brouillon jamais publié), puis revient à la liste.
export async function supprimerEvenement(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  if (!id) redirect("/admin/evenements");

  let etat = "supprime";
  try {
    const { evenement, droits } = await lireAvecDroits(supabase, niveau, id);
    if (!evenement || !droits.supprimer) etat = "refuse";
    else {
      await supprimerEvenementDansLaBase(supabase, id);
      rafraichirApresEcriture();
    }
  } catch (e) {
    console.error("Suppression d'un événement en échec :", e.message);
    etat = "echec";
  }

  redirect(`/admin/evenements?etat=${etat}`);
}

// Lie un partenaire (contact du carnet ou organisation saisie) à un
// événement. Interne à l'équipe : rien n'apparaît sur le site.
export async function ajouterPartenaire(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  if (!id) redirect("/admin/evenements");

  const { valeurs, erreur } = validerPartenaire(formData);
  let etat = erreur ? `partenaire-${erreur}` : "partenaire-ajoute";
  if (!erreur) {
    try {
      const { droits } = await lireAvecDroits(supabase, niveau, id);
      if (!droits.modifier) etat = "refuse";
      else await ajouterPartenaireDansLaBase(supabase, id, valeurs);
    } catch (e) {
      console.error("Ajout d'un partenaire en échec :", e.message);
      etat = "echec";
    }
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/evenements/${id}/partenaires?etat=${etat}`);
}

// Retire un partenaire de l'événement (le contact reste dans le carnet).
export async function retirerPartenaire(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const id = idValide(formData, "id");
  const idLien = idValide(formData, "id_lien");
  if (!id || !idLien) redirect("/admin/evenements");

  let etat = "partenaire-retire";
  try {
    const { droits } = await lireAvecDroits(supabase, niveau, id);
    if (!droits.modifier) etat = "refuse";
    else await retirerPartenaireDansLaBase(supabase, idLien);
  } catch (e) {
    console.error("Retrait d'un partenaire en échec :", e.message);
    etat = "echec";
  }

  revalidatePath("/admin", "layout");
  redirect(`/admin/evenements/${id}/partenaires?etat=${etat}`);
}
