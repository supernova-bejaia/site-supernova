"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { seConnecter } from "@/actions/authentification";
import { adresseDeRetour } from "@/lib/adresse-retour";
import styles from "./Admin.module.css";

const MESSAGE_REFUS = "Ce compte n'a pas accès à l'espace équipe.";

// Formulaire de connexion à l'espace équipe.
// L'adresse « /admin/connexion?acces=refuse » (envoyée par le contrôle
// d'accès) affiche d'emblée le message de refus.
export default function FormulaireConnexion() {
  const parametres = useSearchParams();
  const accesRefuse = parametres.get("acces") === "refuse";
  // Page demandée avant la connexion (ex. le carnet), sinon le tableau de bord.
  const destination = adresseDeRetour(parametres.get("suite")) ?? "/admin";
  const [etat, envoyer, enCours] = useActionState(seConnecter, { message: "" });
  const connecte = etat?.ok === true;
  const message = connecte ? "" : etat?.message || (accesRefuse ? MESSAGE_REFUS : "");

  // Connexion réussie : on charge la page voulue par un vrai rechargement.
  // Le navigateur repart ainsi de zéro, sans aucune ancienne version de
  // l'espace équipe en mémoire.
  useEffect(() => {
    if (!connecte) return;
    window.location.assign(destination);
  }, [connecte, destination]);

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
          Connexion réussie. <a href={destination}>Ouvrir l&apos;espace équipe</a>
        </p>
      )}
    </form>
  );
}
