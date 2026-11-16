"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { seConnecter } from "@/actions/authentification";
import styles from "./Admin.module.css";

const MESSAGE_REFUS = "Ce compte n'a pas accès à l'espace équipe.";

// Formulaire de connexion à l'espace équipe.
// L'adresse « /admin/connexion?acces=refuse » (envoyée par le contrôle
// d'accès) affiche d'emblée le message de refus.
export default function FormulaireConnexion() {
  const accesRefuse = useSearchParams().get("acces") === "refuse";
  const [etat, envoyer, enCours] = useActionState(seConnecter, { message: "" });
  const connecte = etat?.ok === true;
  const message = connecte ? "" : etat?.message || (accesRefuse ? MESSAGE_REFUS : "");

  // Connexion réussie : on charge le tableau de bord par un vrai
  // rechargement de page. Le navigateur repart ainsi de zéro, sans aucune
  // ancienne version de l'espace équipe en mémoire.
  useEffect(() => {
    if (!connecte) return;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu
    window.location.assign("/admin");
  }, [connecte]);

  return (
    <form action={envoyer} className={styles.formulaireConnexion}>
      <div className={styles.champ}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
      </div>

      <div className={styles.champ}>
        <label htmlFor="mot_de_passe">Mot de passe</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <p className={styles.message} role="alert">
        {message}
      </p>

      <button
        type="submit"
        className={`bouton ${styles.boutonPlein}`}
        disabled={enCours || connecte}
      >
        {enCours || connecte ? "Connexion…" : "Se connecter"}
      </button>

      {/* Secours si le rechargement automatique ne se fait pas. */}
      {connecte && (
        <p className={styles.aide}>
          Connexion réussie. <a href="/admin">Ouvrir l&apos;espace équipe</a>
        </p>
      )}
    </form>
  );
}
