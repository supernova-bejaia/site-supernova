import { Suspense } from "react";
import FormulaireConnexion from "@/components/admin/FormulaireConnexion";
import styles from "../admin.module.css";

export const metadata = {
  title: "Connexion — Espace équipe",
};

// Page de connexion à l'espace équipe.
//
// Elle ne lit volontairement ni la session ni l'adresse côté serveur :
// une personne déjà connectée peut aller directement sur /admin, et le
// formulaire lit lui-même « ?acces=refuse ». Ainsi, l'envoi du formulaire
// ne recharge pas la page et le message d'erreur reste affiché.
export default function PageConnexion() {
  return (
    <div className={`conteneur ${styles.pageConnexion}`}>
      <div className={styles.carteConnexion}>
        <p className="annotation">Espace équipe</p>
        <h1 className={styles.titreConnexion}>Connexion</h1>
        <p className={styles.aide}>
          Réservé aux membres autorisés de l&apos;équipe Supernova. Les comptes sont créés par un
          responsable.
        </p>

        {/* Nécessaire à la lecture de l'adresse par le formulaire. */}
        <Suspense fallback={null}>
          <FormulaireConnexion />
        </Suspense>
      </div>
    </div>
  );
}
