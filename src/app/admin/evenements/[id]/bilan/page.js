import { Suspense } from "react";
import { enregistrerSuivi } from "@/actions/evenements";
import CadreEvenement from "@/components/admin/CadreEvenement";
import { listerMembres } from "@/services/evenements-admin";
import pageStyles from "../../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Bilan — Espace équipe",
};

const MESSAGES = { bilan: "Bilan enregistré." };
const ERREURS = {
  "bilan-trop-long": "Bilan non enregistré : un des textes est trop long (5 000 caractères au plus).",
  "responsable-refuse": "Bilan non enregistré : le responsable doit être un membre du Noyau.",
  refuse: "Seuls l'auteur du brouillon, les Head of et la direction peuvent modifier le bilan.",
};

const QUESTIONS = [
  ["ce_qui_a_marche", "Ce qui a marché", "Ce qu'on refera à l'identique."],
  ["difficultes", "Difficultés rencontrées", "Imprévus, retards, manques."],
  ["a_ameliorer", "À améliorer la prochaine fois", "Des actions concrètes, si possible."],
  ["ressources", "Liens vers les ressources", "Affiches Canva, photos, vidéos, documents… un lien par ligne."],
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
          {async ({ evenement, supabase, droits }) => {
            // Le responsable se choisit parmi les membres du Noyau.
            let membres = [];
            try {
              membres = await listerMembres(supabase);
            } catch (erreur) {
              console.error("Liste des membres indisponible :", erreur.message);
            }
            return <Bilan evenement={evenement} membres={membres} modifiable={droits.modifier} />;
          }}
        </CadreEvenement>
      </Suspense>
    </div>
  );
}

const nomComplet = (personne) => (personne ? `${personne.prenom} ${personne.nom}` : "");

function Bilan({ evenement, membres, modifiable }) {
  const suivi = evenement.suivi ?? {};
  const responsable = suivi.responsable ?? null;

  // Un responsable qui n'est plus membre reste affiché (l'historique n'est
  // pas réécrit), mais n'est plus proposé pour un autre événement.
  const choix = [...membres];
  if (responsable && !choix.some((membre) => membre.id_personne === responsable.id_personne)) {
    choix.unshift({ ...responsable, ancien: true });
  }

  return (
    <form action={enregistrerSuivi} className={`${articles.editeur} ${styles.formulaire}`}>
      <input type="hidden" name="id" value={evenement.id_evenement} />
      <p className={articles.aide}>
        Réservé à l&apos;équipe : rien de cet onglet n&apos;apparaît sur le site.
        {!modifiable && " Lecture seule : seuls l'auteur du brouillon, les Head of et la direction le modifient."}
      </p>

      <fieldset disabled={!modifiable} className={styles.champsBilan}>
        <div className={articles.champ}>
          <label htmlFor="id_responsable">
            Responsable <span className={articles.facultatif}>(facultatif)</span>
          </label>
          <select id="id_responsable" name="id_responsable" defaultValue={suivi.id_responsable ?? ""}>
            <option value="">Aucun pour l&apos;instant</option>
            {choix.map((membre) => (
              <option key={membre.id_personne} value={membre.id_personne}>
                {nomComplet(membre)}
                {membre.ancien ? " (n'est plus membre)" : ""}
              </option>
            ))}
          </select>
          <p className={articles.aide}>Un membre du Noyau, qui suit l&apos;événement de bout en bout.</p>
        </div>

        {QUESTIONS.map(([nom, libelle, aide]) => (
          <div key={nom} className={articles.champ}>
            <label htmlFor={nom}>{libelle}</label>
            <textarea id={nom} name={nom} rows={4} maxLength={5000} defaultValue={suivi[nom] ?? ""} />
            <p className={articles.aide}>{aide}</p>
          </div>
        ))}
      </fieldset>

      {modifiable && (
        <div className={articles.barreActions}>
          <div className={articles.actions}>
            <button type="submit" className="bouton">
              Enregistrer le bilan
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
