"use client";

import { useEffect } from "react";
// Chargé ici, sur toutes les pages de l'espace équipe, pour capter au plus
// tôt la proposition d'installation du navigateur.
import "@/lib/installation";

// Enregistre le service worker de l'application « Contacts Supernova »
// (public/sw.js), sur toutes les pages de l'espace équipe. Il ne met rien
// en cache : il permet seulement au navigateur de proposer l'installation.
//
// N'affiche rien.
export default function EnregistrementApplication() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/admin/" }).catch((erreur) => {
      console.error("Enregistrement de l'application impossible :", erreur.message);
    });
  }, []);

  return null;
}
