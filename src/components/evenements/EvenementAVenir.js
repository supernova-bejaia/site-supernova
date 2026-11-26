import Link from "next/link";
import { horaire } from "@/lib/dates";
import BlocDate from "./BlocDate";
import Visuel from "./Visuel";
import EtiquettesEvenement from "./EtiquettesEvenement";
import styles from "./Evenements.module.css";

// Un événement à venir, présenté comme une ligne d'agenda : la date à
// gauche, l'essentiel au centre, une vignette à droite sur grand écran.
export default function EvenementAVenir({ evenement }) {
  const heures = horaire(evenement.heure, evenement.heureFin);

  return (
    <article className={styles.ligneAgenda} aria-labelledby={`titre-${evenement.id}`}>
      <BlocDate date={evenement.date} />

      <div className={styles.texteAgenda}>
        <EtiquettesEvenement evenement={evenement} />
        <h3 id={`titre-${evenement.id}`} className={styles.titreAgenda}>
          <Link href={`/evenements/${evenement.slug}`} className={styles.lienTitre}>
            {evenement.titre}
          </Link>
        </h3>
        <p className={styles.lieuAgenda}>
          {evenement.lieu.nom}, {evenement.lieu.ville}
          {heures && <> · {heures}</>}
        </p>
        <p className={styles.resume}>{evenement.resume}</p>
      </div>

      <Visuel
        image={evenement.couverture}
        texte={evenement.categorie}
        sizes="260px"
        className={styles.vignetteAgenda}
      />
    </article>
  );
}
