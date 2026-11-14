import { decomposerDate } from "@/lib/dates";
import styles from "./Evenements.module.css";

// La date d'un événement, composée comme un repère : le jour en grand
// chiffre, le mois et l'année en annotation.
// taille : "normale" (listes) ou "grande" (événement à la une).
export default function BlocDate({ date, taille = "normale" }) {
  const { jour, mois, annee, jourSemaine } = decomposerDate(date);

  return (
    <time
      dateTime={date}
      className={`${styles.blocDate} ${taille === "grande" ? styles.blocDateGrand : ""}`}
    >
      <span className={styles.jour}>{jour}</span>
      <span className={styles.moisAnnee}>
        <span>{mois.replace(".", "")}</span>
        <span>{annee}</span>
      </span>
      <span className="lecteur-ecran">{jourSemaine}</span>
    </time>
  );
}
