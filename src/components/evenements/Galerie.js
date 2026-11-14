import Visuel from "./Visuel";
import styles from "./Evenements.module.css";

// Nombre de photos montrées dans la mosaïque ; les suivantes se déplient.
const MAX_MOSAIQUE = 5;

// Galerie d'un événement passé. La composition s'adapte au nombre de
// photos : une seule, deux côte à côte, trois en triptyque, quatre en
// grille, puis une mosaïque au-delà. Les photos supplémentaires se
// déplient sous la mosaïque (sans JavaScript, grâce à <details>).
export default function Galerie({ photos }) {
  if (!photos?.length) return null;

  const nombre = photos.length;
  const disposition =
    nombre === 1 ? "une" : nombre === 2 ? "deux" : nombre === 3 ? "trois" : nombre === 4 ? "quatre" : "mosaique";

  const visibles = photos.slice(0, MAX_MOSAIQUE);
  const supplementaires = photos.slice(MAX_MOSAIQUE);

  return (
    <div className={styles.galerie}>
      <div className={styles.grilleGalerie} data-disposition={disposition}>
        {visibles.map((photo, index) => (
          <figure key={photo.src} className={styles.tuile}>
            <Visuel
              image={photo}
              sizes={index === 0 ? "(min-width: 900px) 60vw, 100vw" : "(min-width: 900px) 30vw, 50vw"}
            />
            {index === visibles.length - 1 && supplementaires.length > 0 && (
              <span className={styles.compteurPhotos} aria-hidden="true">
                +{supplementaires.length}
              </span>
            )}
            {photo.legende && nombre === 1 && <figcaption>{photo.legende}</figcaption>}
          </figure>
        ))}
      </div>

      {supplementaires.length > 0 && (
        <details className={styles.suite}>
          <summary>
            Voir les {supplementaires.length} autres photos
            <span aria-hidden="true">↓</span>
          </summary>
          <div className={styles.grilleSuite}>
            {supplementaires.map((photo) => (
              <figure key={photo.src} className={styles.tuile}>
                <Visuel image={photo} sizes="(min-width: 900px) 25vw, 50vw" />
              </figure>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
