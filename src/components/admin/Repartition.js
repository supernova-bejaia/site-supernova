import styles from "./Admin.module.css";

// Une répartition simple : chaque valeur avec son nombre et une barre
// proportionnelle (la plus grande valeur occupe toute la largeur).
export default function Repartition({ titre, elements, vide }) {
  const maximum = Math.max(1, ...elements.map((element) => element.nombre));

  return (
    <div className={styles.repartition}>
      <h3 className={styles.titreRepartition}>{titre}</h3>
      {elements.length === 0 ? (
        <p className={styles.vide}>{vide}</p>
      ) : (
        <ul className={styles.listeRepartition}>
          {elements.map((element) => (
            <li key={element.nom}>
              <span className={styles.nomRepartition}>{element.nom}</span>
              <span className={styles.nombreRepartition}>{element.nombre}</span>
              <span className={styles.barre} aria-hidden="true">
                <span style={{ width: `${(element.nombre / maximum) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
