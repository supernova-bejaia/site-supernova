"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  changerMotDePasse,
  ouvrirSessionRecuperation,
  verifierLienRecuperation,
} from "@/actions/reinitialisation";
import styles from "./Admin.module.css";

// Pas d'import depuis lib/acces-admin.js : il ne tourne que sur le serveur.
const PAGE_CONNEXION = "/admin/connexion";

const MESSAGE_LIEN_INVALIDE =
  "Ce lien de réinitialisation est invalide. Demandez un nouvel email de réinitialisation.";
const MESSAGE_LIEN_EXPIRE =
  "Ce lien a expiré ou a déjà été utilisé. Demandez un nouvel email de réinitialisation.";
const MESSAGE_PANNE = "Impossible pour le moment. Réessayez dans un instant.";

// Formulaire de nouveau mot de passe, ouvert depuis l'email « Reset Password ».
// Le lien arrive sous l'une de ces deux formes (voir actions/reinitialisation.js) :
//   - lien personnalisé : ?token_hash=…&type=recovery
//   - lien par défaut de Supabase : #access_token=…&refresh_token=…&type=recovery
//     (ou #error=… si le lien a expiré)
//
//   1. au chargement, le lien est vérifié sur le serveur ;
//   2. s'il est valide, la personne choisit son nouveau mot de passe ;
//   3. une fois enregistré, retour à la page de connexion.
export default function FormulaireNouveauMotDePasse() {
  const parametres = useSearchParams();
  const tokenHash = parametres.get("token_hash");
  const lienPersonnalise = Boolean(tokenHash) && parametres.get("type") === "recovery";

  // « verification » : en cours, « pret » : lien valide, sinon le message d'erreur.
  const [lien, setLien] = useState("verification");
  const [etat, envoyer, enCours] = useActionState(changerMotDePasse, { message: "" });
  const dejaVerifie = useRef(false);
  const termine = etat?.ok === true;

  // Le lien ne sert qu'une fois : on ne le vérifie qu'une fois (React
  // peut lancer cet effet deux fois en développement).
  useEffect(() => {
    if (dejaVerifie.current) return;
    dejaVerifie.current = true;

    async function verifier() {
      if (lienPersonnalise) {
        const resultat = await verifierLienRecuperation(tokenHash);
        return resultat.ok ? "pret" : resultat.message;
      }

      // Lien par défaut : la session est après le « # », que seul le
      // navigateur voit. On l'efface aussitôt de la barre d'adresse (et
      // donc de l'historique), puis on la confie au serveur.
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      if (fragment.get("error") || fragment.get("error_code")) return MESSAGE_LIEN_EXPIRE;

      const jetonAcces = fragment.get("access_token");
      const jetonRenouvellement = fragment.get("refresh_token");
      if (!jetonAcces || !jetonRenouvellement || fragment.get("type") !== "recovery") {
        return MESSAGE_LIEN_INVALIDE;
      }

      const resultat = await ouvrirSessionRecuperation(jetonAcces, jetonRenouvellement);
      return resultat.ok ? "pret" : resultat.message;
    }

    verifier().then(setLien, () => setLien(MESSAGE_PANNE));
  }, [lienPersonnalise, tokenHash]);

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
