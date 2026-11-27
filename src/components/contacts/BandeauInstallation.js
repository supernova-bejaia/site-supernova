"use client";

import { useState, useSyncExternalStore } from "react";
import { abonnerInvitation, lireInvitation, proposerInstallation } from "@/lib/installation";
import styles from "./Contacts.module.css";

const CLE_MASQUE = "supernova-installation-masquee";

// Le téléphone, l'application déjà installée, le bandeau déjà fermé…
// Lu dans le navigateur seulement (« serveur » pendant le rendu serveur).
function lireEnvironnement() {
  try {
    if (window.localStorage.getItem(CLE_MASQUE) === "oui") return "masque";
  } catch {
    // Stockage indisponible (navigation privée) : on affiche quand même.
  }
  const installee =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (installee) return "installee";
  if (!window.matchMedia("(pointer: coarse)").matches) return "ordinateur";
  const iphone =
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  return iphone ? "iphone" : "android";
}

const neRienEcouter = () => () => {};

// Bandeau « Installer l'application Contacts », en haut du carnet, sur
// téléphone seulement :
//   - Android : le bouton ouvre directement la fenêtre d'installation
//     (dès que le navigateur la propose) ;
//   - iPhone : Apple ne laisse pas un site lancer l'installation ; le
//     bouton montre les deux gestes à faire dans Safari.
// Il disparaît une fois l'application installée, ou fermé avec la croix
// (pour de bon, sur ce téléphone).
export default function BandeauInstallation() {
  const environnement = useSyncExternalStore(neRienEcouter, lireEnvironnement, () => "serveur");
  const invitation = useSyncExternalStore(abonnerInvitation, lireInvitation, () => null);
  const [ferme, setFerme] = useState(false);
  const [aideOuverte, setAideOuverte] = useState(false);

  function fermer() {
    try {
      window.localStorage.setItem(CLE_MASQUE, "oui");
    } catch {
      // Sans stockage, le bandeau reviendra à la prochaine visite.
    }
    setFerme(true);
  }

  async function installer() {
    if (await proposerInstallation()) setFerme(true);
  }

  if (ferme) return null;
  const android = environnement === "android" && invitation;
  const iphone = environnement === "iphone";
  if (!android && !iphone) return null;

  return (
    <aside className={styles.bandeauInstallation} aria-label="Installer l'application">
      <div className={styles.texteInstallation}>
        <strong>Le carnet sur votre écran d&apos;accueil</strong>
        <span>Une icône « Contacts », qui s&apos;ouvre en plein écran.</span>
      </div>

      {android ? (
        <button type="button" className="bouton" onClick={installer}>
          Installer
        </button>
      ) : (
        <button
          type="button"
          className="bouton"
          aria-expanded={aideOuverte}
          onClick={() => setAideOuverte(!aideOuverte)}
        >
          Comment faire
        </button>
      )}

      <button type="button" className={styles.fermerInstallation} onClick={fermer} aria-label="Ne plus proposer">
        <span aria-hidden="true">×</span>
      </button>

      {iphone && aideOuverte && (
        <ol className={styles.aideInstallation}>
          <li>
            Dans Safari, touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le
            haut).
          </li>
          <li>
            Choisissez <strong>Sur l&apos;écran d&apos;accueil</strong>, puis <strong>Ajouter</strong>.
          </li>
          <li>Ouvrez l&apos;icône « Contacts » et connectez-vous une première fois.</li>
        </ol>
      )}
    </aside>
  );
}
