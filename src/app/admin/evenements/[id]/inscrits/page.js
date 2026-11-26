import { Suspense } from "react";
import Link from "next/link";
import { ajouterParticipant, changerStatutInscription } from "@/actions/evenements";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { dateCourte } from "@/lib/dates";
import { STATUTS_INSCRIPTION } from "@/lib/evenements";
import { FORMAT_UUID } from "@/lib/validation";
import { lireEvenement, listerInscriptions } from "@/services/evenements-admin";
import pageStyles from "../../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Inscrits — Espace équipe",
};

const NOTIFICATIONS = {
  pointe: "Statut enregistré.",
  ajoute: "Personne ajoutée à la liste.",
};
const ERREURS = {
  echec: "L'opération a échoué. Réessayez dans un instant.",
  "ajout-invalide": "Personne non ajoutée : vérifiez le prénom, le nom, l'email et le téléphone.",
};

// Les inscrits d'un événement, et le pointage le jour J (pensé pour le
// téléphone : un bouton par statut sur chaque ligne). On peut aussi
// ajouter une personne présente sans inscription préalable.
export default function PageInscrits({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des inscrits…</p>}>
        <Inscrits params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inscrits({ params, searchParams }) {
  const { supabase } = await verifierAccesAdmin();
  const { id } = await params;
  const { etat } = await searchParams;

  let evenement = null;
  let inscriptions = [];
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      [evenement, inscriptions] = await Promise.all([
        lireEvenement(supabase, id),
        listerInscriptions(supabase, id),
      ]);
    } catch (erreur) {
      console.error("Lecture des inscrits impossible :", erreur.message);
      panne = true;
    }
  }

  const entete = (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link prefetch={false} href={`/admin/evenements/${id}`} className={articles.retour}>
          <span aria-hidden="true">←</span> {evenement?.titre ?? "Événement"}
        </Link>
        <h1 className={pageStyles.titre}>Inscrits et pointage</h1>
      </div>
    </header>
  );

  if (!evenement) {
    return (
      <>
        {entete}
        <p className={pageStyles.erreur} role="alert">
          {panne
            ? "La liste n'a pas pu être chargée. Rechargez la page dans un instant."
            : "Cet événement n'existe pas."}
        </p>
      </>
    );
  }

  const compte = (statut) => inscriptions.filter((inscription) => inscription.statut === statut).length;

  return (
    <>
      {entete}

      {NOTIFICATIONS[etat] && (
        <p className={articles.notification} role="status">
          {NOTIFICATIONS[etat]}
        </p>
      )}
      {ERREURS[etat] && (
        <p className={`${articles.notification} ${articles.notificationErreur}`} role="alert">
          {ERREURS[etat]}
        </p>
      )}

      <p className={styles.compteurs}>
        <span>
          <strong>{inscriptions.length}</strong> au total
        </span>
        {Object.entries(STATUTS_INSCRIPTION).map(([statut, libelle]) => (
          <span key={statut}>
            <strong>{compte(statut)}</strong> {libelle.toLowerCase()}
            {compte(statut) > 1 ? "s" : ""}
          </span>
        ))}
      </p>

      {inscriptions.length === 0 ? (
        <p className={pageStyles.vide}>Personne pour le moment.</p>
      ) : (
        <ul className={articles.liste}>
          {inscriptions.map((inscription) => (
            <li
              key={inscription.id_inscription}
              id={`ligne-${inscription.id_inscription}`}
              className={`${articles.ligne} ${styles.ligneInscrit}`}
            >
              <h2 className={articles.titreLigne}>
                {inscription.personne?.prenom} {inscription.personne?.nom}
              </h2>
              <p className={styles.contact}>
                <a href={`mailto:${inscription.personne?.email}`}>{inscription.personne?.email}</a>
                {inscription.personne?.tel && (
                  <a href={`tel:${inscription.personne.tel.replace(/[^0-9+]/g, "")}`}>
                    {inscription.personne.tel}
                  </a>
                )}
                <span>
                  {inscription.origine === "EQUIPE" ? "Ajouté par l'équipe" : "Inscrit en ligne"} le{" "}
                  {dateCourte(inscription.created_at)}
                </span>
              </p>
              <form action={changerStatutInscription} className={styles.pointage}>
                <input type="hidden" name="id" value={evenement.id_evenement} />
                <input type="hidden" name="id_inscription" value={inscription.id_inscription} />
                {Object.entries(STATUTS_INSCRIPTION).map(([statut, libelle]) => (
                  <button
                    key={statut}
                    type="submit"
                    name="statut"
                    value={statut}
                    aria-pressed={inscription.statut === statut}
                    disabled={inscription.statut === statut}
                  >
                    {libelle}
                  </button>
                ))}
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Ajouter une personne ---------- */}
      <section className={styles.section} aria-labelledby="titre-ajout">
        <h2 id="titre-ajout" className="annotation annotation-section">
          Ajouter une personne
        </h2>
        <p className={articles.aide}>
          Par exemple, une personne présente sans s&apos;être inscrite. Si son email est déjà connu,
          sa fiche est réutilisée telle quelle (elle n&apos;est jamais modifiée).
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
              <input id="email" name="email" type="email" inputMode="email" maxLength={254} autoComplete="off" required />
            </div>
            <div className={articles.champ}>
              <label htmlFor="tel">
                Téléphone <span className={articles.facultatif}>(facultatif)</span>
              </label>
              <input id="tel" name="tel" type="tel" inputMode="tel" maxLength={30} autoComplete="off" />
            </div>
          </div>
          <div className={articles.champ}>
            <label htmlFor="statut">Statut</label>
            <select id="statut" name="statut" defaultValue="PRESENT">
              <option value="PRESENT">Présent (sans inscription préalable)</option>
              <option value="INSCRIT">Inscrit</option>
            </select>
          </div>
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
