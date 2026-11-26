import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { agirSurPhoto, ajouterPhoto, changerStatutEvenement, enregistrerSuivi } from "@/actions/evenements";
import FormulaireConfirme from "@/components/admin/FormulaireConfirme";
import FormulaireEvenement from "@/components/admin/FormulaireEvenement";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { STATUTS_EVENEMENT, adressePhoto } from "@/lib/evenements";
import { FORMAT_UUID } from "@/lib/validation";
import { lireEvenement } from "@/services/evenements-admin";
import pageStyles from "../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Modifier un événement — Espace équipe",
};

// Messages affichés après une action (paramètre « etat » de l'adresse).
const NOTIFICATIONS = {
  cree: "Événement créé en brouillon : il n'est pas visible du public. Publiez-le quand il est prêt.",
  enregistre: "Modifications enregistrées.",
  "statut-publie": "L'événement est en ligne.",
  "statut-brouillon": "L'événement est repassé en brouillon : il n'est plus visible du public.",
  "statut-annule":
    "L'événement est annulé. Il reste visible sur le site avec la mention « Annulé », et les inscriptions sont fermées.",
  "statut-termine": "L'événement est marqué comme terminé : il passe dans les archives du site.",
  bilan: "Responsable et bilan enregistrés.",
  "photo-ajoutee": "Photo ajoutée. Elle apparaîtra sur le site une fois validée.",
  "photo-valider": "Photo validée : elle est visible sur le site.",
  "photo-masquer": "Photo masquée : elle n'est plus visible sur le site.",
  "photo-couverture": "Photo de couverture changée.",
  "photo-supprimer": "Photo supprimée.",
};

const ERREURS = {
  echec: "L'opération a échoué. Réessayez dans un instant.",
  "bilan-trop-long": "Le bilan n'a pas été enregistré : un des textes est trop long (5 000 caractères au plus).",
  "photo-manquante": "Choisissez une photo à envoyer.",
  "photo-sans-description": "Décrivez la photo (champ « Description ») : c'est obligatoire.",
  "photo-refusee": "Photo refusée : JPEG, PNG ou WebP de 2 Mo au plus, légende et crédit courts.",
};

// Actions de statut proposées, selon le statut actuel.
const CHANGEMENTS = {
  BROUILLON: ["PUBLIE"],
  PUBLIE: ["TERMINE", "ANNULE", "BROUILLON"],
  ANNULE: ["PUBLIE", "BROUILLON"],
  TERMINE: ["PUBLIE", "BROUILLON"],
};
const LIBELLES_CHANGEMENT = {
  PUBLIE: "Publier",
  TERMINE: "Marquer comme terminé",
  ANNULE: "Annuler l'événement",
  BROUILLON: "Repasser en brouillon",
};

// Page d'un événement pour l'équipe : statut, informations, photos, bilan.
export default function PageModifierEvenement({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement de l&apos;événement…</p>}>
        <ModifierEvenement params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ModifierEvenement({ params, searchParams }) {
  const { supabase } = await verifierAccesAdmin();

  const { id } = await params;
  const { etat } = await searchParams;

  let evenement = null;
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      evenement = await lireEvenement(supabase, id);
    } catch (erreur) {
      console.error("Lecture d'un événement impossible :", erreur.message);
      panne = true;
    }
  }

  const visible = evenement && evenement.statut !== "BROUILLON" && evenement.published_at;

  const entete = (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link prefetch={false} href="/admin/evenements" className={articles.retour}>
          <span aria-hidden="true">←</span> Événements
        </Link>
        <h1 className={pageStyles.titre}>{evenement?.titre ?? "Événement"}</h1>
      </div>
      {evenement && (
        <Link
          prefetch={false}
          href={`/admin/evenements/${evenement.id_evenement}/inscrits`}
          className="bouton bouton-secondaire"
        >
          Inscrits et pointage
        </Link>
      )}
    </header>
  );

  if (!evenement) {
    return (
      <>
        {entete}
        <p className={pageStyles.erreur} role="alert">
          {panne
            ? "L'événement n'a pas pu être chargé. Rechargez la page dans un instant."
            : "Cet événement n'existe pas."}
        </p>
      </>
    );
  }

  return (
    <>
      {entete}

      {NOTIFICATIONS[etat] && (
        <p className={articles.notification} role="status">
          {NOTIFICATIONS[etat]}{" "}
          {visible && (
            <a href={`/evenements/${evenement.slug}`} target="_blank" rel="noopener">
              Voir sur le site <span aria-hidden="true">↗</span>
            </a>
          )}
        </p>
      )}
      {ERREURS[etat] && (
        <p className={`${articles.notification} ${articles.notificationErreur}`} role="alert">
          {ERREURS[etat]}
        </p>
      )}

      {/* ---------- Statut ---------- */}
      <section className={styles.section} aria-labelledby="titre-statut">
        <h2 id="titre-statut" className="annotation annotation-section">
          Statut
        </h2>
        <p className={articles.infosLigne}>
          <span className={articles.statut} data-statut={evenement.statut}>
            {STATUTS_EVENEMENT[evenement.statut]}
          </span>
          <span>{visible ? "Visible sur le site" : "Invisible du public"}</span>
          {visible && (
            <a href={`/evenements/${evenement.slug}`} target="_blank" rel="noopener">
              Voir sur le site <span aria-hidden="true">↗</span>
            </a>
          )}
        </p>
        <div className={styles.groupeBoutons}>
          {CHANGEMENTS[evenement.statut].map((statut) => (
            <FormulaireConfirme
              key={statut}
              action={changerStatutEvenement}
              message={`${LIBELLES_CHANGEMENT[statut]} : confirmer ?`}
            >
              <input type="hidden" name="id" value={evenement.id_evenement} />
              <input type="hidden" name="statut" value={statut} />
              <button
                type="submit"
                className={`bouton ${statut === "PUBLIE" ? "" : "bouton-secondaire"} ${
                  statut === "ANNULE" ? styles.boutonDanger : ""
                }`}
              >
                {LIBELLES_CHANGEMENT[statut]}
              </button>
            </FormulaireConfirme>
          ))}
        </div>
      </section>

      {/* ---------- Informations ---------- */}
      <section className={styles.section} aria-label="Informations de l'événement">
        {/* « key » : après un enregistrement, le formulaire repart des données à jour. */}
        <FormulaireEvenement key={evenement.updated_at} evenement={evenement} />
      </section>

      <Photos evenement={evenement} />
      <Suivi evenement={evenement} />
    </>
  );
}

