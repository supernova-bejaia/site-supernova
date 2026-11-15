import { Suspense } from "react";
import Link from "next/link";
import LectureArticle from "@/components/articles/LectureArticle";
import { adresseCouverture } from "@/lib/articles";
import { getArticlePublie } from "@/services/articles";
import styles from "@/components/articles/Articles.module.css";

// Page de lecture d'un article : /articles/<slug>.
//
// Seuls les articles publiés sont lisibles : le service ne renvoie rien
// pour un brouillon ou une adresse inconnue, et la page affiche alors
// « Article introuvable » (sans être indexée par les moteurs de recherche).
//
// Le slug n'est connu qu'au moment de la visite : la lecture de l'article
// se fait donc derrière <Suspense>, comme le demande Next.js.

// Titre et description pour l'onglet, les moteurs de recherche et les
// aperçus de partage.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticlePublie(slug).catch(() => null);

  if (!article) {
    return { title: "Article introuvable", robots: { index: false, follow: false } };
  }

  const couverture = adresseCouverture(article.image_couverture);

  return {
    title: article.titre,
    description: article.resume || undefined,
    openGraph: {
      type: "article",
      title: article.titre,
      description: article.resume || undefined,
      publishedTime: article.published_at,
      images: couverture ? [couverture] : undefined,
    },
  };
}

export default function PageArticle({ params }) {
  return (
    <Suspense
      fallback={
        <div className="conteneur">
          <p className={`${styles.colonne} ${styles.entete}`}>Chargement de l&apos;article…</p>
        </div>
      }
    >
      {params.then(({ slug }) => (
        <Article slug={slug} />
      ))}
    </Suspense>
  );
}

async function Article({ slug }) {
  const article = await getArticlePublie(slug);
  if (!article) return <ArticleIntrouvable />;

  return (
    <article>
      <LectureArticle article={article} avant={<RetourAuxArticles />} />

      {/* Fin d'article : rejoindre l'Orbite, puis retour à la liste. */}
      <footer className="conteneur">
        <div className={`${styles.colonne} ${styles.fin}`}>
          <div className={styles.invitation}>
            <p className="annotation">Ouvert à tous les étudiants</p>
            <h2 className="titre-element">Rejoindre l&apos;Orbite</h2>
            <p className="texte">
              Le réseau ouvert de Supernova : recevez en avant-première nos opportunités,
              invitations et appels à renfort.
            </p>
            <Link href="/rejoindre" className="bouton">
              Rejoindre l&apos;Orbite
              <span className="fleche" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
          <RetourAuxArticles />
        </div>
      </footer>
    </article>
  );
}

function RetourAuxArticles() {
  return (
    <Link href="/articles" className={styles.retour}>
      <span aria-hidden="true">←</span> Tous les articles
    </Link>
  );
}

// Adresse inconnue, ou article qui n'est pas (ou plus) publié.
function ArticleIntrouvable() {
  return (
    <div className="conteneur">
      <div className={`${styles.colonne} ${styles.entete}`}>
        <p className="annotation">Erreur 404</p>
        <h1 className={styles.titreArticle}>
          Article <span className="accent">introuvable</span>
        </h1>
        <p className="chapeau">Cet article n&apos;existe pas, ou n&apos;est plus en ligne.</p>
        <Link href="/articles" className="bouton bouton-secondaire">
          Voir tous les articles
          <span className="fleche" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
