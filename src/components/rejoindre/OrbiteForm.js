"use client";

import {
  cloneElement,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { inscrireOrbite } from "@/actions/inscriptions";
import { AUTRE, ETABLISSEMENTS, FILIERES, NIVEAUX } from "@/lib/formulaire-orbite";
import styles from "./OrbiteForm.module.css";

const ETAT_INITIAL = { ok: false, erreurs: {}, message: "" };

// Au-delà de ce délai sans réponse, on rend la main à la personne.
const DELAI_MAX_MS = 20000;

const MESSAGE_CONNEXION =
  "Connexion impossible. Vérifiez votre accès à Internet, puis réessayez : votre saisie est conservée.";
const MESSAGE_DELAI =
  "L'envoi prend trop de temps. Vérifiez votre connexion, puis réessayez : votre saisie est conservée.";

// Marqueur « inscrit sur cet appareil », gardé dans le navigateur.
//
// L'Orbite s'inscrit sans compte : le site ne peut donc pas reconnaître une
// personne qui revient. On retient seulement, sur son appareil, qu'une
// inscription y a été faite — un simple « oui », sans aucune donnée
// personnelle, et jamais envoyé au serveur.
const CLE_INSCRIT = "supernova-orbite-inscrit";

// Le stockage peut être indisponible (navigation privée, réglages) :
// dans ce cas on fait comme si rien n'était mémorisé.
function lireMarqueurInscrit() {
  try {
    return window.localStorage.getItem(CLE_INSCRIT) === "oui";
  } catch {
    return false;
  }
}

function memoriserInscription() {
  try {
    window.localStorage.setItem(CLE_INSCRIT, "oui");
  } catch {
    // Sans stockage, la personne reverra simplement le formulaire.
  }
}

// Le marqueur ne change pas pendant la visite : rien à écouter.
const neRienEcouter = () => () => {};

// Appelle la Server Action en se protégeant des pannes de réseau.
//
// Sans cette protection, une connexion coupée pendant l'envoi ferait planter
// toute la page et perdre la saisie. Ici, on renvoie simplement un message
// d'erreur, comme pour n'importe quel autre problème.
//
// Réessayer est sans danger : une inscription envoyée deux fois avec le même
// email met à jour la première au lieu de créer un doublon.
async function envoyerInscription(etatPrecedent, donnees) {
  let minuteur;
  const delaiDepasse = new Promise((resoudre) => {
    minuteur = setTimeout(
      () => resoudre({ ok: false, erreurs: {}, message: MESSAGE_DELAI }),
      DELAI_MAX_MS
    );
  });

  try {
    return await Promise.race([inscrireOrbite(etatPrecedent, donnees), delaiDepasse]);
  } catch {
    return { ok: false, erreurs: {}, message: MESSAGE_CONNEXION };
  } finally {
    clearTimeout(minuteur);
  }
}

// Formulaire d'inscription à l'Orbite, en trois étapes visibles d'un coup
// d'œil : identité, études, envies.
// « centresInteret » est la liste lue dans Supabase par la page.
export default function OrbiteForm({ centresInteret }) {
  // useActionState relie le formulaire à la Server Action :
  //   etat      → la dernière réponse du serveur (succès ou erreurs)
  //   envoyer   → la fonction à appeler pour soumettre
  //   enCours   → vrai pendant l'envoi (sert à bloquer le double clic)
  const [etat, envoyer, enCours] = useActionState(envoyerInscription, ETAT_INITIAL);

  // Sert uniquement à afficher le champ libre quand « Autre » est choisi.
  const [etablissement, setEtablissement] = useState("");
  const formulaire = useRef(null);
  const confirmation = useRef(null);

  // Vrai si une inscription a déjà été faite depuis cet appareil.
  // (Faux pendant le rendu côté serveur, qui ne connaît pas l'appareil.)
  const dejaInscrit = useSyncExternalStore(neRienEcouter, lireMarqueurInscrit, () => false);
  // La personne déjà inscrite a demandé à rouvrir le formulaire.
  const [modification, setModification] = useState(false);

  const erreurs = etat.erreurs ?? {};

  function soumettre(evenement) {
    // On envoie nous-mêmes les données : ainsi le formulaire garde ce que
    // la personne a saisi si le serveur signale une erreur.
    evenement.preventDefault();
    if (enCours) return;
    const donnees = new FormData(evenement.currentTarget);
    startTransition(() => envoyer(donnees));
  }

  // Après une réponse du serveur : on amène la personne au bon endroit.
  useEffect(() => {
    if (etat.ok) {
      memoriserInscription();
      confirmation.current?.focus();
      confirmation.current?.scrollIntoView({ block: "center" });
      return;
    }
    const premierChampEnErreur = Object.keys(etat.erreurs ?? {})[0];
    if (premierChampEnErreur) {
      formulaire.current?.elements.namedItem(premierChampEnErreur)?.focus();
    }
  }, [etat]);

  // Inscription enregistrée : le formulaire laisse place à la confirmation.
  if (etat.ok) {
    return (
      <div className={styles.confirmation} ref={confirmation} tabIndex={-1} role="status">
        <span className={styles.pastille} aria-hidden="true">
          ✓
        </span>
        <h3>Bienvenue dans l&apos;Orbite{etat.prenom ? `, ${etat.prenom}` : ""} !</h3>
        <p>Votre inscription est bien enregistrée. Vous n&apos;avez rien d&apos;autre à faire.</p>
        <p className={styles.precision}>
          Pour modifier vos informations, il suffit de vous réinscrire avec le même email : votre
          fiche est mise à jour, sans doublon.
        </p>
      </div>
    );
  }

  // Retour d'une personne déjà inscrite depuis cet appareil.
  if (dejaInscrit && !modification) {
    return (
      <div className={styles.confirmation}>
        <span className={styles.pastille} aria-hidden="true">
          ✓
        </span>
        <h3>Vous êtes déjà dans l&apos;Orbite</h3>
        <p>Une inscription a été enregistrée depuis cet appareil. Vous n&apos;avez rien à refaire.</p>
        <p className={styles.precision}>
          Ce rappel n&apos;est mémorisé que sur cet appareil. Pour corriger vos informations,
          renvoyez le formulaire avec le même email : votre fiche sera mise à jour.
        </p>
        <button
          type="button"
          className={`bouton bouton-secondaire ${styles.boutonModifier}`}
          onClick={() => setModification(true)}
        >
          Modifier mes informations
        </button>
      </div>
    );
  }

  // method="post" : si la page n'a pas fini de charger, l'envoi ne met
  // jamais les données personnelles dans l'adresse de la page.
  return (
    <form ref={formulaire} method="post" className={styles.formulaire} onSubmit={soumettre}>
      {/* ---------- 1/3 — Identité ---------- */}
      <fieldset className={styles.etape}>
        <legend className={styles.legende}>
          <span className={styles.numeroEtape}>1/3</span> Identité
        </legend>

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

        <Champ nom="tel" libelle="Téléphone" erreur={erreurs.tel}>
          <input
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={30}
            placeholder="05 55 00 00 00"
            required
          />
        </Champ>
      </fieldset>

      {/* ---------- 2/3 — Études ---------- */}
      <fieldset className={styles.etape}>
        <legend className={styles.legende}>
          <span className={styles.numeroEtape}>2/3</span> Études
        </legend>

        <Champ nom="etablissement" libelle="Établissement" erreur={erreurs.etablissement}>
          <select
            defaultValue=""
            onChange={(evenement) => setEtablissement(evenement.target.value)}
            required
          >
            <option value="" disabled>
              Choisir…
            </option>
            {ETABLISSEMENTS.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
        </Champ>

        {etablissement === AUTRE && (
          <Champ
            nom="etablissement_autre"
            libelle="Nom de votre établissement"
            erreur={erreurs.etablissement_autre}
          >
            <input type="text" autoComplete="organization" maxLength={150} required />
          </Champ>
        )}

        <div className={styles.rangee}>
          <Champ nom="filiere" libelle="Filière" erreur={erreurs.filiere}>
            <input type="text" list="liste-filieres" maxLength={150} required />
          </Champ>
          <Champ nom="annee" libelle="Niveau d'études" erreur={erreurs.annee}>
            <select defaultValue="" required>
              <option value="" disabled>
                Choisir…
              </option>
              {NIVEAUX.map((groupe) => (
                <optgroup key={groupe.cycle} label={groupe.cycle}>
                  {groupe.niveaux.map((niveau) => (
                    <option key={niveau} value={niveau}>
                      {niveau}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Champ>
        </div>
        <datalist id="liste-filieres">
          {FILIERES.map((filiere) => (
            <option key={filiere} value={filiere} />
          ))}
        </datalist>
      </fieldset>

      {/* ---------- 3/3 — Envies ---------- */}
      <fieldset className={styles.etape}>
        <legend className={styles.legende}>
          <span className={styles.numeroEtape}>3/3</span> Envies
        </legend>

        {centresInteret.length > 0 && (
          <fieldset className={styles.groupe}>
            <legend>
              Centres d&apos;intérêt{" "}
              <span className={styles.facultatif}>(plusieurs choix possibles)</span>
            </legend>
            <div className={styles.puces}>
              {centresInteret.map((centre) => (
                <label key={centre.id_centre_interet} className={styles.puce}>
                  <input type="checkbox" name="centres" value={centre.id_centre_interet} />
                  <span>{centre.nom}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Champ
          nom="attentes"
          libelle="Qu'aimeriez-vous vivre avec Supernova ?"
          facultatif
          erreur={erreurs.attentes}
        >
          <textarea rows={4} maxLength={2000} />
        </Champ>

        <label className={styles.case}>
          <input type="checkbox" name="newsletter" />
          <span>
            J&apos;accepte de recevoir la newsletter de Supernova. Je peux me désinscrire à tout
            moment.
          </span>
        </label>
      </fieldset>

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
        {enCours ? "Envoi en cours…" : "Rejoindre l'Orbite"}
        {!enCours && (
          <span className="fleche" aria-hidden="true">
            →
          </span>
        )}
      </button>
    </form>
  );
}

// Un champ du formulaire : son libellé, le champ lui-même, et son éventuel
// message d'erreur. Le « name » et l'« id » sont ajoutés automatiquement.
// Également utilisé par le formulaire d'inscription à un événement.
export function Champ({ nom, libelle, facultatif = false, erreur, children }) {
  const idErreur = `${nom}-erreur`;

  return (
    <div className={styles.champ}>
      <label htmlFor={nom}>
        {libelle}
        {facultatif && <span className={styles.facultatif}> (facultatif)</span>}
      </label>
      {cloneElement(children, {
        id: nom,
        name: nom,
        "aria-invalid": erreur ? true : undefined,
        "aria-describedby": erreur ? idErreur : undefined,
      })}
      {erreur && (
        <p className={styles.erreur} id={idErreur}>
          {erreur}
        </p>
      )}
    </div>
  );
}
