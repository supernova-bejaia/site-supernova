import Image from "next/image";
import styles from "./Evenements.module.css";

// Affiche une photo d'événement dans un cadre aux proportions imposées
// par la mise en page (la photo est recadrée pour le remplir).
//
// Sans photo, un visuel aux couleurs de Supernova la remplace : un
// événement sans image reste ainsi bien présenté.
//
// image  : { src, alt } — facultatif
// sizes  : largeur occupée à l'écran, pour charger la bonne taille d'image
// texte  : mot affiché sur le visuel de remplacement (ex. la catégorie)
export default function Visuel({ image, sizes, texte, priority = false, className = "" }) {
  if (!image) {
    return (
      <div className={`${styles.cadre} ${styles.remplacement} ${className}`} aria-hidden="true">
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">
          <ellipse cx="200" cy="150" rx="170" ry="54" className={styles.remplacementOrbite} transform="rotate(-14 200 150)" />
          <ellipse cx="200" cy="150" rx="110" ry="80" className={styles.remplacementOrbite} transform="rotate(30 200 150)" />
          <circle cx="200" cy="150" r="16" className={styles.remplacementCoeur} />
          <circle cx="362" cy="110" r="5" className={styles.remplacementCoeur} />
        </svg>
        {texte && <span className={styles.remplacementTexte}>{texte}</span>}
      </div>
    );
  }

  return (
    <div className={`${styles.cadre} ${className}`}>
      <Image src={image.src} alt={image.alt} fill sizes={sizes} priority={priority} />
    </div>
  );
}
