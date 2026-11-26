"use client";

import {
  cloneElement,
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ajouterContact, modifierContact } from "@/actions/contacts";
import {
  NOMBRE_MAX_COORDONNEES,
  NOMBRE_MAX_ORGANISATIONS,
  normaliserNom,
  VISIBILITE_PAR_DEFAUT,
  VISIBILITES,
} from "@/lib/validation-contact";
import styles from "./Contacts.module.css";

const ETAT_INITIAL = { ok: false, message: "", erreurs: {} };

// Formulaire d'un contact, pensé pour le téléphone.
//
// Ajout (sans « contact ») : on le remplit juste après une rencontre, en
// moins d'une minute. L'essentiel d'abord (nom, organisation, poste, lieu,
// date, visibilité) ; le reste est replié dans « Plus de détails ».
//
// Modification (« contact » fourni) : mêmes champs, pré-remplis, avec la
// liste complète des organisations. Ce que seul le référent décide
// (visibilité, conditions) et les coordonnées qu'on n'a pas le droit de
// gérer sont affichés en lecture seule ; la base le vérifie de toute façon.
//
//   organisations  : noms déjà saisis, proposés pendant la frappe
//   contactsConnus : [{ id, nom }] pour signaler un contact du même nom
//   aujourdhui     : date du jour (AAAA-MM-JJ), à l'heure de Béjaïa
export default function FormulaireContact({ contact = null, organisations, contactsConnus = [], aujourdhui }) {
  const modification = Boolean(contact);
  const [etat, envoyer, enCours] = useActionState(
    modification ? modifierContact : ajouterContact,
    ETAT_INITIAL
  );

  const [nom, setNom] = useState(contact?.nom ?? "");
  const [sansOrganisation, setSansOrganisation] = useState(false);
  const [lignesOrganisation, setLignesOrganisation] = useState(
    contact?.organisations.length ? contact.organisations : [{ organisation: "", poste: "", actuel: true }]
  );
  const [visibilite, setVisibilite] = useState(contact?.visibilite ?? VISIBILITE_PAR_DEFAUT);
  const [telephones, setTelephones] = useState(contact?.telephones.length ? contact.telephones : [""]);
  const [emails, setEmails] = useState(contact?.emails.length ? contact.emails : [""]);
  const [details, setDetails] = useState(modification);
  const formulaire = useRef(null);
  const idListe = useId();

  const erreurs = etat.erreurs ?? {};
  const decideVisibilite = !modification || contact.estReferent;
  const gereCoordonnees = !modification || contact.peutModifierCoordonnees;

  // Un autre contact du même nom existe déjà (parmi ceux que l'on voit) ?
  const nomNormalise = normaliserNom(nom);
  const doublon =
    nomNormalise.length >= 3
      ? contactsConnus.find(
          (connu) => connu.id !== contact?.id && normaliserNom(connu.nom) === nomNormalise
        )
      : null;

  // Une erreur dans un champ replié : on déplie « Plus de détails ».
  const [etatVu, setEtatVu] = useState(etat);
  if (etat !== etatVu) {
    setEtatVu(etat);
    const champsReplies = ["raison_rencontre", "conditions", "notes", "telephone", "email"];
    if (Object.keys(etat.erreurs ?? {}).some((champ) => champsReplies.includes(champ))) {
      setDetails(true);
    }
  }

  // Après une réponse en erreur : on amène la personne au premier champ.
  useEffect(() => {
    const premier = Object.keys(etat.erreurs ?? {})[0];
    if (!premier) return;
    const champ = formulaire.current?.elements.namedItem(premier);
    (champ instanceof RadioNodeList ? champ[0] : champ)?.focus();
  }, [etat]);

  function soumettre(evenement) {
    // On envoie nous-mêmes les données : le formulaire garde la saisie si
    // le serveur signale une erreur.
    evenement.preventDefault();
    if (enCours) return;
    const donnees = new FormData(evenement.currentTarget);
    startTransition(() => envoyer(donnees));
  }

  const suggestions = (
    <datalist id={idListe}>
      {organisations.map((nomOrganisation) => (
        <option key={nomOrganisation} value={nomOrganisation} />
      ))}
    </datalist>
  );

  return (
    <form ref={formulaire} className={styles.formulaire} onSubmit={soumettre} noValidate>
      {modification && <input type="hidden" name="id" value={contact.id} />}

      {/* ---------- L'essentiel ---------- */}
      <Champ nom="nom" libelle="Nom" erreur={erreurs.nom}>
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={150}
          value={nom}
          onChange={(evenement) => setNom(evenement.target.value)}
          required
        />
      </Champ>
      {doublon && (
        <p className={styles.avertissement} role="status">
          Un contact du même nom existe déjà.{" "}
          <Link prefetch={false} href={`/admin/contacts/${doublon.id}`}>
            Voir sa fiche
          </Link>
        </p>
      )}

      {suggestions}

      {modification ? (
        <Organisations
          lignes={lignesOrganisation}
          setLignes={setLignesOrganisation}
          idListe={idListe}
          erreur={erreurs.org_organisation}
        />
      ) : (
        <>
          <label className={styles.caseACocher}>
            <input
              type="checkbox"
              name="sans_organisation"
              checked={sansOrganisation}
              onChange={(evenement) => setSansOrganisation(evenement.target.checked)}
            />
            Sans organisation (indépendant, étudiant…)
          </label>

          {!sansOrganisation && (
            <div className={styles.rangee}>
              <Champ
                nom="organisation"
                libelle="Organisation"
                erreur={erreurs.organisation}
                aide={organisations.length > 0 ? "Les organisations déjà saisies sont proposées." : null}
              >
                <input type="text" autoComplete="off" maxLength={150} list={idListe} required />
              </Champ>
              <Champ nom="poste" libelle="Poste" erreur={erreurs.poste}>
                <input type="text" autoComplete="off" maxLength={150} required />
              </Champ>
            </div>
          )}
        </>
      )}

      <div className={styles.rangee}>
        <Champ nom="lieu_rencontre" libelle="Rencontré à" erreur={erreurs.lieu_rencontre}>
          <input
            type="text"
            autoComplete="off"
            maxLength={200}
            placeholder="Salon, forum, conférence…"
            defaultValue={contact?.lieu_rencontre}
            required
          />
        </Champ>
        <Champ nom="date_rencontre" libelle="Le" erreur={erreurs.date_rencontre}>
          <input
            type="date"
            defaultValue={contact?.date_rencontre ?? aujourdhui}
            max={aujourdhui}
            required
          />
        </Champ>
      </div>

      <fieldset
        className={styles.visibilites}
        data-invalide={erreurs.visibilite ? "true" : undefined}
        disabled={!decideVisibilite}
      >
        <legend className={styles.libelle}>Qui peut voir ce contact ?</legend>
        <div className={styles.choix}>
          {Object.entries(VISIBILITES).map(([valeur, { libelle }]) => (
            <label key={valeur} className={styles.option}>
              <input
                type="radio"
                name="visibilite"
                value={valeur}
                checked={visibilite === valeur}
                onChange={() => setVisibilite(valeur)}
              />
              <span>{libelle}</span>
            </label>
          ))}
        </div>
        <p className={styles.aide}>
          {decideVisibilite
            ? VISIBILITES[visibilite].explication
            : "Seul le référent de ce contact peut changer qui le voit."}
        </p>
        {erreurs.visibilite && <p className={styles.erreur}>{erreurs.visibilite}</p>}
      </fieldset>

      {/* ---------- Plus de détails (facultatif) ---------- */}
      <details
        className={styles.details}
        open={details}
        onToggle={(evenement) => setDetails(evenement.currentTarget.open)}
      >
        <summary>Plus de détails (facultatif)</summary>

        <div className={styles.contenuDetails}>
          {gereCoordonnees ? (
            <>
              <ListeSaisie
                nom="telephone"
                libelle="Téléphones"
                type="tel"
                valeurs={telephones}
                setValeurs={setTelephones}
                ajouter="Ajouter un numéro"
                erreur={erreurs.telephone}
              />
              <ListeSaisie
                nom="email"
                libelle="Emails"
                type="email"
                valeurs={emails}
                setValeurs={setEmails}
                ajouter="Ajouter un email"
                erreur={erreurs.email}
              />
            </>
          ) : (
            <p className={styles.coordonneesMasquees}>
              Les coordonnées de ce contact sont gérées par son référent.
            </p>
          )}

          <Champ nom="raison_rencontre" libelle="Pourquoi on l'a rencontré" erreur={erreurs.raison_rencontre}>
            <textarea rows={3} maxLength={1000} defaultValue={contact?.raison_rencontre ?? ""} />
          </Champ>

          <Champ
            nom="conditions"
            libelle="Conditions d'usage des coordonnées"
            erreur={erreurs.conditions}
            aide={
              decideVisibilite
                ? "Par exemple : « ne pas appeler sans son accord »."
                : "Seul le référent change les conditions."
            }
          >
            <textarea
              rows={2}
              maxLength={1000}
              defaultValue={contact?.conditions ?? ""}
              disabled={!decideVisibilite}
            />
          </Champ>

          <Champ
            nom="notes"
            libelle="Notes"
            erreur={erreurs.notes}
            aide="Jamais de numéro ni d'email ici : les notes ne sont pas protégées comme les coordonnées."
          >
            <textarea rows={4} maxLength={5000} defaultValue={contact?.notes ?? ""} />
          </Champ>

          <label className={styles.caseACocher}>
            <input type="checkbox" name="partenaire" defaultChecked={contact?.partenaire} />
            Partenaire (relation durable avec Supernova)
          </label>
        </div>
      </details>

      {/* ---------- Enregistrer ---------- */}
      <div className={styles.barreActions}>
        <p className={styles.message} role="alert">
          {etat.message}
        </p>
        <button type="submit" className="bouton" disabled={enCours}>
          {enCours
            ? "Enregistrement…"
            : modification
              ? "Enregistrer les modifications"
              : "Enregistrer le contact"}
        </button>
        {modification && (
          <Link prefetch={false} href={`/admin/contacts/${contact.id}`} className={styles.annuler}>
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}

// Un champ : libellé, champ (l'enfant reçoit id et name), aide et erreur.
function Champ({ nom, libelle, aide, erreur, children }) {
  const enfant = cloneElement(children, { id: nom, name: nom });
  return (
    <div className={styles.champ} data-invalide={erreur ? "true" : undefined}>
      <label htmlFor={nom} className={styles.libelle}>
        {libelle}
      </label>
      {enfant}
      {aide && <p className={styles.aide}>{aide}</p>}
      {erreur && <p className={styles.erreur}>{erreur}</p>}
    </div>
  );
}

// Les organisations d'un contact (modification) : une ligne par
// organisation, la première est la principale. « Ne travaille plus là »
// garde la trace d'une ancienne organisation.
function Organisations({ lignes, setLignes, idListe, erreur }) {
  const modifier = (index, champ, valeur) =>
    setLignes(lignes.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne)));
  const retirer = (index) => setLignes(lignes.filter((_, i) => i !== index));

  return (
    <fieldset className={styles.champ} data-invalide={erreur ? "true" : undefined}>
      <legend className={styles.libelle}>Organisations</legend>
      <p className={styles.aide}>La première est l&apos;organisation principale. Videz tout pour « sans organisation ».</p>
      {lignes.map((ligne, index) => (
        <div key={index} className={styles.blocOrganisation}>
          <div className={styles.rangee}>
            <input
              type="text"
              name="org_organisation"
              value={ligne.organisation}
              onChange={(evenement) => modifier(index, "organisation", evenement.target.value)}
              list={idListe}
              autoComplete="off"
              maxLength={150}
              placeholder="Organisation"
              aria-label={`Organisation ${index + 1}`}
            />
            <input
              type="text"
              name="org_poste"
              value={ligne.poste ?? ""}
              onChange={(evenement) => modifier(index, "poste", evenement.target.value)}
              autoComplete="off"
              maxLength={150}
              placeholder="Poste"
              aria-label={`Poste ${index + 1}`}
            />
          </div>
          <div className={styles.ligneSaisie}>
            <label className={styles.caseACocher}>
              <input
                type="checkbox"
                name="org_ancienne"
                value={String(index)}
                checked={!ligne.actuel}
                onChange={(evenement) => modifier(index, "actuel", !evenement.target.checked)}
              />
              Ne travaille plus là
            </label>
            {lignes.length > 1 && (
              <button type="button" className={styles.boutonRetirer} onClick={() => retirer(index)}>
                Retirer
              </button>
            )}
          </div>
        </div>
      ))}
      {lignes.length < NOMBRE_MAX_ORGANISATIONS && (
        <button
          type="button"
          className={styles.boutonAjouter}
          onClick={() => setLignes([...lignes, { organisation: "", poste: "", actuel: true }])}
        >
          + Ajouter une organisation
        </button>
      )}
      {erreur && <p className={styles.erreur}>{erreur}</p>}
    </fieldset>
  );
}

// Plusieurs valeurs du même type (téléphones, emails), une par ligne.
// La première est la principale.
function ListeSaisie({ nom, libelle, type, valeurs, setValeurs, ajouter, erreur }) {
  const modifier = (index, valeur) =>
    setValeurs(valeurs.map((ancienne, i) => (i === index ? valeur : ancienne)));
  const retirer = (index) => setValeurs(valeurs.filter((_, i) => i !== index));

  return (
    <fieldset className={styles.champ} data-invalide={erreur ? "true" : undefined}>
      <legend className={styles.libelle}>{libelle}</legend>
      {valeurs.map((valeur, index) => (
        <div key={index} className={styles.ligneSaisie}>
          <input
            type={type}
            name={nom}
            value={valeur}
            onChange={(evenement) => modifier(index, evenement.target.value)}
            inputMode={type === "tel" ? "tel" : "email"}
            autoComplete="off"
            maxLength={type === "tel" ? 30 : 254}
            aria-label={index === 0 ? `${libelle} (principal)` : `${libelle} ${index + 1}`}
          />
          {valeurs.length > 1 && (
            <button type="button" className={styles.boutonRetirer} onClick={() => retirer(index)}>
              Retirer
            </button>
          )}
        </div>
      ))}
      {valeurs.length < NOMBRE_MAX_COORDONNEES && (
        <button type="button" className={styles.boutonAjouter} onClick={() => setValeurs([...valeurs, ""])}>
          + {ajouter}
        </button>
      )}
      {erreur && <p className={styles.erreur}>{erreur}</p>}
    </fieldset>
  );
}
