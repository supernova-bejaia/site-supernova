import styles from "./Emblemes.module.css";

// Emblème du Noyau : des traînées de comète convergent vers un cœur
// rouge, au centre d'une géométrie à facettes.
// Il évoque la structure et la construction collective, en reprenant la
// forme effilée des traînées de la comète du logo.
//
// Mouvements (lents et rares) : le cœur « respire », l'anneau extérieur
// tourne très lentement, et une impulsion lumineuse descend de temps en
// temps vers le centre. Tout s'arrête si le mouvement réduit est demandé.
const ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export default function EmblemeNoyau({ className = "" }) {
  return (
    <svg
      className={`${styles.embleme} ${className}`}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Emblème du Noyau : des traînées lumineuses qui convergent vers un cœur rouge."
    >
      <defs>
        <linearGradient id="noyau-trainee" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e70e17" stopOpacity="0" />
          <stop offset="0.55" stopColor="#e70e17" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff3b42" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="noyau-coeur" cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#ff6066" />
          <stop offset="0.5" stopColor="#e70e17" />
          <stop offset="1" stopColor="#6e0006" />
        </radialGradient>
        <radialGradient id="noyau-halo">
          <stop offset="0" stopColor="#e70e17" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e70e17" stopOpacity="0" />
        </radialGradient>

        {/* Une traînée longue et une courte, dessinées vers le haut puis tournées. */}
        <g id="noyau-trainee-longue">
          <polygon points="200,24 211,142 189,142" fill="url(#noyau-trainee)" />
          <circle cx="200" cy="24" r="2.6" fill="#f3f3f3" fillOpacity="0.85" />
        </g>
        <polygon id="noyau-trainee-courte" points="200,78 207,144 193,144" fill="url(#noyau-trainee)" />
      </defs>

      {/* Anneau extérieur en pointillés, qui tourne très lentement */}
      <g className={styles.rotationLente}>
        <circle cx="200" cy="200" r="184" className={styles.anneauPointille} />
        <circle cx="200" cy="16" r="3.2" className={styles.repere} />
      </g>
      <circle cx="200" cy="200" r="152" className={styles.anneauFin} />

      {/* Fines lignes intermédiaires, pour la texture */}
      {ANGLES.map((angle) => (
        <line
          key={`ligne-${angle}`}
          x1="200"
          y1="52"
          x2="200"
          y2="104"
          className={styles.ligneFine}
          transform={`rotate(${angle + 15} 200 200)`}
        />
      ))}

      {/* Facettes : deux hexagones croisés */}
      <polygon points="296,200 248,283.1 152,283.1 104,200 152,116.9 248,116.9" className={styles.facette} />
      <polygon points="283.1,152 283.1,248 200,296 116.9,248 116.9,152 200,104" className={styles.facette} />

      {/* Halo qui respire */}
      <circle cx="200" cy="200" r="118" fill="url(#noyau-halo)" className={styles.respiration} />

      {/* Traînées convergentes, longues et courtes en alternance */}
      {ANGLES.map((angle, i) => (
        <use
          key={`trainee-${angle}`}
          href={i % 2 === 0 ? "#noyau-trainee-longue" : "#noyau-trainee-courte"}
          transform={`rotate(${angle} 200 200)`}
        />
      ))}

      {/* Impulsion lumineuse qui descend vers le cœur, de temps en temps */}
      <g transform="rotate(60 200 200)">
        <circle cx="200" cy="30" r="3.4" className={styles.impulsion} />
      </g>

      {/* Le cœur */}
      <circle cx="200" cy="200" r="52" fill="url(#noyau-coeur)" />
      <circle cx="200" cy="200" r="52" className={styles.contourCoeur} />
    </svg>
  );
}
