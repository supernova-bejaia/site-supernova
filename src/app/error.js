"use client"; // Une page d'erreur doit être un composant client.

import { useEffect } from "react";
import styles from "./error.module.css";

// Page affichée si une erreur inattendue survient pendant l'affichage.
// Elle remplace l'écran d'erreur par défaut de Next.js (en anglais) par un
// message aux couleurs de Supernova, avec un bouton pour réessayer.
export default function Erreur({ error, retry, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // « retry » recharge la page concernée ; « reset » est son ancien nom.
  const reessayer = retry ?? reset;

  return (
    <div className={`conteneur ${styles.page}`}>
      <h1>Un problème est survenu</h1>
      <p>
        La page n&apos;a pas pu s&apos;afficher correctement. Vérifiez votre connexion, puis
        réessayez.
      </p>
      <button type="button" className="bouton" onClick={() => reessayer?.()}>
        Réessayer
      </button>
    </div>
  );
}
