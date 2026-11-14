import Link from "next/link";
import Logo from "@/components/layout/Logo";
import Apparition from "@/components/mouvement/Apparition";
import EmblemeNoyau from "@/components/emblemes/EmblemeNoyau";
import EmblemeOrbite from "@/components/emblemes/EmblemeOrbite";
import { RESEAUX } from "@/lib/site";
import styles from "./page.module.css";

// Page d'accueil.
//   Ouverture        : le logo lumineux, l'orbite et l'appel à rejoindre
//   01 — Le collectif : une déclaration éditoriale
//   02 — Deux parcours : les emblèmes Orbite et Noyau  → page « Rejoindre »
//   03 — Sur le terrain : les événements               → page « Événements »
//   04 — Nos réseaux   : les comptes de Supernova (lib/site.js)
export default function PageAccueil() {
  return (
    <>
      {/* ---------- Ouverture ---------- */}
      <section className={styles.ouverture} aria-labelledby="titre-accueil">
        <div className={styles.orbiteFond} aria-hidden="true" />
        <div className={`conteneur ${styles.contenuOuverture}`}>
          <p className={`annotation ${styles.entree}`}>Béjaïa · Saison 1</p>
          <h1 id="titre-accueil" className={`${styles.titre} ${styles.entree}`}>
            <Logo taille="grande" />
          </h1>
          <p className={`${styles.accroche} ${styles.entree}`}>
            Le collectif étudiant <span className={styles.accrocheForte}>indépendant</span> qui relie
            les étudiants à l&apos;écosystème entrepreneurial algérien.
          </p>
          <div className={`${styles.actions} ${styles.entree}`}>
            <Link href="/rejoindre" className="bouton">
              Rejoindre Supernova
              <span className="fleche" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- 01 — Le collectif ---------- */}
      <section className={`conteneur ${styles.manifeste}`} aria-labelledby="titre-collectif">
        <Apparition>
          <p className="annotation annotation-section">
            <span className="numero">01</span> Le collectif
          </p>
        </Apparition>
        <Apparition delai={80}>
          <h2 id="titre-collectif" className={`declaration ${styles.declaration}`}>
            Créer des occasions de <span className="accent">rencontre</span>, de{" "}
            <span className="accent">collaboration</span> et de{" "}
            <span className="accent">développement</span> pour les étudiants.
          </h2>
        </Apparition>
        <Apparition delai={160} className={styles.texteManifeste}>
          <p className="texte">
            Supernova est un collectif étudiant indépendant, né à Béjaïa. Pas un club
            universitaire de plus : un lieu pour se rencontrer, construire ensemble et accéder
            aux opportunités de l&apos;écosystème entrepreneurial algérien.
          </p>
        </Apparition>
      </section>

      {/* ---------- 02 — Deux parcours ---------- */}
      <section className={styles.parcours} aria-labelledby="titre-parcours">
        <div className="conteneur">
          <Apparition className={styles.enteteParcours}>
            <p className="annotation annotation-section">
              <span className="numero">02</span> Rejoindre Supernova
            </p>
            <h2 id="titre-parcours" className="titre-section">
              Deux parcours
            </h2>
          </Apparition>

          <div className={styles.grilleParcours}>
            <Apparition as="article" className={styles.volet}>
              <div className={styles.illustration}>
                <EmblemeOrbite />
              </div>
              <div className={styles.texteVolet}>
                <p className="annotation">Ouvert à tous les étudiants</p>
                <h3 className="titre-element">L&apos;Orbite</h3>
                <p className="texte">
                  Le réseau ouvert de Supernova : recevez en avant-première nos opportunités,
                  invitations et appels à renfort.
                </p>
                <Link href="/rejoindre" className={styles.lienVolet}>
                  Rejoindre l&apos;Orbite
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Apparition>

            <Apparition as="article" delai={120} className={styles.volet}>
              <div className={styles.illustration}>
                <EmblemeNoyau />
              </div>
              <div className={styles.texteVolet}>
                <p className="annotation">
                  <span className={styles.pastilleFermee} aria-hidden="true" />
                  Recrutement fermé
                </p>
                <h3 className="titre-element">Le Noyau</h3>
                <p className="texte">
                  Le groupe central, qui fait vivre le collectif au quotidien. On y entre sur
                  candidature.
                </p>
                <Link href="/rejoindre#titre-noyau" className={styles.lienVolet}>
                  En savoir plus
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Apparition>
          </div>
        </div>
      </section>

      {/* ---------- 03 — Sur le terrain ---------- */}
      <section className={`conteneur ${styles.evenements}`} aria-labelledby="titre-evenements">
        <Apparition className={styles.texteEvenements}>
          <p className="annotation annotation-section">
            <span className="numero">03</span> Sur le terrain
          </p>
          <h2 id="titre-evenements" className="titre-section">
            Nos événements
          </h2>
          <p className="chapeau">
            Rencontres, masterclass et moments d&apos;échange : retrouvez les rendez-vous de
            Supernova.
          </p>
          <Link href="/evenements" className="bouton bouton-secondaire">
            Voir nos événements
            <span className="fleche" aria-hidden="true">
              →
            </span>
          </Link>
        </Apparition>

        {/* Petite carte de constellation, purement décorative */}
        <Apparition delai={120} className={styles.constellation}>
          <svg viewBox="0 0 320 220" aria-hidden="true" focusable="false">
            <g className={styles.liensConstellation}>
              <polyline points="24,170 92,118 150,140 214,64 296,92" />
              <line x1="150" y1="140" x2="178" y2="196" />
            </g>
            <circle cx="24" cy="170" r="2.5" className={styles.etoile} />
            <circle cx="92" cy="118" r="3.5" className={styles.etoile} />
            <circle cx="150" cy="140" r="2.5" className={styles.etoile} />
            <circle cx="214" cy="64" r="6" className={styles.etoileRouge} />
            <circle cx="214" cy="64" r="14" className={styles.halo} />
            <circle cx="296" cy="92" r="3" className={styles.etoile} />
            <circle cx="178" cy="196" r="2" className={styles.etoile} />
          </svg>
          <p className={`annotation ${styles.legende}`}>Prochaine date bientôt annoncée</p>
        </Apparition>
      </section>

      {/* ---------- 04 — Nos réseaux ---------- */}
      <section className={`conteneur ${styles.reseaux}`} aria-labelledby="titre-reseaux">
        <Apparition className={styles.texteReseaux}>
          <p className="annotation annotation-section">
            <span className="numero">04</span> Nos réseaux
          </p>
          <h2 id="titre-reseaux" className="titre-section">
            Suivez la vie du <span className="accent">collectif</span>
          </h2>
          <p className="chapeau">
            Coulisses, annonces et souvenirs de nos rendez-vous, au fil de la saison.
          </p>
        </Apparition>

        <ul className={styles.listeReseaux}>
          {RESEAUX.map((reseau, index) => (
            <Apparition key={reseau.url} as="li" delai={120 + index * 80}>
              <a
                href={reseau.url}
                className={styles.lienReseau}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.iconeReseau} aria-hidden="true">
                  <IconeReseau nom={reseau.nom} />
                </span>
                <span className={styles.texteLienReseau}>
                  <span className="annotation">{reseau.nom}</span>
                  <span className={styles.identifiantReseau}>{reseau.identifiant}</span>
                </span>
                <span className={styles.flecheReseau} aria-hidden="true">
                  ↗
                </span>
                <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
              </a>
            </Apparition>
          ))}
        </ul>
      </section>
    </>
  );
}

// Pictogramme simplifié d'un réseau, dessiné au trait.
function IconeReseau({ nom }) {
  if (nom === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.3" cy="6.7" r="1" className="plein" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
