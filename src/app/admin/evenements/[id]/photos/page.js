import { Suspense } from "react";
import Image from "next/image";
import { agirSurPhoto, ajouterPhoto } from "@/actions/evenements";
import CadreEvenement from "@/components/admin/CadreEvenement";
import FormulaireConfirme from "@/components/admin/FormulaireConfirme";
import { adressePhoto } from "@/lib/evenements";
import pageStyles from "../../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Photos — Espace équipe",
};

const MESSAGES = {
  "photo-ajoutee": "Photo ajoutée. Validez-la pour qu'elle apparaisse sur le site.",
  "photo-valider": "Photo validée : elle est visible sur le site.",
  "photo-masquer": "Photo masquée : elle n'est plus visible sur le site.",
  "photo-couverture": "Photo de couverture changée.",
  "photo-supprimer": "Photo supprimée.",
};

const ERREURS = {
  "photo-manquante": "Choisissez une photo à envoyer.",
  "photo-sans-description": "Décrivez la photo (champ « Description ») : c'est obligatoire.",
  "photo-refusee": "Photo refusée : JPEG, PNG ou WebP de 2 Mo au plus, légende et crédit courts.",
  refuse: "La validation des photos est réservée aux Head of et à la direction.",
};

// Onglet « Photos » : envoi, validation, couverture, suppression.
export default function PagePhotos({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des photos…</p>}>
        <CadreEvenement
          params={params}
          searchParams={searchParams}
          onglet="photos"
          messages={MESSAGES}
          erreurs={ERREURS}
        >
          {({ evenement, droits }) => <Photos evenement={evenement} droits={droits} />}
        </CadreEvenement>
      </Suspense>
    </div>
  );
}

// Tout membre envoie des photos ; un Head of ou la direction les valide,
// choisit la couverture et les supprime.
function Photos({ evenement, droits }) {
  const aValider = evenement.photos.filter((photo) => !photo.validee).length;

  return (
    <>
      <p className={articles.aide}>
        Une photo ajoutée reste invisible du public tant qu&apos;elle n&apos;est pas validée.
        Ne validez que des photos dont la diffusion est acceptée (personnes reconnaissables,
        partenaires, lieu).
        {aValider > 0 && (
          <strong className={styles.rappel}>
            {" "}
            {aValider} photo{aValider > 1 ? "s" : ""} à valider.
          </strong>
        )}
      </p>

      {evenement.photos.length === 0 ? (
        <p className={pageStyles.vide}>Aucune photo pour le moment.</p>
      ) : (
        <ul className={styles.photos}>
          {evenement.photos.map((photo) => (
            <li key={photo.id_photo} className={styles.photo} data-validee={String(photo.validee)}>
              <div className={styles.cadrePhoto}>
                <Image
                  src={adressePhoto(photo.chemin)}
                  alt={photo.texte_alternatif}
                  width={0}
                  height={0}
                  sizes="(min-width: 700px) 320px, 100vw"
                />
                <p className={styles.puces}>
                  <span className={styles.puce} data-ton={photo.validee ? "valide" : "attente"}>
                    {photo.validee ? "Visible" : "À valider"}
                  </span>
                  {photo.est_couverture && <span className={styles.puce}>Couverture</span>}
                </p>
              </div>
              <p className={styles.texteAlternatif}>
                {photo.texte_alternatif}
                {photo.credit && <span className={styles.credit}> · {photo.credit}</span>}
              </p>
              {droits.gererPhotos && (
              <div className={styles.actionsPhoto}>
                <form action={agirSurPhoto} className={styles.actionsPhoto}>
                  <input type="hidden" name="id" value={evenement.id_evenement} />
                  <input type="hidden" name="id_photo" value={photo.id_photo} />
                  <button
                    type="submit"
                    name="operation"
                    value={photo.validee ? "masquer" : "valider"}
                    className={photo.validee ? styles.lienBouton : `bouton ${styles.boutonCompact}`}
                  >
                    {photo.validee ? "Masquer" : "Valider"}
                  </button>
                  {!photo.est_couverture && (
                    <button type="submit" name="operation" value="couverture" className={styles.lienBouton}>
                      Mettre en couverture
                    </button>
                  )}
                </form>
                <FormulaireConfirme action={agirSurPhoto} message="Supprimer définitivement cette photo ?">
                  <input type="hidden" name="id" value={evenement.id_evenement} />
                  <input type="hidden" name="id_photo" value={photo.id_photo} />
                  <input type="hidden" name="operation" value="supprimer" />
                  <button type="submit" className={`${styles.lienBouton} ${styles.lienBoutonDanger}`}>
                    Supprimer
                  </button>
                </FormulaireConfirme>
              </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <section className={styles.carte} aria-labelledby="titre-ajout-photo">
        <h2 id="titre-ajout-photo" className="annotation annotation-section">
          Ajouter une photo
        </h2>
        <form action={ajouterPhoto} className={`${articles.bloc} ${styles.formulaire}`}>
          <input type="hidden" name="id" value={evenement.id_evenement} />
          <div className={articles.champ}>
            <label htmlFor="photo">Photo</label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.champFichier}
              required
            />
            <p className={articles.aide}>JPEG, PNG ou WebP, 2 Mo au plus. Une photo par envoi.</p>
          </div>
          <div className={articles.champ}>
            <label htmlFor="texte_alternatif">Description</label>
            <input id="texte_alternatif" name="texte_alternatif" type="text" maxLength={300} required />
            <p className={articles.aide}>
              Ce que montre la photo, en une phrase, pour les personnes qui ne la voient pas.
            </p>
          </div>
          <div className={styles.deuxColonnes}>
            <div className={articles.champ}>
              <label htmlFor="legende">
                Légende <span className={articles.facultatif}>(facultatif)</span>
              </label>
              <input id="legende" name="legende" type="text" maxLength={300} />
            </div>
            <div className={articles.champ}>
              <label htmlFor="credit">
                Photographe <span className={articles.facultatif}>(facultatif)</span>
              </label>
              <input id="credit" name="credit" type="text" maxLength={100} />
            </div>
          </div>
          <div>
            <button type="submit" className="bouton">
              Envoyer la photo
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
