"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { inscrireEvenement } from "@/actions/inscriptions";
import { Champ } from "@/components/rejoindre/OrbiteForm";
import styles from "@/components/rejoindre/OrbiteForm.module.css";

const ETAT_INITIAL = { ok: false, erreurs: {}, message: "" };

const MESSAGE_CONNEXION =
  "Connexion impossible. Vérifiez votre accès à Internet, puis réessayez : votre saisie est conservée.";

// Protège la page d'une panne de réseau pendant l'envoi : un message
// s'affiche et la saisie reste en place. Réessayer est sans danger : une
// seconde inscription avec le même email ne crée pas de doublon.
async function envoyer(etatPrecedent, donnees) {
  try {
    return await inscrireEvenement(etatPrecedent, donnees);
  } catch {
    return { ok: false, erreurs: {}, message: MESSAGE_CONNEXION };
  }
}

// Formulaire d'inscription à un événement : quatre champs, pensé d'abord
// pour le téléphone. La case « rejoindre l'Orbite » est décochée par défaut.
export default function FormulaireInscription({ idEvenement, titre }) {
  const [etat, soumettreAction, enCours] = useActionState(envoyer, ETAT_INITIAL);
  const formulaire = useRef(null);
  const confirmation = useRef(null);
  const erreurs = etat.erreurs ?? {};

  function soumettre(evenement) {
    // Envoi manuel : le formulaire garde la saisie si le serveur signale
    // une erreur.
    evenement.preventDefault();
    if (enCours) return;
    const donnees = new FormData(evenement.currentTarget);
    startTransition(() => soumettreAction(donnees));
  }

  useEffect(() => {
    if (etat.ok) {
      confirmation.current?.focus();
      confirmation.current?.scrollIntoView({ block: "center" });
      return;
    }
    const premierChampEnErreur = Object.keys(etat.erreurs ?? {})[0];
    if (premierChampEnErreur) {
      formulaire.current?.elements.namedItem(premierChampEnErreur)?.focus();
    }
  }, [etat]);

  if (etat.ok) {
    return (
      <div className={styles.confirmation} ref={confirmation} tabIndex={-1} role="status">
        <span className={styles.pastille} aria-hidden="true">
          ✓
        </span>
        <h3>C&apos;est noté{etat.prenom ? `, ${etat.prenom}` : ""} !</h3>
        <p>Votre inscription à « {titre} » est enregistrée.</p>
        <p className={styles.precision}>
          Un empêchement ? Écrivez-nous depuis la même adresse email pour libérer votre place.
        </p>
      </div>
    );
  }

  // method="post" : si la page n'a pas fini de charger, l'envoi ne met
  // jamais les données personnelles dans l'adresse de la page.
  return (
    <form ref={formulaire} method="post" className={styles.formulaire} onSubmit={soumettre}>
      <input type="hidden" name="id_evenement" value={idEvenement} />

      <div className={styles.rangee}>
        <Champ nom="prenom" libelle="Prénom" erreur={erreurs.prenom}>
          <input type="text" autoComplete="given-name" maxLength={100} required />
        </Champ>
        <Champ nom="nom" libelle="Nom" erreur={erreurs.nom}>
          <input type="text" autoComplete="family-name" maxLength={100} required />
        </Champ>
      </div>

      <Champ nom="email" libelle="Email" erreur={erreurs.email}>
        <input type="email" autoComplete="email" inputMode="email" maxLength={254} required />
      </Champ>

      <Champ nom="tel" libelle="Téléphone" facultatif erreur={erreurs.tel}>
        <input type="tel" autoComplete="tel" inputMode="tel" maxLength={30} placeholder="05 55 00 00 00" />
      </Champ>

      <label className={styles.case}>
        <input type="checkbox" name="orbite" />
        <span>
          Rejoindre aussi l&apos;Orbite, le réseau ouvert de Supernova, pour être informé des
          prochains rendez-vous.
        </span>
      </label>

      {/* Champ piège anti-robots : invisible et ignoré par les lecteurs d'écran. */}
      <div className={styles.piege} aria-hidden="true">
        <label htmlFor="site_web">Ne pas remplir ce champ</label>
        <input type="text" id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <p className={styles.information}>
        Vos informations ne sont utilisées que par Supernova.{" "}
        <Link href="/vos-donnees">En savoir plus sur vos données</Link>.
      </p>

      <p className={styles.message} role="alert">
        {etat.message}
      </p>

      <button type="submit" className={`bouton ${styles.envoi}`} disabled={enCours}>
        {enCours ? "Envoi en cours…" : "Je m'inscris"}
        {!enCours && (
          <span className="fleche" aria-hidden="true">
            →
          </span>
        )}
      </button>
    </form>
  );
}
