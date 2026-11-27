import Link from "next/link";
import { moisEtAnnee } from "@/lib/dates";
import Galerie from "./Galerie";
import EtiquettesEvenement from "./EtiquettesEvenement";
import styles from "./Evenements.module.css";

// Un événement passé, présenté comme une page d'archive : les repères
// (date, lieu) à gauche, le récit à droite, puis la galerie de photos.
export default function EvenementPasse({ evenement }) {
  // Sans galerie, la couverture sert de photo unique.
  const photos = evenement.photos?.length
    ? evenement.photos
    : evenement.couverture
      ? [evenement.couverture]
      : [];

  return (
    <article className={styles.archive} aria-labelledby={`titre-${evenement.id}`}>
      <div className={styles.enteteArchive}>
        <div className={styles.reperesArchive}>
          <time dateTime={evenement.date} className={styles.moisArchive}>
            {moisEtAnnee(evenement.date)}
          </time>
          <p className={styles.lieuArchive}>
            {evenement.lieu.nom}, {evenement.lieu.ville}
          </p>
          <EtiquettesEvenement evenement={evenement} />
        </div>

        <div className={styles.recitArchive}>
          <h3 id={`titre-${evenement.id}`} className={styles.titreArchive}>
            <Link href={`/evenements/${evenement.slug}`} className={styles.lienTitre}>
              {evenement.titre}
            </Link>
          </h3>
          <p className={styles.description}>{evenement.description ?? evenement.resume}</p>
        </div>
      </div>

      <Galerie photos={photos} />
    </article>
  );
}
