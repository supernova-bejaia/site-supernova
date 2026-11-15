"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { enregistrerArticle, supprimerArticle } from "@/actions/articles";
import { adresseCouverture } from "@/lib/articles";
import styles from "./Articles.module.css";

const ETAT_INITIAL = { ok: false, message: "", erreurs: {} };

// Mêmes limites que sur le serveur, pour prévenir avant l'envoi.
const TAILLE_MAX_IMAGE = 2 * 1024 * 1024;

const MESSAGE_ENVOI =
  "L'envoi a échoué. Vérifiez votre connexion et le poids de l'image, puis réessayez : votre saisie est conservée.";

// Appelle la Server Action en se protégeant des pannes (réseau coupé,
// envoi trop lourd) : la page ne plante pas et la saisie reste en place.
async function envoyer(etatPrecedent, donnees) {
  const image = donnees.get("image");
  if (image instanceof File && image.size > TAILLE_MAX_IMAGE) {
    return {
      ok: false,
      message: "Certains champs sont à corriger.",
      erreurs: { image: "Cette image est trop lourde (2 Mo au plus)." },
    };
  }

  try {
    return await enregistrerArticle(etatPrecedent, donnees);
  } catch {
    return { ok: false, message: MESSAGE_ENVOI, erreurs: {} };
  }
}

