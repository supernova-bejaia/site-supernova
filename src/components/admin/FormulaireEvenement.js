"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { enregistrerEvenement } from "@/actions/evenements";
import { versChampDate } from "@/lib/dates";
import { Champ } from "./FormulaireArticle";
import articles from "./Articles.module.css";
import styles from "./Evenements.module.css";

const ETAT_INITIAL = { ok: false, message: "", erreurs: {} };

const MESSAGE_ENVOI =
  "L'envoi a échoué. Vérifiez votre connexion, puis réessayez : votre saisie est conservée.";

async function envoyer(etatPrecedent, donnees) {
  try {
    return await enregistrerEvenement(etatPrecedent, donnees);
  } catch {
    return { ok: false, message: MESSAGE_ENVOI, erreurs: {} };
  }
}

// Formulaire d'un événement : création (sans « evenement ») ou
// modification. Les champs ne sont pas contrôlés par React : ils gardent
// leur saisie si le serveur signale une erreur. La publication et
// l'annulation se font à part, sur la page de l'événement.
export default function FormulaireEvenement({ evenement = null }) {
  const [etat, soumettreAction, enCours] = useActionState(envoyer, ETAT_INITIAL);
  const formulaire = useRef(null);
  const erreurs = etat.erreurs ?? {};
  const visible = evenement && evenement.statut !== "BROUILLON" && evenement.published_at;

  function soumettre(evenementFormulaire) {
    evenementFormulaire.preventDefault();
    if (enCours) return;
    const donnees = new FormData(evenementFormulaire.currentTarget);
    startTransition(() => soumettreAction(donnees));
  }

  useEffect(() => {
    if (etat.ok) {
      // Enregistré : rechargement complet de la page de l'événement.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu
      window.location.assign(`/admin/evenements/${etat.id}?etat=${evenement ? "enregistre" : "cree"}`);
      return;
    }
    const premierChampEnErreur = Object.keys(etat.erreurs ?? {})[0];
    if (premierChampEnErreur) {
      formulaire.current?.elements.namedItem(premierChampEnErreur)?.focus();
    }
  }, [etat, evenement]);

  return (
    <form ref={formulaire} className={`${articles.editeur} ${styles.formulaire}`} onSubmit={soumettre}>
      <input type="hidden" name="id" value={evenement?.id_evenement ?? ""} />

      {/* ---------- 01 — L'essentiel ---------- */}
      <section className={articles.bloc} aria-labelledby="titre-essentiel">
        <h2 id="titre-essentiel" className="annotation annotation-section">
          <span className="numero">01</span> L&apos;essentiel
        </h2>

        <Champ nom="titre" libelle="Titre" erreur={erreurs.titre}>
          <input
            id="titre"
            name="titre"
            type="text"
            className={articles.champTitre}
            maxLength={200}
            defaultValue={evenement?.titre ?? ""}
            required
          />
        </Champ>

        <Champ
          nom="resume"
          libelle="Résumé"
          facultatif
          erreur={erreurs.resume}
          aide="Une ou deux phrases, pour la liste des événements et les partages."
        >
          <textarea id="resume" name="resume" rows={3} maxLength={500} defaultValue={evenement?.resume ?? ""} />
        </Champ>

        <div className={styles.deuxColonnes}>
          <Champ
            nom="categorie"
            libelle="Catégorie"
            facultatif
            erreur={erreurs.categorie}
            aide="Masterclass, Rencontre, Atelier…"
          >
            <input id="categorie" name="categorie" type="text" maxLength={60} defaultValue={evenement?.categorie ?? ""} />
          </Champ>

          <Champ
            nom="slug"
            libelle="Adresse de la page"
            facultatif
            erreur={erreurs.slug}
            aide={
              visible
                ? "Attention : la modifier casse les liens déjà partagés."
                : "Laissez vide pour la déduire du titre."
            }
          >
            <div className={articles.champAdresse}>
              <span aria-hidden="true">/evenements/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                maxLength={120}
                defaultValue={evenement?.slug ?? ""}
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </Champ>
        </div>
      </section>

      {/* ---------- 02 — Quand et où ---------- */}
      <section className={articles.bloc} aria-labelledby="titre-quand">
        <h2 id="titre-quand" className="annotation annotation-section">
          <span className="numero">02</span> Quand et où
        </h2>

        <div className={styles.deuxColonnes}>
          <Champ nom="debut" libelle="Début" erreur={erreurs.debut} aide="Heure de Béjaïa.">
            <input
              id="debut"
              name="debut"
              type="datetime-local"
              defaultValue={versChampDate(evenement?.debut)}
              required
            />
          </Champ>
          <Champ nom="fin" libelle="Fin" facultatif erreur={erreurs.fin}>
            <input id="fin" name="fin" type="datetime-local" defaultValue={versChampDate(evenement?.fin)} />
          </Champ>
        </div>

        <div className={styles.deuxColonnes}>
          <Champ nom="lieu_nom" libelle="Lieu" erreur={erreurs.lieu_nom}>
            <input
              id="lieu_nom"
              name="lieu_nom"
              type="text"
              maxLength={150}
              defaultValue={evenement?.lieu_nom ?? ""}
              placeholder="Auditorium, campus Targa Ouzemmour"
              required
            />
          </Champ>
          <Champ nom="lieu_ville" libelle="Ville" erreur={erreurs.lieu_ville}>
            <input
              id="lieu_ville"
              name="lieu_ville"
              type="text"
              maxLength={100}
              defaultValue={evenement?.lieu_ville ?? "Béjaïa"}
              required
            />
          </Champ>
        </div>
      </section>

      {/* ---------- 03 — Programme ---------- */}
      <section className={articles.bloc} aria-labelledby="titre-programme">
        <h2 id="titre-programme" className="annotation annotation-section">
          <span className="numero">03</span> Programme
        </h2>

        <Champ nom="description" libelle="Description" facultatif erreur={erreurs.description}>
          <textarea
            id="description"
            name="description"
            rows={8}
            maxLength={10000}
            defaultValue={evenement?.description ?? ""}
          />
        </Champ>

        <Champ
          nom="invites"
          libelle="Invités et intervenants"
          facultatif
          erreur={erreurs.invites}
          aide="Un par ligne, par exemple : « Nadia B., fondatrice de… »."
        >
          <textarea id="invites" name="invites" rows={4} maxLength={2000} defaultValue={evenement?.invites ?? ""} />
        </Champ>
      </section>

      {/* ---------- 04 — Entrée et inscription ---------- */}
      <section className={articles.bloc} aria-labelledby="titre-entree">
        <h2 id="titre-entree" className="annotation annotation-section">
          <span className="numero">04</span> Entrée et inscription
        </h2>

        <Champ
          nom="prix"
          libelle="Prix (en dinars)"
          facultatif
          erreur={erreurs.prix}
          aide="Laissez vide si l'événement est gratuit."
        >
          <input
            id="prix"
            name="prix"
            type="text"
            inputMode="decimal"
            maxLength={12}
            defaultValue={evenement?.prix ?? ""}
          />
        </Champ>

        <label className={articles.case}>
          <input
            type="checkbox"
            name="inscription_requise"
            defaultChecked={evenement?.inscription_requise ?? false}
          />
          <span>Inscription requise : afficher un formulaire d&apos;inscription sur la page</span>
        </label>

        <Champ
          nom="lien_inscription"
          libelle="Lien d'inscription externe"
          facultatif
          erreur={erreurs.lien_inscription}
          aide="Seulement si les inscriptions se font ailleurs (Google Forms…) : la page renverra vers ce lien au lieu du formulaire du site."
        >
          <input
            id="lien_inscription"
            name="lien_inscription"
            type="url"
            maxLength={500}
            defaultValue={evenement?.lien_inscription ?? ""}
            placeholder="https://"
          />
        </Champ>

        <label className={articles.case}>
          <input type="checkbox" name="mise_en_avant" defaultChecked={evenement?.mise_en_avant ?? false} />
          <span>Mettre à la une de la page « Événements »</span>
        </label>
      </section>

      {/* ---------- Enregistrer ---------- */}
      <div className={articles.barreActions}>
        <p className={articles.message} role="alert">
          {etat.ok ? "" : etat.message}
        </p>
        <div className={articles.actions}>
          <button type="submit" className="bouton" disabled={enCours}>
            {enCours ? "Enregistrement…" : evenement ? "Enregistrer les modifications" : "Créer le brouillon"}
          </button>
        </div>
      </div>
    </form>
  );
}
