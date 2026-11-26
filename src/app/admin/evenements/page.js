import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { dateCourte } from "@/lib/dates";
import { STATUTS_EVENEMENT } from "@/lib/evenements";
import { listerEvenements } from "@/services/evenements-admin";
import pageStyles from "../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Événements — Espace équipe",
};

// Liste de tous les événements (brouillons compris), du plus récent au plus
// ancien. Rendu à la demande, derrière <Suspense>, après le contrôle d'accès.
export default function PageEvenementsAdmin() {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des événements…</p>}>
        <ListeEvenements />
      </Suspense>
    </div>
  );
}

async function ListeEvenements() {
  const { supabase } = await verifierAccesAdmin();

  let evenements;
  try {
    evenements = await listerEvenements(supabase);
  } catch (erreur) {
    console.error("Liste des événements indisponible :", erreur.message);
    return (
      <>
        <Entete />
        <p className={pageStyles.erreur} role="alert">
          Les événements n&apos;ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      </>
    );
  }

  return (
    <>
      <Entete />

      {evenements.length === 0 ? (
        <p className={pageStyles.vide}>Aucun événement pour le moment.</p>
      ) : (
        <ul className={styles.liste}>
          {evenements.map((evenement) => (
            <li key={evenement.id_evenement} className={styles.ligne}>
              <h2 className={styles.titreLigne}>{evenement.titre}</h2>
              <p className={styles.infosLigne}>
                <span className={styles.statut} data-statut={evenement.statut}>
                  {STATUTS_EVENEMENT[evenement.statut]}
                </span>
                <span>Le {dateCourte(evenement.debut)}</span>
                <span>
                  {evenement.nombreInscrits} inscrit{evenement.nombreInscrits > 1 ? "s" : ""}
                </span>
              </p>
              <p className={styles.liensLigne}>
                <Link prefetch={false} href={`/admin/evenements/${evenement.id_evenement}`}>
                  Modifier
                </Link>
                <Link prefetch={false} href={`/admin/evenements/${evenement.id_evenement}/inscrits`}>
                  Inscrits et pointage
                </Link>
                {evenement.statut !== "BROUILLON" && evenement.published_at && (
                  <a href={`/evenements/${evenement.slug}`} target="_blank" rel="noopener">
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
        <h1 className={pageStyles.titre}>Événements</h1>
      </div>
      <Link prefetch={false} href="/admin/evenements/nouveau" className="bouton">
        Nouvel événement
      </Link>
    </header>
  );
}
