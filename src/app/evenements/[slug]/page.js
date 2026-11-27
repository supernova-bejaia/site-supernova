import { Suspense } from "react";
import Link from "next/link";
import DonneesStructurees from "@/components/layout/DonneesStructurees";
import EtiquettesEvenement from "@/components/evenements/EtiquettesEvenement";
import FormulaireInscription from "@/components/evenements/FormulaireInscription";
import Galerie from "@/components/evenements/Galerie";
import Visuel from "@/components/evenements/Visuel";
import { dateLongue, horaire } from "@/lib/dates";
import { donneesEvenement } from "@/lib/donnees-structurees";
import { prixLisible } from "@/lib/evenements";
import { getEvenementPublie } from "@/services/evenements";
import lecture from "@/components/articles/Articles.module.css";
import styles from "./page.module.css";

// Page d'un événement : /evenements/<slug>.
//
// Seuls les événements publiés (y compris annulés ou terminés) sont
// lisibles : le service ne renvoie rien pour un brouillon ou une adresse
// inconnue, et la page affiche alors « Événement introuvable ».
//
// Mise en page :
//   téléphone  : titre, carte d'infos (avec un bouton vers l'inscription),
//                description, intervenants, puis le formulaire ;
//   ordinateur : le contenu à gauche ; à droite, la carte d'infos et
//                l'inscription, toujours visibles.

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const evenement = await getEvenementPublie(slug).catch(() => null);

  if (!evenement) {
    return { title: "Événement introuvable", robots: { index: false, follow: false } };
  }

  const description =
    evenement.resume ||
    `${evenement.titre}, le ${dateLongue(evenement.date)} à ${evenement.lieu.ville}.`;

  return {
    title: evenement.annule ? `${evenement.titre} (annulé)` : evenement.titre,
    description,
    alternates: { canonical: `/evenements/${evenement.slug}` },
    openGraph: {
      type: "website",
      title: evenement.titre,
      description,
      images: evenement.couverture ? [evenement.couverture.src] : undefined,
    },
  };
}

export default function PageEvenement({ params }) {
  return (
    <Suspense
      fallback={
        <div className="conteneur">
          <p className={`${lecture.colonne} ${lecture.entete}`}>Chargement de l&apos;événement…</p>
        </div>
      }
    >
      {params.then(({ slug }) => (
        <Evenement slug={slug} />
      ))}
    </Suspense>
  );
}

