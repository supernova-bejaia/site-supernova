import styles from "./Admin.module.css";

// Un chiffre clé du tableau de bord : la valeur en grand, son libellé,
// et une précision facultative.
export default function Indicateur({ libelle, valeur, precision, accent = false }) {
  return (
    <div className={`${styles.indicateur} ${accent ? styles.indicateurAccent : ""}`}>
      <p className="annotation">{libelle}</p>
      <p className={styles.valeur}>{valeur}</p>
      {precision && <p className={styles.precision}>{precision}</p>}
    </div>
  );
}
