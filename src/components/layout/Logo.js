import styles from "./Logo.module.css";

// Logo provisoire, dessiné en texte + SVG en attendant le fichier officiel :
// le mot SUPERNOVA en capitales larges, avec une comète rouge à la place du O.
export default function Logo({ taille = "normale" }) {
  const classe = taille === "grande" ? `${styles.logo} ${styles.grande}` : styles.logo;

  return (
    <span className={classe} role="img" aria-label="Supernova">
      <span aria-hidden="true">SUPERN</span>
      <svg
        className={styles.comete}
        viewBox="0 0 120 80"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="30" cy="50" r="28" />
        <path d="M18 25 L119 1 L50 46 Z" />
        <path d="M44 38 L114 18 L57 60 Z" />
        <path d="M50 58 L100 42 L46 76 Z" />
      </svg>
      <span aria-hidden="true">VA</span>
    </span>
  );
}
