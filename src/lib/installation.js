"use client";

// Proposition d'installation de l'application « Contacts Supernova ».
//
// Chrome (Android) annonce qu'une application est installable par
// l'événement « beforeinstallprompt », souvent dès le chargement de la page,
// avant même l'affichage du bandeau. On le capte donc ici, au plus tôt
// (ce fichier est chargé par toutes les pages de l'espace équipe), et on le
// garde pour le bandeau d'installation.

let invitation = null;
const abonnes = new Set();
const prevenir = () => abonnes.forEach((rappel) => rappel());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (evenement) => {
    // On garde la main : l'installation se proposera depuis notre bouton.
    evenement.preventDefault();
    invitation = evenement;
    prevenir();
  });
  window.addEventListener("appinstalled", () => {
    invitation = null;
    prevenir();
  });
}

export function abonnerInvitation(rappel) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}

export function lireInvitation() {
  return invitation;
}

// Ouvre la fenêtre d'installation du téléphone. Renvoie vrai si la
// personne a accepté. L'invitation ne sert qu'une fois.
export async function proposerInstallation() {
  if (!invitation) return false;
  const enCours = invitation;
  invitation = null;
  enCours.prompt();
  const { outcome } = await enCours.userChoice;
  prevenir();
  return outcome === "accepted";
}
