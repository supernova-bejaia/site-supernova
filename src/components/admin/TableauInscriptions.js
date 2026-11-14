import styles from "./Admin.module.css";

// Les dernières inscriptions à l'Orbite, sous forme de tableau.
// Sur téléphone, le tableau défile horizontalement dans son cadre.
export default function TableauInscriptions({ lignes }) {
  if (!lignes.length) {
    return <p className={styles.vide}>Aucune inscription pour cette saison.</p>;
  }

  return (
    <div className={styles.cadreTableau} tabIndex={0} aria-label="Dernières inscriptions">
      <table className={styles.tableau}>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Prénom</th>
            <th scope="col">Filière</th>
            <th scope="col">Année</th>
            <th scope="col">Inscription</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.id}>
              <td>{ligne.nom}</td>
              <td>{ligne.prenom}</td>
              <td>{ligne.filiere}</td>
              <td>{ligne.annee}</td>
              <td className={styles.colonneDate}>{ligne.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
