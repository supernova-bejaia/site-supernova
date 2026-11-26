import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import FormulaireEvenement from "@/components/admin/FormulaireEvenement";
import pageStyles from "../../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Nouvel événement — Espace équipe",
};

// Création d'un événement (enregistré en brouillon).
export default function PageNouvelEvenement() {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement…</p>}>
        <NouvelEvenement />
      </Suspense>
    </div>
  );
}

async function NouvelEvenement() {
  await verifierAccesAdmin();

  return (
    <>
      <header className={pageStyles.entete}>
        <div className={pageStyles.titres}>
          <Link prefetch={false} href="/admin/evenements" className={styles.retour}>
            <span aria-hidden="true">←</span> Événements
          </Link>
          <h1 className={pageStyles.titre}>Nouvel événement</h1>
        </div>
      </header>

      <FormulaireEvenement />
    </>
  );
}
