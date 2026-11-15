import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { lireArticle } from "@/services/articles-admin";
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
  const { supabase } = await verifierAccesAdmin();

  const { id } = await params;
  const { etat } = await searchParams;

  // 2. Lecture de l'article.
  let article = null;
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      article = await lireArticle(supabase, id);
    } catch (erreur) {
      console.error("Lecture d'un article impossible :", erreur.message);
      panne = true;
    }
  }

  const entete = (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link href="/admin/articles" className={styles.retour}>
          <span aria-hidden="true">←</span> Articles
        </Link>
        <h1 className={pageStyles.titre}>Modifier l&apos;article</h1>
      </div>
      {article && (
        <Link href={`/admin/articles/${article.id_article}/apercu`} className="bouton bouton-secondaire">
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
          <Link href={`/articles/${article.slug}`}>Voir sur le site</Link>
        </p>
      )}
      {etat === "brouillon" && (
        <p className={styles.notification} role="status">
          Brouillon enregistré. Il n&apos;est pas visible du public.
        </p>
      )}

      {/* « key » : après un enregistrement, le formulaire repart des
          données à jour (nouvelle image, adresse nettoyée…). */}
      <FormulaireArticle key={article.updated_at} article={article} />
    </>
  );
}
