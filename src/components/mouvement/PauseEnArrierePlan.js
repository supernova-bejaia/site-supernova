"use client";

import { useEffect } from "react";

// Met toutes les animations du site en pause quand la page passe en
// arrière-plan (changement d'application, d'onglet, écran éteint), et les
// relance au retour. Le téléphone n'a ainsi rien à dessiner pendant qu'il
// anime la sortie du navigateur.
//
// Ce composant n'affiche rien : il pose seulement l'attribut
// « data-arriere-plan » sur <html>, lu par globals.css.
export default function PauseEnArrierePlan() {
  useEffect(() => {
    const racine = document.documentElement;

    function surChangement() {
      racine.dataset.arrierePlan = String(document.visibilityState === "hidden");
    }

    surChangement();
    document.addEventListener("visibilitychange", surChangement);
    return () => {
      document.removeEventListener("visibilitychange", surChangement);
      delete racine.dataset.arrierePlan;
    };
  }, []);

  return null;
}
