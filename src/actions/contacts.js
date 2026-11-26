"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirAccesAdmin } from "@/lib/acces-admin";
import { validerContact } from "@/lib/validation-contact";
import {
  ajouterContact as ajouterDansLaBase,
  lireContact,
  modifierContact as modifierDansLaBase,
} from "@/services/contacts";

// Server Actions du carnet de contacts (espace équipe). Chacune revérifie
// l'accès : une action peut être appelée directement, sans passer par la page.

const MESSAGE_SESSION = "Votre session a expiré. Reconnectez-vous, puis réessayez : votre saisie est conservée.";
const MESSAGE_PANNE = "L'enregistrement a échoué. Réessayez dans un instant : votre saisie est conservée.";
const MESSAGE_ERREURS = "Certains champs sont à corriger.";
const MESSAGE_DROITS =
  "Votre compte ne peut pas ajouter de contact : il doit être celui d'un membre du Noyau, relié à sa fiche.";
const MESSAGE_COORDONNEES =
  "Un numéro ou un email a été repéré dans les notes ou les conditions : mettez-le dans « Téléphones » ou « Emails ».";

const echec = (message, erreurs = {}) => ({ ok: false, message, erreurs });

// Ajoute un contact, puis ouvre sa fiche.
export async function ajouterContact(etatPrecedent, formData) {
  let id;
  try {
    const acces = await obtenirAccesAdmin();
    if (!acces) return echec(MESSAGE_SESSION);

    const { valeurs, erreurs } = validerContact(formData);
    if (Object.keys(erreurs).length > 0) return echec(MESSAGE_ERREURS, erreurs);

    const resultat = await ajouterDansLaBase(acces.supabase, valeurs);
    if (resultat.refus === "coordonnees") return echec(MESSAGE_COORDONNEES);
    if (resultat.refus === "droits") return echec(MESSAGE_DROITS);
    id = resultat.id;
  } catch (erreur) {
    console.error("Ajout d'un contact en échec :", erreur.message);
    return echec(MESSAGE_PANNE);
  }

  // Hors du try : redirect() fonctionne en levant une exception.
  revalidatePath("/admin/contacts");
  redirect(`/admin/contacts/${id}?etat=ajoute`);
}

const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Modifie un contact, puis rouvre sa fiche.
//
// Le référent modifie tout. Un Head of ou la direction modifie la fiche
// d'un contact Équipe ou Restreint, mais ni sa visibilité ni ses
// conditions (on reprend les valeurs actuelles), et ses coordonnées
// seulement pour un contact Équipe. La base applique les mêmes règles.
export async function modifierContact(etatPrecedent, formData) {
  const idContact = String(formData.get("id") ?? "");
  try {
    const acces = await obtenirAccesAdmin();
    if (!acces) return echec(MESSAGE_SESSION);
    if (!FORMAT_UUID.test(idContact)) return echec("Ce contact n'existe plus.");

    const contact = await lireContact(acces.supabase, idContact);
    if (!contact) return echec("Ce contact n'existe plus, ou vous n'y avez plus accès.");
    if (!contact.peutModifier) {
      return echec("Seul le référent de ce contact (ou un Head of, sauf contact privé) peut le modifier.");
    }

    const { valeurs, erreurs } = validerContact(formData, { modification: true });

    // Ce que seul le référent décide : on garde les valeurs actuelles.
    if (!contact.estReferent) {
      valeurs.visibilite = contact.visibilite;
      valeurs.conditions = contact.conditions ?? "";
      delete erreurs.visibilite;
      delete erreurs.conditions;
    }
    if (!contact.peutModifierCoordonnees) {
      delete erreurs.telephone;
      delete erreurs.email;
    }

    if (Object.keys(erreurs).length > 0) return echec(MESSAGE_ERREURS, erreurs);

    const resultat = await modifierDansLaBase(acces.supabase, idContact, valeurs, {
      modifierCoordonnees: contact.peutModifierCoordonnees,
    });
    if (resultat.refus === "coordonnees") return echec(MESSAGE_COORDONNEES);
    if (resultat.refus === "droits") {
      return echec("La base a refusé cette modification : vos droits sur ce contact ont peut-être changé.");
    }
  } catch (erreur) {
    console.error("Modification d'un contact en échec :", erreur.message);
    return echec(MESSAGE_PANNE);
  }

  revalidatePath("/admin/contacts");
  redirect(`/admin/contacts/${idContact}?etat=modifie`);
}
