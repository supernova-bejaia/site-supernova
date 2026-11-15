import Image from "next/image";
import Link from "next/link";
import { adresseCouverture } from "@/lib/articles";
import { dateEnLettres } from "@/lib/dates";
import styles from "./Articles.module.css";

// Un article dans la liste : toute la carte est un lien vers l'article.
// L'image de couverture est facultative.
//
// prioritaire : vrai pour le premier article, dont l'image est chargée
// sans attendre (elle est visible dès l'arrivée sur la page).
export default function CarteArticle({ article, prioritaire = false }) {
  const couverture = adresseCouverture(article.image_couverture);

  return (
    <Link href={`/articles/${article.slug}`} className={styles.carte}>
      {couverture && (
        <div className={styles.cadreCarte}>
          <Image
            src={couverture}
            alt=""
            fill
            sizes="(min-width: 900px) 320px, 100vw"
            priority={prioritaire}
          />
        </div>
      )}
      <div className={styles.texteCarte}>
        <p className="annotation">{dateEnLettres(article.published_at)}</p>
        <h2 className={`titre-element ${styles.titreCarte}`}>{article.titre}</h2>
        {article.resume && <p className="texte">{article.resume}</p>}
        <span className={styles.lireCarte}>
          Lire l&apos;article <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