// ---------------------------------------------------------------------
// Photos : envoi, validation, couverture, suppression
// ---------------------------------------------------------------------
function Photos({ evenement }) {
  return (
    <section id="photos" className={styles.section} aria-labelledby="titre-photos">
      <h2 id="titre-photos" className="annotation annotation-section">
        Photos
      </h2>
      <p className={articles.aide}>
        Une photo ajoutée reste invisible du public tant qu&apos;elle n&apos;est pas validée
        (personnes reconnaissables, partenaires, lieu). La première photo devient la couverture.
      </p>

      {evenement.photos.length > 0 && (
        <ul className={styles.photos}>
          {evenement.photos.map((photo) => (
            <li key={photo.id_photo} className={styles.photo} data-validee={String(photo.validee)}>
              <Image src={adressePhoto(photo.chemin)} alt={photo.texte_alternatif} width={0} height={0} sizes="320px" />
              <p className={styles.puces}>
                <span className={articles.statut} data-statut={photo.validee ? "PUBLIE" : undefined}>
                  {photo.validee ? "Validée" : "À valider"}
                </span>
                {photo.est_couverture && <span className={articles.statut}>Couverture</span>}
              </p>
              <p className={styles.texteAlternatif}>
                {photo.texte_alternatif}
                {photo.credit && <> · {photo.credit}</>}
              </p>
              <form action={agirSurPhoto} className={styles.actionsPhoto}>
                <input type="hidden" name="id" value={evenement.id_evenement} />
                <input type="hidden" name="id_photo" value={photo.id_photo} />
                <button
                  type="submit"
                  name="operation"
                  value={photo.validee ? "masquer" : "valider"}
                  className={styles.lienBouton}
                >
                  {photo.validee ? "Masquer" : "Valider"}
                </button>
                {!photo.est_couverture && (
                  <button type="submit" name="operation" value="couverture" className={styles.lienBouton}>
                    Mettre en couverture
                  </button>
                )}
              </form>
              <FormulaireConfirme
                action={agirSurPhoto}
                message="Supprimer définitivement cette photo ?"
                className={styles.actionsPhoto}
              >
                <input type="hidden" name="id" value={evenement.id_evenement} />
                <input type="hidden" name="id_photo" value={photo.id_photo} />
                <input type="hidden" name="operation" value="supprimer" />
                <button type="submit" className={`${styles.lienBouton} ${styles.lienBoutonDanger}`}>
                  Supprimer
                </button>
              </FormulaireConfirme>
            </li>
          ))}
        </ul>
      )}

      <form action={ajouterPhoto} className={`${articles.bloc} ${styles.formulaire}`}>
        <input type="hidden" name="id" value={evenement.id_evenement} />
        <div className={articles.champ}>
          <label htmlFor="photo">Photo</label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
          <p className={articles.aide}>JPEG, PNG ou WebP, 2 Mo au plus. Une photo par envoi.</p>
        </div>
        <div className={articles.champ}>
          <label htmlFor="texte_alternatif">Description</label>
          <input id="texte_alternatif" name="texte_alternatif" type="text" maxLength={300} required />
          <p className={articles.aide}>
            Ce que montre la photo, pour les personnes qui ne la voient pas. Obligatoire.
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
          <button type="submit" className="bouton bouton-secondaire">
            Envoyer la photo
          </button>
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------
// Suivi : responsable et bilan (jamais visibles du public)
// ---------------------------------------------------------------------
function Suivi({ evenement }) {
  const suivi = evenement.suivi ?? {};
  const champs = [
    ["ce_qui_a_marche", "Ce qui a marché"],
    ["difficultes", "Difficultés rencontrées"],
    ["a_ameliorer", "À améliorer la prochaine fois"],
    ["ressources", "Liens vers les ressources (photos, documents, tableaux…), un par ligne"],
  ];

  return (
    <section id="suivi" className={styles.section} aria-labelledby="titre-suivi">
      <h2 id="titre-suivi" className="annotation annotation-section">
        Responsable et bilan
      </h2>
      <p className={articles.aide}>Réservé à l&apos;équipe : rien de cette partie n&apos;apparaît sur le site.</p>

      <form action={enregistrerSuivi} className={`${articles.bloc} ${styles.formulaire}`}>
        <input type="hidden" name="id" value={evenement.id_evenement} />
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
          />
        </div>
        {champs.map(([nom, libelle]) => (
          <div key={nom} className={articles.champ}>
            <label htmlFor={nom}>{libelle}</label>
            <textarea id={nom} name={nom} rows={4} maxLength={5000} defaultValue={suivi[nom] ?? ""} />
          </div>
        ))}
        <div>
          <button type="submit" className="bouton bouton-secondaire">
            Enregistrer le bilan
          </button>
        </div>
      </form>
    </section>
  );
}
