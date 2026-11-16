import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { dateCourte } from "@/lib/dates";
import { listerArticles } from "@/services/articles-admin";
import pageStyles from "../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Articles — Espace équipe",
};

const NOTIFICATIONS = {
  supprime: { texte: "L'article a été supprimé." },
  echec: { texte: "La suppression a échoué. Réessayez dans un instant.", erreur: true },
};

// Liste de tous les articles (brouillons compris), pour l'équipe.
// Comme tout l'espace équipe : rendu à la demande, derrière <Suspense>,
// après le contrôle d'accès.
export default function PageArticlesAdmin({ searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des articles…</p>}>
        <ListeArticles searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ListeArticles({ searchParams }) {
  // 1. Contrôle d'accès, avant toute lecture (redirige si refusé).
  const { supabase } = await verifierAccesAdmin();

  const notification = NOTIFICATIONS[(await searchParams).etat];

  // 2. Lecture des articles.
  let articles;
  try {
    articles = await listerArticles(supabase);
  } catch (erreur) {
    console.error("Liste des articles indisponible :", erreur.message);
    return (
      <>
        <Entete />
        <p className={pageStyles.erreur} role="alert">
          Les articles n&apos;ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      </>
    );
  }

  return (
    <>
      <Entete />

      {notification && (
        <p
          className={`${styles.notification} ${notification.erreur ? styles.notificationErreur : ""}`}
          role="status"
        >
          {notification.texte}
        </p>
      )}

      {articles.length === 0 ? (
        <p className={pageStyles.vide}>Aucun article pour le moment.</p>
      ) : (
        <ul className={styles.liste}>
          {articles.map((article) => (
            <li key={article.id_article} className={styles.ligne}>
              <h2 className={styles.titreLigne}>{article.titre}</h2>
              <p className={styles.infosLigne}>
                <span className={styles.statut} data-statut={article.statut}>
                  {article.statut === "PUBLIE" ? "Publié" : "Brouillon"}
                </span>
                {article.statut === "PUBLIE" && article.published_at && (
                  <span>Publié le {dateCourte(article.published_at)}</span>
                )}
                <span>Modifié le {dateCourte(article.updated_at)}</span>
              </p>
              <p className={styles.liensLigne}>
                <Link prefetch={false} href={`/admin/articles/${article.id_article}`}>Modifier</Link>
                <Link prefetch={false} href={`/admin/articles/${article.id_article}/apercu`}>Aperçu</Link>
                {article.statut === "PUBLIE" && (
                  <a href={`/articles/${article.slug}`} target="_blank" rel="noopener">
                    Voir sur le site <span aria-hidden="true">↗</span>
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Entete() {
  return (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link prefetch={false} href="/admin" className={styles.retour}>
          <span aria-hidden="true">←</span> Tableau de bord
        </Link>
        <h1 className={pageStyles.titre}>Articles</h1>
      </div>
      <Link prefetch={false} href="/admin/articles/nouveau" className="bouton">
        Écrire un article
      </Link>
    </header>
  );
}
