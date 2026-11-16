import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import FormulaireArticle from "@/components/admin/FormulaireArticle";
import pageStyles from "../../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Écrire un article — Espace équipe",
};

// Écriture d'un nouvel article.
export default function PageNouvelArticle() {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement…</p>}>
        <NouvelArticle />
      </Suspense>
    </div>
  );
}

async function NouvelArticle() {
  // Contrôle d'accès avant d'afficher le formulaire (redirige si refusé).
  await verifierAccesAdmin();

  return (
    <>
      <header className={pageStyles.entete}>
        <div className={pageStyles.titres}>
          <Link prefetch={false} href="/admin/articles" className={styles.retour}>
            <span aria-hidden="true">←</span> Articles
          </Link>
          <h1 className={pageStyles.titre}>Écrire un article</h1>
        </div>
      </header>

      <FormulaireArticle />
    </>
  );
}
