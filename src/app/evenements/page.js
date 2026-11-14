import Link from "next/link";
import Apparition from "@/components/mouvement/Apparition";
import EvenementALaUne from "@/components/evenements/EvenementALaUne";
import EvenementAVenir from "@/components/evenements/EvenementAVenir";
import EvenementPasse from "@/components/evenements/EvenementPasse";
import { getPageEvenements } from "@/services/evenements";
import styles from "./page.module.css";

export const metadata = {
  title: "Nos événements",
  description:
    "La vie de Supernova : rencontres, masterclass et moments d'échange, à venir et passés.",
};

// Page « Événements ».
// Elle ne contient aucun événement en dur : tout vient du service
// services/evenements.js, qui lit content/evenements.js.
//
//   Ouverture
//   À la une     : l'événement mis en avant (s'il y en a un)
//   À venir      : l'agenda (ou un message s'il est vide)
//   Archives     : les événements passés et leurs photos (s'il y en a)
//
// Les numéros de section (01, 02…) suivent les sections réellement affichées.
export default async function PageEvenements() {
  const { miseEnAvant, aVenir, passes } = await getPageEvenements();

  const rienAVenir = !miseEnAvant && aVenir.length === 0;
  let numero = 0;
  const prochainNumero = () => String(++numero).padStart(2, "0");

  return (
    <>
      {/* ---------- Ouverture ---------- */}
      <header className={`conteneur ${styles.ouverture}`}>
        <p className={`annotation ${styles.entree}`}>La vie de Supernova</p>
        <h1 className={`titre-ouverture ${styles.entree}`}>
          Nos <span className="accent">événements</span>
        </h1>
        <p className={`chapeau ${styles.entree}`}>
          Rencontres, masterclass et moments d&apos;échange : ce que nous organisons, et ce que
          nous construisons ensemble.
        </p>
      </header>

      {/* ---------- À la une ---------- */}
      {miseEnAvant && (
        <section className={`conteneur ${styles.section}`} aria-labelledby="titre-a-la-une">
          <Apparition>
            <h2 id="titre-a-la-une" className={`annotation annotation-section ${styles.repere}`}>
              <span className="numero">{prochainNumero()}</span> À la une
            </h2>
          </Apparition>
          <Apparition delai={80}>
            <EvenementALaUne evenement={miseEnAvant} />
          </Apparition>
        </section>
      )}

      {/* ---------- À venir ---------- */}
      {(aVenir.length > 0 || rienAVenir) && (
        <section className={`conteneur ${styles.section}`} aria-labelledby="titre-a-venir">
          <Apparition>
            <h2 id="titre-a-venir" className={`annotation annotation-section ${styles.repere}`}>
              <span className="numero">{prochainNumero()}</span>{" "}
              {miseEnAvant ? "Également au programme" : "À venir"}
            </h2>
          </Apparition>

          {rienAVenir ? (
            <Apparition delai={80} className={styles.vide}>
              <p className={styles.titreVide}>Prochains rendez-vous bientôt annoncés</p>
              <p className="chapeau">
                Les membres de l&apos;Orbite en sont informés en avant-première.
              </p>
              <Link href="/rejoindre" className="bouton">
                Rejoindre l&apos;Orbite
                <span className="fleche" aria-hidden="true">
                  →
                </span>
              </Link>
            </Apparition>
          ) : (
            <div className={styles.agenda}>
              {aVenir.map((evenement, index) => (
                <Apparition key={evenement.id} delai={index * 80}>
                  <EvenementAVenir evenement={evenement} />
                </Apparition>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ---------- Archives ---------- */}
      {passes.length > 0 && (
        <section className={styles.archives} aria-labelledby="titre-archives">
          <div className="conteneur">
            <Apparition className={styles.enteteArchives}>
              <h2 id="titre-archives" className={`annotation annotation-section ${styles.repere}`}>
                <span className="numero">{prochainNumero()}</span> Archives
              </h2>
              <p className={`declaration ${styles.declarationArchives}`}>
                Ce que nous avons <span className="accent">vécu</span> ensemble.
              </p>
            </Apparition>

            {passes.map((evenement) => (
              <Apparition key={evenement.id}>
                <EvenementPasse evenement={evenement} />
              </Apparition>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
