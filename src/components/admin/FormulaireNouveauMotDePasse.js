"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { changerMotDePasse, verifierLienRecuperation } from "@/actions/reinitialisation";
import styles from "./Admin.module.css";

// Pas d'import depuis lib/acces-admin.js : il ne tourne que sur le serveur.
const PAGE_CONNEXION = "/admin/connexion";

const MESSAGE_LIEN_INVALIDE =
  "Ce lien de réinitialisation est invalide. Demandez un nouvel email de réinitialisation.";

// Formulaire de nouveau mot de passe, ouvert depuis l'email « Reset Password »
// (/admin/reset-password?token_hash=…&type=recovery).
//
//   1. au chargement, le lien est vérifié sur le serveur ;
//   2. s'il est valide, la personne choisit son nouveau mot de passe ;
//   3. une fois enregistré, retour à la page de connexion.
export default function FormulaireNouveauMotDePasse() {
  const parametres = useSearchParams();
  const tokenHash = parametres.get("token_hash");
  const lienComplet = Boolean(tokenHash) && parametres.get("type") === "recovery";

  // « verification » : en cours, « pret » : lien valide, sinon le message d'erreur.
  const [lien, setLien] = useState(lienComplet ? "verification" : MESSAGE_LIEN_INVALIDE);
  const [etat, envoyer, enCours] = useActionState(changerMotDePasse, { message: "" });
  const dejaVerifie = useRef(false);
  const termine = etat?.ok === true;

  // Le lien ne sert qu'une fois : on ne le vérifie qu'une fois (React
  // peut lancer cet effet deux fois en développement).
  useEffect(() => {
    if (!lienComplet || dejaVerifie.current) return;
    dejaVerifie.current = true;
    verifierLienRecuperation(tokenHash).then(
      (resultat) => setLien(resultat.ok ? "pret" : resultat.message),
      () => setLien("Impossible pour le moment. Réessayez dans un instant.")
    );
  }, [lienComplet, tokenHash]);

  // Mot de passe changé : retour à la connexion, par un vrai rechargement.
  useEffect(() => {
    if (!termine) return;
    const minuteur = setTimeout(
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu
      () => window.location.assign(PAGE_CONNEXION),
      2500
    );
    return () => clearTimeout(minuteur);
  }, [termine]);

  if (lien === "verification") {
    return <p className={styles.aide}>Vérification du lien…</p>;
  }

  if (lien !== "pret" || etat?.lienPerime) {
    return (
      <>
        <p className={styles.message} role="alert">
          {etat?.lienPerime ? etat.message : lien}
        </p>
        <a href={PAGE_CONNEXION} className={`bouton ${styles.boutonPlein}`}>
          Retour à la connexion
        </a>
      </>
    );
  }

  if (termine) {
    return (
      <p className={styles.aide} role="status">
        Mot de passe modifié. Redirection vers la connexion…{" "}
        <a href={PAGE_CONNEXION}>Se connecter</a>
      </p>
    );
  }

  return (
    <form action={envoyer} className={styles.formulaireConnexion}>
      <div className={styles.champ}>
        <label htmlFor="mot_de_passe">Nouveau mot de passe</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className={styles.champ}>
        <label htmlFor="confirmation">Confirmer le mot de passe</label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <p className={styles.message} role="alert">
        {etat?.message}
      </p>

      <button type="submit" className={`bouton ${styles.boutonPlein}`} disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}
