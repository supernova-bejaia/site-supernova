import { COMETE } from "@/lib/marque";
import styles from "./Emblemes.module.css";

// Emblème de l'Orbite : des trajectoires inclinées autour d'un petit centre,
// des corps qui y circulent, et la comète de Supernova en tête.
// Des liens en pointillés relient les corps voisins, comme une
// constellation : c'est le réseau ouvert.
//
// Mouvements (lents et rares) : tout le système tourne très lentement, et
// les liens de la constellation s'allument puis s'estompent.
// Tout s'arrête si le mouvement réduit est demandé.
export default function EmblemeOrbite({ className = "" }) {
  return (
    <svg
      className={`${styles.embleme} ${className}`}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Emblème de l'Orbite : des trajectoires et des corps reliés autour d'un centre."
    >
      <defs>
        <radialGradient id="orbite-centre" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#ff6066" />
          <stop offset="0.55" stopColor="#e70e17" />
          <stop offset="1" stopColor="#6e0006" />
        </radialGradient>
        <radialGradient id="orbite-halo">
          <stop offset="0" stopColor="#e70e17" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e70e17" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className={styles.rotationTresLente}>
        {/* Trajectoires */}
        <ellipse cx="200" cy="200" rx="192" ry="72" className={styles.anneauPointille} transform="rotate(-22 200 200)" />
        <ellipse cx="200" cy="200" rx="175" ry="62" className={styles.trajectoire} transform="rotate(-22 200 200)" />
        <ellipse
          cx="200"
          cy="200"
          rx="175"
          ry="62"
          pathLength="100"
          className={styles.segmentRouge}
          strokeDasharray="26 74"
          strokeDashoffset="-4"
          transform="rotate(-22 200 200)"
        />
        <ellipse cx="200" cy="200" rx="130" ry="96" className={styles.trajectoire} transform="rotate(38 200 200)" />
        <ellipse
          cx="200"
          cy="200"
          rx="130"
          ry="96"
          pathLength="100"
          className={styles.segmentRougeFin}
          strokeDasharray="14 86"
          strokeDashoffset="-58"
          transform="rotate(38 200 200)"
        />
        <circle cx="200" cy="200" r="70" className={styles.anneauPointille} />

        {/* Liens de la constellation */}
        <g className={styles.liens}>
          <line x1="360.5" y1="158" x2="302.4" y2="174.5" />
          <line x1="302.4" y1="174.5" x2="176.1" y2="134.2" />
          <line x1="176.1" y1="134.2" x2="109.4" y2="243.7" />
          <line x1="109.4" y1="243.7" x2="39.6" y2="242" />
        </g>

        {/* Corps en circulation */}
        <circle cx="302.4" cy="174.5" r="4" className={styles.corps} />
        <circle cx="176.1" cy="134.2" r="3.2" className={styles.corpsClair} />
        <circle cx="109.4" cy="243.7" r="5.2" className={styles.corps} />
        <circle cx="39.6" cy="242" r="3.6" className={styles.corpsClair} />

        {/* La comète de Supernova, en tête de l'orbite */}
        <circle cx="360.5" cy="158" r="20" fill="url(#orbite-halo)" />
        <g transform="translate(360.5 158) rotate(-61) scale(0.25) translate(-30 -50)" className={styles.comete}>
          {/* Comète officielle (Brand Official), ramenée au repère d'origine */}
          <path transform="translate(-3.5 -16.7) scale(0.215)" fillRule="evenodd" d={COMETE} />
        </g>
      </g>

      {/* Le centre */}
      <circle cx="200" cy="200" r="46" fill="url(#orbite-halo)" className={styles.respiration} />
      <circle cx="200" cy="200" r="15" fill="url(#orbite-centre)" />
    </svg>
  );
}
