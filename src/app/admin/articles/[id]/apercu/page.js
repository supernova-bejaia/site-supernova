import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { lireArticle } from "@/services/articles-admin";
import LectureArticle from "@/components/articles/LectureArticle";
import pageStyles from "../../../admin.module.css";
import adminStyles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Aperçu d'un article — Espace équipe",
};

const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Aperçu d'un article tel qu'il apparaîtra sur le site, brouillon compris.
// Réservé à l'équipe : il montre la dernière version ENREGISTRÉE, avec la
// même mise en page que la page publique (composant LectureArticle).
export default function PageApercuArticle({ params }) {
  return (
    <Suspense fallback={<p className={`conteneur ${pageStyles.chargement}`}>Chargement de l&apos;aperçu…</p>}>
      <Apercu params={params} />
    </Suspense>
  );
}

async function Apercu({ params }) {
  // Contrôle d'accès, avant toute lecture (redirige si refusé).
  const { supabase } = await verifierAccesAdmin();

  const { id } = await params;
  const article = FORMAT_UUID.test(id) ? await lireArticle(supabase, id).catch(() => null) : null;

  if (!article) {
    return (
      <div className={`conteneur ${pageStyles.page}`}>
        <p className={pageStyles.erreur} role="alert">
          Cet article n&apos;existe pas ou n&apos;a pas pu être chargé.
        </p>
        <Link href="/admin/articles" className={adminStyles.retour}>
          <span aria-hidden="true">←</span> Articles
        </Link>
      </div>
    );
  }

  return (
    <article>
      <div className={`conteneur ${pageStyles.page}`}>
        <p className={adminStyles.bandeauApercu}>
          <span>
            Aperçu réservé à l&apos;équipe —{" "}
            {article.statut === "PUBLIE" ? "article en ligne." : "brouillon, invisible du public."}
          </span>
          <Link href={`/admin/articles/${article.id_article}`} className={adminStyles.retour}>
            <span aria-hidden="true">←</span> Modifier
          </Link>
        </p>
      </div>

      <LectureArticle article={article} />
    </article>
  );
}
