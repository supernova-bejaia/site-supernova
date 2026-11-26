import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { droitsArticle } from "@/lib/droits";
import { lireArticle, listerMesArticles } from "@/services/articles-admin";
import FormulaireArticle from "@/components/admin/FormulaireArticle";
import pageStyles from "../../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Modifier un article — Espace équipe",
};

const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Modification d'un article existant (brouillon ou publié).
export default function PageModifierArticle({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement de l&apos;article…</p>}>
        <ModifierArticle params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ModifierArticle({ params, searchParams }) {
  // 1. Contrôle d'accès, avant toute lecture (redirige si refusé).
  const { supabase, niveau } = await verifierAccesAdmin();

  const { id } = await params;
  const { etat } = await searchParams;

  // 2. Lecture de l'article, et de ce que le compte connecté peut en faire.
  let article = null;
  let droits = null;
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      const [lu, mesArticles] = await Promise.all([
        lireArticle(supabase, id),
        listerMesArticles(supabase),
      ]);
      article = lu;
      if (article) droits = droitsArticle(article, niveau, mesArticles.has(article.id_article));
    } catch (erreur) {
      console.error("Lecture d'un article impossible :", erreur.message);
      panne = true;
    }
  }

  const entete = (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link prefetch={false} href="/admin/articles" className={styles.retour}>
          <span aria-hidden="true">←</span> Articles
        </Link>
        <h1 className={pageStyles.titre}>
          {droits && !droits.modifier ? "Article" : "Modifier l'article"}
        </h1>
      </div>
      {article && (
        <Link prefetch={false} href={`/admin/articles/${article.id_article}/apercu`} className="bouton bouton-secondaire">
          Aperçu
        </Link>
      )}
    </header>
  );

  if (!article) {
    return (
      <>
        {entete}
        <p className={pageStyles.erreur} role="alert">
          {panne
            ? "L'article n'a pas pu être chargé. Rechargez la page dans un instant."
            : "Cet article n'existe pas ou a été supprimé."}
        </p>
      </>
    );
  }

  return (
    <>
      {entete}

      {etat === "publie" && (
        <p className={styles.notification} role="status">
          L&apos;article est en ligne.{" "}
          <a href={`/articles/${article.slug}`} target="_blank" rel="noopener">
            Voir sur le site <span aria-hidden="true">↗</span>
          </a>
        </p>
      )}
      {etat === "brouillon" && (
        <p className={styles.notification} role="status">
          Brouillon enregistré. Il n&apos;est pas visible du public.
        </p>
      )}

      {droits.modifier ? (
        // « key » : après un enregistrement, le formulaire repart des
        // données à jour (nouvelle image, adresse nettoyée…).
        <FormulaireArticle key={article.updated_at} article={article} droits={droits} />
      ) : (
        <div className={styles.lectureSeule}>
          <h2 className={styles.titreLigne}>{article.titre}</h2>
          <p>
            {article.statut === "PUBLIE"
              ? "Cet article est en ligne : seuls les Head of et la direction peuvent le modifier."
              : "Seuls son auteur (tant qu'il est en brouillon), les Head of et la direction peuvent modifier cet article."}
          </p>
          <Link
            prefetch={false}
            href={`/admin/articles/${article.id_article}/apercu`}
            className="bouton bouton-secondaire"
          >
            Lire l&apos;aperçu
          </Link>
        </div>
      )}
    </>
  );
}
