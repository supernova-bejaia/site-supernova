import { Suspense } from "react";
import { ajouterParticipant } from "@/actions/evenements";
import CadreEvenement from "@/components/admin/CadreEvenement";
import Indicateur from "@/components/admin/Indicateur";
import ListeInscrits from "@/components/admin/ListeInscrits";
import { listerCoordonneesInscrits, listerInscriptions } from "@/services/evenements-admin";
import pageStyles from "../../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Inscrits — Espace équipe",
};

const MESSAGES = {
  pointe: "Statut enregistré.",
  ajoute: "Personne ajoutée à la liste.",
};
const ERREURS = {
  "ajout-invalide": "Personne non ajoutée : vérifiez le prénom, le nom, l'email et le téléphone.",
};

// Onglet « Inscrits » : les chiffres, la liste avec recherche et pointage
// (pensée pour le téléphone, à l'entrée de la salle), puis l'ajout d'une
// personne présente sans inscription préalable.
export default function PageInscrits({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des inscrits…</p>}>
        <CadreEvenement
          params={params}
          searchParams={searchParams}
          onglet="inscrits"
          messages={MESSAGES}
          erreurs={ERREURS}
        >
          {async ({ evenement, supabase, droits }) => {
            let inscriptions;
            try {
              inscriptions = await listerInscriptions(supabase, evenement.id_evenement);
              // Email et téléphone : seulement pour la direction.
              if (droits.voirCoordonnees) {
                const coordonnees = await listerCoordonneesInscrits(supabase, evenement.id_evenement);
                inscriptions = inscriptions.map((inscription) => ({
                  ...inscription,
                  personne: {
                    ...inscription.personne,
                    ...coordonnees.get(inscription.personne?.id_personne),
                  },
                }));
              }
            } catch (erreur) {
              console.error("Lecture des inscrits impossible :", erreur.message);
              return (
                <p className={pageStyles.erreur} role="alert">
                  La liste n&apos;a pas pu être chargée. Rechargez la page dans un instant.
                </p>
              );
            }
            return <Inscrits evenement={evenement} inscriptions={inscriptions} />;
          }}
        </CadreEvenement>
      </Suspense>
    </div>
  );
}

function Inscrits({ evenement, inscriptions }) {
  const compte = (statut) => inscriptions.filter((inscription) => inscription.statut === statut).length;
  const attendus = compte("INSCRIT") + compte("PRESENT");

  return (
    <>
      <div className={pageStyles.grilleIndicateurs}>
        <Indicateur libelle="Présents" valeur={compte("PRESENT")} precision={`sur ${attendus} attendus`} accent />
        <Indicateur libelle="Inscrits" valeur={compte("INSCRIT")} precision="Pas encore pointés" />
        <Indicateur libelle="Absents" valeur={compte("ABSENT")} />
        <Indicateur libelle="Désistés" valeur={compte("DESISTE")} />
      </div>

      <section className={styles.sectionInscrits} aria-labelledby="titre-liste">
        <h2 id="titre-liste" className="annotation annotation-section">
          Liste et pointage
        </h2>
        <ListeInscrits idEvenement={evenement.id_evenement} inscriptions={inscriptions} />
      </section>

      <section id="ajout" className={styles.carte} aria-labelledby="titre-ajout">
        <h2 id="titre-ajout" className="annotation annotation-section">
          Ajouter une personne
        </h2>
        <p className={articles.aide}>
          Une personne présente sans s&apos;être inscrite, ou inscrite par téléphone. Si son email
          est déjà connu, sa fiche est reprise telle quelle (elle n&apos;est jamais modifiée).
        </p>
        <form action={ajouterParticipant} className={`${articles.bloc} ${styles.formulaire}`}>
          <input type="hidden" name="id" value={evenement.id_evenement} />
          <div className={styles.deuxColonnes}>
            <div className={articles.champ}>
              <label htmlFor="prenom">Prénom</label>
              <input id="prenom" name="prenom" type="text" maxLength={100} autoComplete="off" required />
            </div>
            <div className={articles.champ}>
              <label htmlFor="nom">Nom</label>
              <input id="nom" name="nom" type="text" maxLength={100} autoComplete="off" required />
            </div>
          </div>
          <div className={styles.deuxColonnes}>
            <div className={articles.champ}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                maxLength={254}
                autoComplete="off"
                required
              />
            </div>
            <div className={articles.champ}>
              <label htmlFor="tel">
                Téléphone <span className={articles.facultatif}>(facultatif)</span>
              </label>
              <input id="tel" name="tel" type="tel" inputMode="tel" maxLength={30} autoComplete="off" />
            </div>
          </div>
          <fieldset className={styles.choix}>
            <legend>Statut</legend>
            <label className={articles.case}>
              <input type="radio" name="statut" value="PRESENT" defaultChecked />
              <span>Présent (sans inscription préalable)</span>
            </label>
            <label className={articles.case}>
              <input type="radio" name="statut" value="INSCRIT" />
              <span>Inscrit</span>
            </label>
          </fieldset>
          <div>
            <button type="submit" className="bouton">
              Ajouter
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