async function Evenement({ slug }) {
  const evenement = await getEvenementPublie(slug);
  if (!evenement) return <EvenementIntrouvable />;

  // Ce que propose la carte d'inscription, selon la situation.
  const inscription = evenement.annule
    ? "annule"
    : evenement.passe || !evenement.inscriptionRequise
      ? null
      : evenement.lienInscription
        ? "externe"
        : evenement.inscriptionsOuvertes
          ? "formulaire"
          : "close";

  // Les photos de la galerie, sans répéter la couverture déjà affichée.
  const galerie = evenement.photos.filter((photo) => photo !== evenement.couverture);

  return (
    <article className={`conteneur ${styles.page}`}>
      <DonneesStructurees donnees={donneesEvenement(evenement)} />

      <header className={styles.entete}>
        <Link href="/evenements" className={lecture.retour}>
          <span aria-hidden="true">←</span> Tous les événements
        </Link>
        <EtiquettesEvenement evenement={evenement} />
        <h1 className={`titre-ouverture ${styles.titre}`}>{evenement.titre}</h1>
        {evenement.resume && <p className={lecture.chapeauArticle}>{evenement.resume}</p>}
      </header>

      <div className={styles.grille}>
        {/* ---------- L'essentiel : quand, où, combien ---------- */}
        <aside className={styles.carteInfos} aria-label="Informations pratiques">
          <Infos evenement={evenement} />
          {(inscription === "formulaire" || inscription === "externe") && (
            <a href="#inscription" className={`bouton ${styles.raccourciInscription}`}>
              S&apos;inscrire
              <span className="fleche" aria-hidden="true">
                ↓
              </span>
            </a>
          )}
          {inscription === "annule" && (
            <p className={styles.avisAnnule} role="status">
              Cet événement est annulé.
            </p>
          )}
        </aside>

        {/* ---------- Le contenu ---------- */}
        <div className={styles.contenu}>
          {evenement.couverture && (
            <Visuel
              image={evenement.couverture}
              sizes="(min-width: 960px) 60vw, 100vw"
              priority
              className={styles.couverture}
            />
          )}

          {evenement.description && <div className={styles.texte}>{evenement.description}</div>}

          {evenement.invites.length > 0 && (
            <section className={styles.bloc} aria-labelledby="titre-intervenants">
              <h2 id="titre-intervenants" className="annotation annotation-section">
                Intervenants
              </h2>
              <ul className={styles.intervenants}>
                {evenement.invites.map((invite, index) => (
                  <li key={index}>{invite}</li>
                ))}
              </ul>
            </section>
          )}

          {galerie.length > 0 && (
            <section className={styles.bloc} aria-labelledby="titre-photos">
              <h2 id="titre-photos" className="annotation annotation-section">
                En images
              </h2>
              <Galerie photos={galerie} />
            </section>
          )}
        </div>

        {/* ---------- L'inscription ---------- */}
        {inscription && inscription !== "annule" && (
          <section
            id="inscription"
            className={styles.inscription}
            aria-labelledby="titre-inscription"
          >
            <h2 id="titre-inscription" className={styles.titreInscription}>
              S&apos;inscrire
            </h2>
            <p className={styles.precisionInscription}>
              {prixLisible(evenement.prix)} · sans création de compte
            </p>

            {inscription === "externe" && (
              <a
                href={evenement.lienInscription}
                className={`bouton ${styles.boutonPlein}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Accéder au formulaire d&apos;inscription
                <span className="fleche" aria-hidden="true">
                  ↗
                </span>
                <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
              </a>
            )}
            {inscription === "formulaire" && (
              <FormulaireInscription idEvenement={evenement.id} titre={evenement.titre} />
            )}
            {inscription === "close" && (
              <p className={styles.avis}>Les inscriptions sont closes.</p>
            )}
          </section>
        )}
      </div>
    </article>
  );
}

// Date, horaire, lieu et entrée, en liste de définitions.
function Infos({ evenement }) {
  const heures = horaire(evenement.heure, evenement.heureFin);
  const quand = evenement.dateFin
    ? `Du ${dateLongue(evenement.date)} au ${dateLongue(evenement.dateFin)}`
    : dateLongue(evenement.date);

  return (
    <dl className={styles.infos}>
      <div>
        <dt>Date</dt>
        <dd>
          <time dateTime={evenement.debut}>{quand}</time>
        </dd>
      </div>
      {heures && (
        <div>
          <dt>Horaire</dt>
          <dd>{heures}</dd>
        </div>
      )}
      <div>
        <dt>Lieu</dt>
        <dd>
          {evenement.lieu.nom}
          <span className={styles.ville}>{evenement.lieu.ville}</span>
        </dd>
      </div>
      <div>
        <dt>Entrée</dt>
        <dd>{prixLisible(evenement.prix)}</dd>
      </div>
    </dl>
  );
}

function EvenementIntrouvable() {
  return (
    <div className="conteneur">
      <div className={`${lecture.colonne} ${lecture.entete}`}>
        <p className="annotation">Erreur 404</p>
        <h1 className={lecture.titreArticle}>
          Événement <span className="accent">introuvable</span>
        </h1>
        <p className="chapeau">Cet événement n&apos;existe pas, ou n&apos;est plus en ligne.</p>
        <Link href="/evenements" className="bouton bouton-secondaire">
          Voir tous les événements
          <span className="fleche" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
