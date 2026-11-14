import styles from "./Evenements.module.css";

// Catégorie d'un événement (Masterclass, Rencontre…), partagée par tous les
// composants d'événement.
export default function EtiquettesEvenement({ evenement }) {
  if (!evenement.categorie) return null;

  return (
    <p className={styles.etiquettes}>
      <span className="annotation">{evenement.categorie}</span>
    </p>
  );
}
