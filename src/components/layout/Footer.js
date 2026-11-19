import Link from "next/link";
import { NAVIGATION } from "@/lib/site";
import styles from "./Footer.module.css";

// Pied de page : les mêmes pages que le menu (lib/site.js), en grille
// régulière ; puis une ligne de bas de page avec la mention du collectif
// et l'accès discret de l'équipe.
export default function Footer() {
  return (
    <footer className={styles.pied}>
      <div className={`conteneur ${styles.contenu}`}>
        <nav aria-label="Pied de page">
          <ul className={styles.liens}>
            {NAVIGATION.map((page) => (
              <li key={page.href}>
                <Link href={page.href}>{page.libelle}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.basDePage}>
          <p>Supernova — collectif étudiant indépendant, Béjaïa.</p>
          {/* Accès de l'équipe : discret, absent du menu principal. La page
              est protégée par la connexion et l'autorisation. Pas de
              préchargement : inutile pour les visiteurs. */}
          <Link href="/admin" prefetch={false} className={styles.lienEquipe}>
            Espace équipe
          </Link>
        </div>
      </div>
    </footer>
  );
}
