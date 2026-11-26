import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { dateLongue } from "@/lib/dates";
import { VISIBILITES } from "@/lib/validation-contact";
import { lireContact } from "@/services/contacts";
import pageStyles from "../../admin.module.css";
import articlesStyles from "@/components/admin/Articles.module.css";
import styles from "@/components/contacts/Contacts.module.css";

export const metadata = {
  title: "Contact — Espace équipe",
};

const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fiche d'un contact. Les coordonnées n'apparaissent que si la base les
// livre au compte connecté ; sinon, on indique qui détient le contact.
export default function PageContact({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement du contact…</p>}>
        <FicheContact params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const nomComplet = (personne) => (personne ? `${personne.prenom} ${personne.nom}` : null);

// « 05 55 12 34 56 » → « 0555123456 », pour le lien d'appel.
const numeroAppelable = (numero) => numero.replace(/[^\d+]/g, "");

async function FicheContact({ params, searchParams }) {
  // 1. Contrôle d'accès, avant toute lecture (redirige si refusé).
  const { supabase } = await verifierAccesAdmin();

  const { id } = await params;
  const { etat } = await searchParams;

  // 2. Lecture de la fiche (null si inexistante ou non visible).
  let contact = null;
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      contact = await lireContact(supabase, id);
    } catch (erreur) {
      console.error("Lecture d'un contact impossible :", erreur.message);
      panne = true;
    }
  }

  const retour = (
    <Link prefetch={false} href="/admin/contacts" className={articlesStyles.retour}>
      <span aria-hidden="true">←</span> Contacts
    </Link>
  );

  if (!contact) {
    return (
      <>
        <header className={pageStyles.entete}>
          <div className={pageStyles.titres}>{retour}</div>
        </header>
        <p className={pageStyles.erreur} role="alert">
          {panne
            ? "Ce contact n'a pas pu être chargé. Rechargez la page dans un instant."
            : "Ce contact n'existe pas, ou vous n'avez pas accès à sa fiche."}
        </p>
      </>
    );
  }

  const referent = nomComplet(contact.referent) ?? "son référent";
  const ajoutePar = nomComplet(contact.ajoute_par);

  return (
    <article className={styles.fiche}>
      {etat === "ajoute" && (
        <p className={styles.notification} role="status">
          Contact enregistré. Vous en êtes le référent.
        </p>
      )}
      {etat === "modifie" && (
        <p className={styles.notification} role="status">
          Modifications enregistrées.
        </p>
      )}

      <header className={styles.enteteFiche}>
        {retour}
        <h1 className={styles.nomFiche}>{contact.nom}</h1>
        {contact.organisations.length > 0 && (
          <ul className={styles.organisations}>
            {contact.organisations.map((lien) => (
              <li key={lien.organisation} className={lien.actuel ? undefined : styles.ancienne}>
                {[lien.poste, lien.organisation].filter(Boolean).join(" · ")}
                {!lien.actuel && " (ancienne)"}
              </li>
            ))}
          </ul>
        )}
        <p className={styles.badges}>
          <span className={styles.visibilite} data-visibilite={contact.visibilite}>
            {VISIBILITES[contact.visibilite]?.libelle}
          </span>
          {contact.partenaire && <span className={styles.badgePartenaire}>Partenaire</span>}
        </p>
        {contact.peutModifier && (
          <Link
            prefetch={false}
            href={`/admin/contacts/${contact.id_contact}/modifier`}
            className={`bouton bouton-secondaire ${styles.boutonModifier}`}
          >
            Modifier le contact
          </Link>
        )}
      </header>

      {/* ---------- Coordonnées ---------- */}
      <section className={styles.blocFiche} aria-labelledby="titre-coordonnees">
        <h2 id="titre-coordonnees" className={styles.titreBloc}>
          Coordonnées
        </h2>

        {contact.conditions && (
          <p className={styles.conditions}>
            <strong>Conditions :</strong> {contact.conditions}
          </p>
        )}

        {!contact.peutVoirCoordonnees ? (
          <p className={styles.coordonneesMasquees}>
            Contact détenu par <strong>{referent}</strong> : passez par lui ou elle.
          </p>
        ) : contact.coordonnees.length === 0 ? (
          <p className={styles.vide}>Aucune coordonnée enregistrée.</p>
        ) : (
          <ul className={styles.coordonnees}>
            {contact.coordonnees.map((coordonnee) => {
              const telephone = coordonnee.type === "TELEPHONE";
              return (
                <li key={coordonnee.id_coordonnee}>
                  <a
                    className={styles.coordonnee}
                    href={
                      telephone
                        ? `tel:${numeroAppelable(coordonnee.valeur)}`
                        : `mailto:${coordonnee.valeur}`
                    }
                  >
                    <span className={styles.valeurCoordonnee}>
                      <span>{coordonnee.valeur}</span>
                      {(coordonnee.libelle || coordonnee.principal) && (
                        <span className={styles.libelleCoordonnee}>
                          {coordonnee.libelle ?? "Principal"}
                        </span>
                      )}
                    </span>
                    <span className={styles.actionCoordonnee}>{telephone ? "Appeler" : "Écrire"}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------- Rencontre ---------- */}
      <section className={styles.blocFiche} aria-labelledby="titre-rencontre">
        <h2 id="titre-rencontre" className={styles.titreBloc}>
          Rencontre
        </h2>
        <dl className={styles.infos}>
          <div>
            <dt>Où</dt>
            <dd>{contact.lieu_rencontre}</dd>
          </div>
          <div>
            <dt>Quand</dt>
            <dd>{dateLongue(contact.date_rencontre)}</dd>
          </div>
          {contact.raison_rencontre && (
            <div>
              <dt>Pourquoi</dt>
              <dd className={styles.texteLibre}>{contact.raison_rencontre}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* ---------- Suivi ---------- */}
      <section className={styles.blocFiche} aria-labelledby="titre-suivi">
        <h2 id="titre-suivi" className={styles.titreBloc}>
          Suivi
        </h2>
        <dl className={styles.infos}>
          <div>
            <dt>Référent actuel</dt>
            <dd>{referent}</dd>
          </div>
          {ajoutePar && (
            <div>
              <dt>Ajouté par</dt>
              <dd>{ajoutePar}</dd>
            </div>
          )}
        </dl>
      </section>

      {contact.notes && (
        <section className={styles.blocFiche} aria-labelledby="titre-notes">
          <h2 id="titre-notes" className={styles.titreBloc}>
            Notes
          </h2>
          <p className={styles.texteLibre}>{contact.notes}</p>
        </section>
      )}
    </article>
  );
}