// Formulaire d'écriture d'un article : création (sans « article ») ou
// modification.
//
// Deux boutons d'envoi : enregistrer en brouillon (invisible du public) ou
// publier. La suppression est un formulaire à part, en bas de page.
export default function FormulaireArticle({ article = null }) {
  const [etat, soumettreAction, enCours] = useActionState(envoyer, ETAT_INITIAL);
  const routeur = useRouter();
  const formulaire = useRef(null);

  const erreurs = etat.erreurs ?? {};
  const publie = article?.statut === "PUBLIE";
  const couverture = adresseCouverture(article?.image_couverture);

  function soumettre(evenement) {
    // On envoie nous-mêmes les données : le formulaire garde ainsi la
    // saisie si le serveur signale une erreur. Le bouton cliqué
    // (« submitter ») indique l'intention : brouillon ou publier.
    evenement.preventDefault();
    if (enCours) return;
    const donnees = new FormData(evenement.currentTarget, evenement.nativeEvent.submitter);
    startTransition(() => soumettreAction(donnees));
  }

  // Après la réponse du serveur.
  useEffect(() => {
    if (etat.ok) {
      // Enregistré : on affiche la page de l'article, avec ses données à jour.
      const resultat = etat.statut === "PUBLIE" ? "publie" : "brouillon";
      routeur.replace(`/admin/articles/${etat.id}?etat=${resultat}`);
      routeur.refresh();
      return;
    }
    const premierChampEnErreur = Object.keys(etat.erreurs ?? {})[0];
    if (premierChampEnErreur) {
      formulaire.current?.elements.namedItem(premierChampEnErreur)?.focus();
    }
  }, [etat, routeur]);

  return (
    <>
      <form ref={formulaire} className={styles.formulaire} onSubmit={soumettre}>
        <input type="hidden" name="id" value={article?.id_article ?? ""} />

        <Champ nom="titre" libelle="Titre" erreur={erreurs.titre}>
          <input id="titre" name="titre" type="text" maxLength={200} defaultValue={article?.titre ?? ""} required />
        </Champ>

        <Champ
          nom="slug"
          libelle="Adresse de l'article"
          facultatif
          erreur={erreurs.slug}
          aide={
            publie
              ? "Attention : modifier l'adresse d'un article publié casse les liens déjà partagés."
              : "Laissez vide pour la déduire du titre. Exemple : « retour-sur-la-masterclass »."
          }
        >
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={120}
            defaultValue={article?.slug ?? ""}
            autoCapitalize="none"
            spellCheck={false}
          />
        </Champ>

        <Champ
          nom="resume"
          libelle="Résumé"
          facultatif
          erreur={erreurs.resume}
          aide="Une ou deux phrases, affichées dans la liste des articles et lors d'un partage."
        >
          <textarea id="resume" name="resume" rows={3} maxLength={500} defaultValue={article?.resume ?? ""} />
        </Champ>

        <Champ nom="contenu" libelle="Texte de l'article" erreur={erreurs.contenu}>
          <textarea
            id="contenu"
            name="contenu"
            className={styles.zoneTexte}
            rows={18}
            maxLength={100000}
            defaultValue={article?.contenu ?? ""}
          />
        </Champ>

        <details className={styles.aideMemoire}>
          <summary>Mise en forme (Markdown)</summary>
          <ul>
            <li>
              <code>## Intertitre</code> — un intertitre (<code>###</code> pour un niveau en dessous)
            </li>
            <li>
              <code>**gras**</code> et <code>*italique*</code>
            </li>
            <li>
              <code>[texte du lien](https://adresse.com)</code> — un lien
            </li>
            <li>
              <code>- élément</code> — une liste à puces ; <code>1. élément</code> — une liste numérotée
            </li>
            <li>
              <code>&gt; citation</code> — une citation
            </li>
            <li>Une ligne vide sépare deux paragraphes.</li>
          </ul>
        </details>

        <div className={styles.champ}>
          <label htmlFor="image">
            Image de couverture <span className={styles.facultatif}>(facultatif)</span>
          </label>

          {couverture && (
            <div className={styles.couvertureActuelle}>
              <div className={styles.cadreCouverture}>
                <Image src={couverture} alt="Image de couverture actuelle" fill sizes="280px" />
              </div>
              <label className={styles.case}>
                <input type="checkbox" name="retirer_image" />
                <span>Retirer cette image</span>
              </label>
            </div>
          )}

          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-invalid={erreurs.image ? true : undefined}
            aria-describedby="image-aide"
          />
          <p className={styles.aide} id="image-aide">
            JPEG, PNG ou WebP, 2 Mo au plus. Format paysage conseillé (16/9).
            {couverture && " Choisir un fichier remplace l'image actuelle."}
          </p>
          {erreurs.image && <p className={styles.erreur}>{erreurs.image}</p>}
        </div>

        <p className={styles.message} role="alert">
          {etat.ok ? "" : etat.message}
        </p>

        <div className={styles.actions}>
          <button
            type="submit"
            name="intention"
            value="publier"
            className="bouton"
            disabled={enCours}
          >
            {enCours ? "Enregistrement…" : publie ? "Mettre à jour l'article" : "Publier"}
          </button>
          <button
            type="submit"
            name="intention"
            value="brouillon"
            className="bouton bouton-secondaire"
            disabled={enCours}
          >
            {publie ? "Dépublier (repasser en brouillon)" : "Enregistrer le brouillon"}
          </button>
        </div>
      </form>

      {article && (
        <form
          action={supprimerArticle}
          className={styles.zoneSuppression}
          onSubmit={(evenement) => {
            if (!window.confirm("Supprimer définitivement cet article ? Cette action est irréversible.")) {
              evenement.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={article.id_article} />
          <button type="submit" className={styles.boutonSupprimer}>
            Supprimer l&apos;article
          </button>
        </form>
      )}
    </>
  );
}

// Un champ : libellé, champ, aide éventuelle et message d'erreur.
function Champ({ nom, libelle, facultatif = false, aide, erreur, children }) {
  return (
    <div className={styles.champ} data-invalide={erreur ? "true" : undefined}>
      <label htmlFor={nom}>
        {libelle}
        {facultatif && <span className={styles.facultatif}> (facultatif)</span>}
      </label>
      {children}
      {aide && <p className={styles.aide}>{aide}</p>}
      {erreur && <p className={styles.erreur}>{erreur}</p>}
    </div>
  );
}
