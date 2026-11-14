import OrbiteForm from "@/components/rejoindre/OrbiteForm";
import Apparition from "@/components/mouvement/Apparition";
import EmblemeOrbite from "@/components/emblemes/EmblemeOrbite";
import EmblemeNoyau from "@/components/emblemes/EmblemeNoyau";
import { getCentresInteret } from "@/services/centres-interet";
import styles from "./page.module.css";

export const metadata = {
  title: "Rejoindre Supernova",
  description:
    "Rejoignez l'Orbite, le réseau ouvert de Supernova, ou découvrez le Noyau, son groupe central.",
};

// Page « Rejoindre ».
//   Ouverture        : le titre, avec l'emblème de l'Orbite
//   01 — L'Orbite    : la présentation et le formulaire d'inscription
//   02 — Le Noyau    : le groupe central, recrutement fermé
export default async function PageRejoindre() {
  const centresInteret = await getCentresInteret();

  return (
    <>
      {/* ---------- Ouverture ---------- */}
      <header className={`conteneur ${styles.ouverture}`}>
        <div className={styles.emblemeOuverture} aria-hidden="true">
          <EmblemeOrbite />
        </div>
        <div className={styles.texteOuverture}>
          <p className={`annotation ${styles.entree}`}>Deux parcours</p>
          <h1 className={`titre-ouverture ${styles.entree}`}>
            Rejoindre
            <br />
            <span className="accent">Supernova</span>
          </h1>
          <p className={`chapeau ${styles.entree}`}>
            L&apos;Orbite est ouverte à tous les étudiants. Le Noyau, au centre, recrute sur
            candidature.
          </p>
          <a href="#formulaire-orbite" className={`${styles.raccourci} ${styles.entree}`}>
            Aller au formulaire
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </header>

      {/* ---------- 01 — L'Orbite ---------- */}
      <section className={`conteneur ${styles.section}`} aria-labelledby="titre-orbite">
        <div className={styles.grilleOrbite}>
          <Apparition className={styles.presentation}>
            <p className="annotation annotation-section">
              <span className="numero">01</span> Ouvert à tous les étudiants
            </p>
            <h2 id="titre-orbite" className="titre-section">
              L&apos;Orbite
            </h2>
            <p className="chapeau">
              Le réseau ouvert de Supernova. En le rejoignant, vous recevez en avant-première
              les opportunités du collectif.
            </p>
            <ul className={styles.avantages}>
              <li>Des appels à renfort pour nos événements</li>
              <li>Des invitations à des rencontres privées</li>
              <li>Des missions freelance relayées par des entreprises algériennes</li>
            </ul>
            <p className={styles.precision}>
              Université, ESTIN ou autre établissement : l&apos;inscription est gratuite et ne
              demande pas de créer un compte.
            </p>
          </Apparition>

          <div id="formulaire-orbite" className={styles.panneauFormulaire}>
            <p className={`annotation ${styles.titrePanneau}`}>Inscription à l&apos;Orbite</p>
            <OrbiteForm centresInteret={centresInteret} />
          </div>
        </div>
      </section>

      {/* ---------- 02 — Le Noyau ---------- */}
      <section className={styles.noyau} aria-labelledby="titre-noyau">
        <div className={`conteneur ${styles.grilleNoyau}`}>
          <Apparition className={styles.texteNoyau}>
            <p className="annotation annotation-section">
              <span className="numero">02</span> Recrutement fermé
            </p>
            <h2 id="titre-noyau" className="titre-section">
              Le Noyau
            </h2>
            <p className="chapeau">
              Le groupe central de Supernova : celles et ceux qui font vivre le collectif au
              quotidien. On y entre sur candidature, suivie d&apos;un entretien.
            </p>
            <p className={styles.precision}>
              Le recrutement du Noyau est fermé pour le moment. Rejoindre l&apos;Orbite est le
              meilleur moyen d&apos;être informé de sa réouverture.
            </p>
          </Apparition>
          <Apparition delai={120} className={styles.emblemeNoyau}>
            <EmblemeNoyau />
          </Apparition>
        </div>
      </section>
    </>
  );
}
