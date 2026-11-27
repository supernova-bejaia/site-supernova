import styles from "./Evenements.module.css";

// Catégorie d'un événement (Masterclass, Rencontre…), et la mention
// « Annulé » le cas échéant, partagées par tous les composants d'événement.
export default function EtiquettesEvenement({ evenement }) {
  if (!evenement.categorie && !evenement.annule) return null;

  return (
    <p className={styles.etiquettes}>
      {evenement.annule && <span className={`annotation ${styles.annule}`}>Annulé</span>}
      {evenement.categorie && <span className="annotation">{evenement.categorie}</span>}
    </p>
  );
}
