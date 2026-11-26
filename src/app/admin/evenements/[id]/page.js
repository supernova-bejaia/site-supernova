import { Suspense } from "react";
import { changerStatutEvenement } from "@/actions/evenements";
import CadreEvenement from "@/components/admin/CadreEvenement";
import FormulaireConfirme from "@/components/admin/FormulaireConfirme";
import FormulaireEvenement from "@/components/admin/FormulaireEvenement";
import { dateEnLettres } from "@/lib/dates";
import pageStyles from "../../admin.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Événement — Espace équipe",
};

const MESSAGES = {
  cree: "Événement créé en brouillon. Complétez-le, ajoutez des photos, puis publiez-le.",
  enregistre: "Modifications enregistrées.",
  "statut-publie": "L'événement est en ligne.",
  "statut-brouillon": "L'événement est repassé en brouillon : il n'est plus visible du public.",
  "statut-annule": "L'événement est annulé.",
  "statut-termine": "L'événement est terminé : il est classé dans les archives du site.",
};

// Ce que signifie chaque statut, et les changements proposés.
const STATUTS = {
  BROUILLON: {
    explication: () => "Invisible du public. Publiez-le quand les informations sont prêtes.",
    actions: ["PUBLIE"],
  },
  PUBLIE: {
    explication: (e) =>
      `Visible sur le site depuis le ${dateEnLettres(e.published_at)}.${
        e.inscription_requise && !e.lien_inscription ? " Les inscriptions sont ouvertes jusqu'à la fin de l'événement." : ""
      }`,
    actions: ["TERMINE", "BROUILLON", "ANNULE"],
  },
  ANNULE: {
    explication: () =>
      "Affiché sur le site avec la mention « Annulé ». Les inscriptions sont fermées.",
    actions: ["PUBLIE", "BROUILLON"],
  },
  TERMINE: {
    explication: () => "Classé dans les archives du site. Pensez à remplir le bilan.",
    actions: ["PUBLIE", "BROUILLON"],
  },
};

const ACTIONS = {
  PUBLIE: { libelle: "Publier", confirmation: "Publier cet événement sur le site ?" },
  TERMINE: { libelle: "Marquer comme terminé", confirmation: "Classer cet événement dans les archives ?" },
  BROUILLON: {
    libelle: "Repasser en brouillon",
    confirmation: "Retirer cet événement du site ? Il redeviendra un brouillon.",
  },
  ANNULE: {
    libelle: "Annuler l'événement",
    confirmation:
      "Annuler cet événement ? Il restera affiché avec la mention « Annulé » et les inscriptions seront fermées. Pensez à prévenir les inscrits.",
  },
};

// Onglet « Informations » : le statut, puis le formulaire de l'événement.
export default function PageEvenementAdmin({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement de l&apos;événement…</p>}>
        <CadreEvenement params={params} searchParams={searchParams} onglet="informations" messages={MESSAGES}>
          {({ evenement }) => (
            <>
              <CarteStatut evenement={evenement} />
              {/* « key » : après un enregistrement, le formulaire repart des données à jour. */}
              <FormulaireEvenement key={evenement.updated_at} evenement={evenement} />
            </>
          )}
        </CadreEvenement>
      </Suspense>
    </div>
  );
}

function CarteStatut({ evenement }) {
  const { explication, actions } = STATUTS[evenement.statut];

  return (
    <section className={styles.carteStatut} aria-labelledby="titre-statut">
      <div className={styles.texteStatut}>
        <h2 id="titre-statut" className="annotation">
          Publication
        </h2>
        <p>{explication(evenement)}</p>
      </div>
      <div className={styles.groupeBoutons}>
        {actions.map((statut) => (
          <FormulaireConfirme
            key={statut}
            action={changerStatutEvenement}
            message={ACTIONS[statut].confirmation}
          >
            <input type="hidden" name="id" value={evenement.id_evenement} />
            <input type="hidden" name="statut" value={statut} />
            <button
              type="submit"
              className={
                statut === "ANNULE"
                  ? `${styles.lienBouton} ${styles.lienBoutonDanger}`
                  : // Seule la publication est mise en avant.
                    `bouton ${statut === "PUBLIE" ? "" : "bouton-secondaire"} ${styles.boutonCompact}`
              }
            >
              {ACTIONS[statut].libelle}
            </button>
          </FormulaireConfirme>
        ))}
      </div>
    </section>
  );
}
