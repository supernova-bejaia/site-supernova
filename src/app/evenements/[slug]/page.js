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
import cartes from "@/components/evenements/Evenements.module.css";
import styles from "./page.module.css";

// Page d'un événement : /evenements/<slug>.
//
// Seuls les événements publiés (y compris annulés ou terminés) sont
// lisibles : le service ne renvoie rien pour un brouillon ou une adresse
// inconnue, et la page affiche alors « Événement introuvable ».
//
// L'inscription : le formulaire du site si l'événement en demande une et
// n'a pas commencé, ou un lien vers le formulaire externe s'il y en a un.

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

  const heures = horaire(evenement.heure, evenement.heureFin);
  const quand = evenement.dateFin
    ? `Du ${dateLongue(evenement.date)} au ${dateLongue(evenement.dateFin)}`
    : dateLongue(evenement.date);

  return (
    <article className="conteneur">
      <DonneesStructurees donnees={donneesEvenement(evenement)} />

      <header className={`${lecture.colonne} ${lecture.entete}`}>
        <RetourAuxEvenements />
        <EtiquettesEvenement evenement={evenement} />
        <h1 className={`titre-ouverture ${lecture.titreArticle}`}>{evenement.titre}</h1>
        {evenement.resume && <p className={lecture.chapeauArticle}>{evenement.resume}</p>}

        <dl className={cartes.infos}>
          <div>
            <dt>Date</dt>
            <dd>
              {quand}
              {heures && <>, {heures}</>}
            </dd>
          </div>
          <div>
            <dt>Lieu</dt>
            <dd>
              {evenement.lieu.nom}, {evenement.lieu.ville}
            </dd>
          </div>
          <div>
            <dt>Entrée</dt>
            <dd>{prixLisible(evenement.prix)}</dd>
          </div>
          {evenement.invites.length > 0 && (
            <div>
              <dt>Invités</dt>
              <dd>
                <ul className={styles.invites}>
                  {evenement.invites.map((invite, index) => (
                    <li key={index}>{invite}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <div className={`${lecture.colonne} ${styles.bloc}`}>
        <Visuel
          image={evenement.couverture}
          texte={evenement.categorie}
          sizes="(min-width: 760px) 720px, 100vw"
          priority
          className={styles.visuel}
        />

        {evenement.description && <div className={styles.texte}>{evenement.description}</div>}

        <Inscription evenement={evenement} />
      </div>

      {evenement.photos.length > 0 && (
        <section className={styles.bloc} aria-labelledby="titre-photos">
          <h2 id="titre-photos" className="annotation annotation-section">
            En images
          </h2>
          <Galerie photos={evenement.photos} />
        </section>
      )}
    </article>
  );
}

// L'encadré d'inscription, selon la situation de l'événement.
function Inscription({ evenement }) {
  if (evenement.annule) {
    return (
      <p className={`${styles.inscription} ${styles.avisAnnule}`} role="status">
        Cet événement est annulé.
      </p>
    );
  }
  if (evenement.passe || !evenement.inscriptionRequise) return null;

  return (
    <section id="inscription" className={styles.inscription} aria-labelledby="titre-inscription">
      <h2 id="titre-inscription" className="titre-element">
        S&apos;inscrire
      </h2>

      {evenement.lienInscription ? (
        <a href={evenement.lienInscription} className="bouton" target="_blank" rel="noopener noreferrer">
          Accéder au formulaire d&apos;inscription
          <span className="fleche" aria-hidden="true">
            ↗
          </span>
          <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
        </a>
      ) : evenement.inscriptionsOuvertes ? (
        <FormulaireInscription idEvenement={evenement.id} titre={evenement.titre} />
      ) : (
        <p className={styles.avis}>Les inscriptions sont closes.</p>
      )}
    </section>
  );
}

function RetourAuxEvenements() {
  return (
    <Link href="/evenements" className={lecture.retour}>
      <span aria-hidden="true">←</span> Tous les événements
    </Link>
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
