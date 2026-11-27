"use client";

import { useEffect } from "react";

const PAGE_NOUVEAU_MOT_DE_PASSE = "/admin/reset-password";

// Retour du lien « Reset Password » par défaut de Supabase.
//
// Supabase vérifie lui-même le lien de l'email, puis renvoie vers l'adresse
// du site (« Site URL », souvent l'accueil) avec la session de
// réinitialisation après le « # » : #access_token=…&type=recovery, ou
// #error=… si le lien a expiré. Ce composant repère ce retour, sur
// n'importe quelle page, et l'envoie vers la page du nouveau mot de passe,
// qui s'occupe du reste.
//
// Il n'affiche rien, et ne fait rien pour une adresse ordinaire.
export default function RetourRecuperation() {
  useEffect(() => {
    function verifier() {
      const { hash, pathname } = window.location;
      if (!hash || pathname === PAGE_NOUVEAU_MOT_DE_PASSE) return;

      const fragment = new URLSearchParams(hash.slice(1));
      const retourDeSupabase =
        fragment.get("type") === "recovery" || fragment.has("error_code");
      if (retourDeSupabase) window.location.replace(PAGE_NOUVEAU_MOT_DE_PASSE + hash);
    }

    // Au chargement (cas habituel : le lien de l'email ouvre un nouvel
    // onglet), et si seule la fin de l'adresse change sur une page ouverte.
    verifier();
    window.addEventListener("hashchange", verifier);
    return () => window.removeEventListener("hashchange", verifier);
  }, []);

  return null;
}
