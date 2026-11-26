"use client";

import { useDeferredValue, useState } from "react";
import { changerStatutInscription } from "@/actions/evenements";
import { dateCourte } from "@/lib/dates";
import { STATUTS_INSCRIPTION } from "@/lib/evenements";
import articles from "./Articles.module.css";
import styles from "./Evenements.module.css";

// Sans accents ni majuscules : « Éva » se trouve en tapant « eva ».
const normaliser = (texte) =>
  String(texte ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Liste des inscrits avec recherche instantanée (nom, prénom, email ou
// téléphone) : à l'entrée de la salle, on trouve une personne en trois
// lettres, puis on la pointe d'un geste.
export default function ListeInscrits({ idEvenement, inscriptions }) {
  const [recherche, setRecherche] = useState("");
  const termes = normaliser(useDeferredValue(recherche)).split(/\s+/).filter(Boolean);

  const visibles = inscriptions.filter((inscription) => {
    const { prenom, nom, email, tel } = inscription.personne ?? {};
    const texte = normaliser(`${prenom} ${nom} ${email} ${tel ?? ""}`);
    return termes.every((terme) => texte.includes(terme));
  });

  if (inscriptions.length === 0) {
    return <p className={styles.vide}>Personne pour le moment. Les inscriptions en ligne apparaîtront ici.</p>;
  }

  return (
    <div className={styles.listeInscrits}>
      <label className={styles.recherche}>
        <span className="lecteur-ecran">Rechercher une personne</span>
        <input
          type="search"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Nom, email ou téléphone"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>

      <p className={styles.resultat} role="status">
        {termes.length > 0 &&
          (visibles.length === 0
            ? "Personne ne correspond. Ajoutez-la ci-dessous si elle est présente."
            : `${visibles.length} personne${visibles.length > 1 ? "s" : ""} sur ${inscriptions.length}`)}
      </p>

      <ul className={articles.liste}>
        {visibles.map((inscription) => (
          <li
            key={inscription.id_inscription}
            id={`ligne-${inscription.id_inscription}`}
            className={`${articles.ligne} ${styles.ligneInscrit}`}
          >
            <div className={styles.identite}>
              <h3 className={articles.titreLigne}>
                {inscription.personne?.prenom} {inscription.personne?.nom}
              </h3>
              <p className={styles.contact}>
                <a href={`mailto:${inscription.personne?.email}`}>{inscription.personne?.email}</a>
                {inscription.personne?.tel && (
                  <a href={`tel:${inscription.personne.tel.replace(/[^0-9+]/g, "")}`}>
                    {inscription.personne.tel}
                  </a>
                )}
              </p>
              <p className={styles.origine}>
                {inscription.origine === "EQUIPE" ? "Ajouté par l'équipe" : "Inscrit en ligne"} le{" "}
                {dateCourte(inscription.created_at)}
              </p>
            </div>

            <form action={changerStatutInscription} className={styles.pointage}>
              <input type="hidden" name="id" value={idEvenement} />
              <input type="hidden" name="id_inscription" value={inscription.id_inscription} />
              <fieldset>
                <legend className="lecteur-ecran">
                  Statut de {inscription.personne?.prenom} {inscription.personne?.nom}
                </legend>
                {Object.entries(STATUTS_INSCRIPTION).map(([statut, libelle]) => (
                  <button
                    key={statut}
                    type="submit"
                    name="statut"
                    value={statut}
                    data-statut={statut}
                    aria-pressed={inscription.statut === statut}
                    disabled={inscription.statut === statut}
                  >
                    {libelle}
                  </button>
                ))}
              </fieldset>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
