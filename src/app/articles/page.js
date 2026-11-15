import PageEnPreparation from "@/components/layout/PageEnPreparation";
import Apparition from "@/components/mouvement/Apparition";
import CarteArticle from "@/components/articles/CarteArticle";
import { getArticlesPublies } from "@/services/articles";
import styles from "./page.module.css";

export const metadata = {
  title: "Articles",
  description: "Les articles de Supernova, collectif étudiant indépendant de Béjaïa.",
};

// Page « Articles » : la liste des articles publiés, du plus récent au
// plus ancien. Les articles sont écrits depuis l'espace équipe et lus ici
// par le service services/articles.js.
//
// Tant qu'aucun article n'est publié, la page affiche « Bientôt disponible ».
export default async function PageArticles() {
  const articles = await getArticlesPublies();

  const titre = (
    <>
      Nos <span className="accent">articles</span>
    </>
  );

  if (articles.length === 0) {
    return (
      <PageEnPreparation
        repere="À lire"
        titre={titre}
        message="Les premiers articles arrivent prochainement."
      />
    );
  }

  return (
    <>
      <header className={`conteneur ${styles.ouverture}`}>
        <p className={`annotation ${styles.entree}`}>À lire</p>
        <h1 className={`titre-ouverture ${styles.entree}`}>{titre}</h1>
      </header>

      <section className={`conteneur ${styles.liste}`} aria-label="Liste des articles">
        {articles.map((article, index) => (
          <Apparition key={article.id_article} as="article">
            <CarteArticle article={article} prioritaire={index === 0} />
          </Apparition>
        ))}
      </section>
    </>
  );
}
