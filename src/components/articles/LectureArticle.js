import Image from "next/image";
import { adresseCouverture, tempsDeLecture } from "@/lib/articles";
import { dateEnLettres } from "@/lib/dates";
import ContenuMarkdown from "./ContenuMarkdown";
import styles from "./Articles.module.css";

// Mise en page d'un article à lire : en-tête (date, temps de lecture,
// titre, résumé), image de couverture, puis le texte.
//
// Utilisée par la page publique et par l'aperçu de l'espace équipe, pour
// que l'aperçu montre exactement ce que verra le public.
//
// avant : élément facultatif affiché au-dessus du titre (lien de retour…).
export default function LectureArticle({ article, avant = null }) {
  const couverture = adresseCouverture(article.image_couverture);
  // Un brouillon n'a pas encore de date de publication : on montre celle du jour.
  const date = dateEnLettres(article.published_at ?? new Date().toISOString());
  const minutes = tempsDeLecture(article.contenu);

  return (
    <>
      <header className="conteneur">
        <div className={`${styles.colonne} ${styles.entete}`}>
          {avant}
          <p className={`annotation ${styles.meta}`}>
            <span>{date}</span>
            <span className={styles.separateur} aria-hidden="true" />
            <span>{minutes} min de lecture</span>
          </p>
          <h1 className={styles.titreArticle}>{article.titre}</h1>
          {article.resume && <p className={styles.chapeauArticle}>{article.resume}</p>}
        </div>
      </header>

      {/* L'image garde ses proportions d'origine : elle n'est jamais
          rognée, quelle que soit sa forme (bandeau, paysage, portrait). */}
      {couverture && (
        <div className="conteneur">
          <figure className={styles.couverture}>
            <Image
              src={couverture}
              alt=""
              width={0}
              height={0}
              sizes="(min-width: 1060px) 980px, 100vw"
              priority
            />
          </figure>
        </div>
      )}

      <div className="conteneur">
        <div className={`${styles.colonne} ${styles.corps}`}>
          <ContenuMarkdown texte={article.contenu} />
        </div>
      </div>
    </>
  );
}
