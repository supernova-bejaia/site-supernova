import { Suspense } from "react";
import FormulaireNouveauMotDePasse from "@/components/admin/FormulaireNouveauMotDePasse";
import styles from "../admin.module.css";

export const metadata = {
  title: "Nouveau mot de passe — Espace équipe",
};

// Page ouverte depuis l'email « Reset Password » de Supabase.
// Accessible sans être connecté : proxy.js ne fait que rafraîchir la
// session, et cette page n'appelle pas le contrôle d'accès.
export default function PageNouveauMotDePasse() {
  return (
    <div className={`conteneur ${styles.pageConnexion}`}>
      <div className={styles.carteConnexion}>
        <p className="annotation">Espace équipe</p>
        <h1 className={styles.titreConnexion}>Nouveau mot de passe</h1>

        {/* Nécessaire à la lecture de l'adresse par le formulaire. */}
        <Suspense fallback={null}>
          <FormulaireNouveauMotDePasse />
        </Suspense>
      </div>
    </div>
  );
}
