import { Suspense } from "react";
import { enregistrerSuivi } from "@/actions/evenements";
import CadreEvenement from "@/components/admin/CadreEvenement";
import pageStyles from "../../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Bilan — Espace équipe",
};

const MESSAGES = { bilan: "Bilan enregistré." };
const ERREURS = {
  "bilan-trop-long": "Bilan non enregistré : un des textes est trop long (5 000 caractères au plus).",
};

const QUESTIONS = [
  ["ce_qui_a_marche", "Ce qui a marché", "Ce qu'on refera à l'identique."],
  ["difficultes", "Difficultés rencontrées", "Imprévus, retards, manques."],
  ["a_ameliorer", "À améliorer la prochaine fois", "Des actions concrètes, si possible."],
  ["ressources", "Liens vers les ressources", "Photos, documents, tableaux… un lien par ligne."],
];

// Onglet « Bilan » : responsable et retour d'expérience. Réservé à
// l'équipe : rien de cet onglet n'apparaît sur le site.
export default function PageBilan({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement du bilan…</p>}>
        <CadreEvenement
          params={params}
          searchParams={searchParams}
          onglet="bilan"
          messages={MESSAGES}
          erreurs={ERREURS}
        >
          {({ evenement }) => <Bilan evenement={evenement} />}
        </CadreEvenement>
      </Suspense>
    </div>
  );
}

function Bilan({ evenement }) {
  const suivi = evenement.suivi ?? {};

  return (
    <form action={enregistrerSuivi} className={`${articles.editeur} ${styles.formulaire}`}>
      <input type="hidden" name="id" value={evenement.id_evenement} />
      <p className={articles.aide}>Réservé à l&apos;équipe : rien de cet onglet n&apos;apparaît sur le site.</p>

      <div className={articles.champ}>
        <label htmlFor="responsable">
          Responsable <span className={articles.facultatif}>(facultatif)</span>
        </label>
        <input
          id="responsable"
          name="responsable"
          type="text"
          maxLength={150}
          defaultValue={suivi.responsable ?? ""}
          placeholder="Prénom et nom"
        />
      </div>

      {QUESTIONS.map(([nom, libelle, aide]) => (
        <div key={nom} className={articles.champ}>
          <label htmlFor={nom}>{libelle}</label>
          <textarea id={nom} name={nom} rows={4} maxLength={5000} defaultValue={suivi[nom] ?? ""} />
          <p className={articles.aide}>{aide}</p>
        </div>
      ))}

      <div className={articles.barreActions}>
        <div className={articles.actions}>
          <button type="submit" className="bouton">
            Enregistrer le bilan
          </button>
        </div>
      </div>
    </form>
  );
}
