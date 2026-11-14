"use client";

import { useActionState } from "react";
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
  const message = etat?.message || (accesRefuse ? MESSAGE_REFUS : "");

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

      <button type="submit" className={`bouton ${styles.boutonPlein}`} disabled={enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
