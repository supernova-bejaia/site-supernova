"use server";

import { validerInscription } from "@/lib/validation";
import { enregistrerInscriptionOrbite } from "@/services/inscriptions";

const MESSAGE_ERREUR_GENERALE =
  "L'inscription n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez dans un instant.";

// Server Actions liées aux inscriptions.
//
// Elles vivent dans src/actions/ (et non dans le dossier d'une page) pour
// que n'importe quel composant puisse les utiliser sans dépendre d'une
// page précise. Elles s'exécutent sur le serveur, jamais dans le navigateur.

// Server Action appelée par le formulaire Orbite.
//
// Son rôle se limite à faire le lien entre le formulaire et le reste :
//   1. écarter les robots ;
//   2. valider les champs            → lib/validation.js
//   3. enregistrer l'inscription     → services/inscriptions.js
//   4. renvoyer un « état » que le formulaire affiche.
//
// États possibles :
//   { ok: true, prenom }                 → inscription enregistrée
//   { ok: false, erreurs, message }      → à corriger ou à réessayer
export async function inscrireOrbite(etatPrecedent, formData) {
  // Champ piège : invisible pour un humain, souvent rempli par les robots.
  // On répond « ok » sans rien enregistrer, pour ne pas les renseigner.
  if (formData.get("site_web")) {
    return { ok: true, prenom: "" };
  }

  const { valeurs, erreurs } = validerInscription(formData);

  if (Object.keys(erreurs).length > 0) {
    return {
      ok: false,
      erreurs,
      message: "Certains champs sont à corriger.",
    };
  }

  try {
    await enregistrerInscriptionOrbite(valeurs);
  } catch (erreur) {
    // On journalise la cause technique, sans aucune donnée personnelle.
    console.error("Inscription Orbite en échec :", erreur.message);
    return { ok: false, erreurs: {}, message: MESSAGE_ERREUR_GENERALE };
  }

  return { ok: true, prenom: valeurs.prenom };
}
