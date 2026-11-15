import Link from "next/link";
import { NAVIGATION } from "@/lib/site";
import styles from "./Footer.module.css";

// Pied de page : les mêmes pages que le menu (lib/site.js), puis l'accès
// de l'équipe.
export default function Footer() {
  return (
    <footer className={styles.pied}>
      <div className={`conteneur ${styles.contenu}`}>
        <nav className={styles.liens} aria-label="Pied de page">
          {NAVIGATION.map((page) => (
            <Link key={page.href} href={page.href}>
              {page.libelle}
            </Link>
          ))}
          {/* Accès de l'équipe : discret, absent du menu principal. La page
              est protégée par la connexion et l'autorisation. Pas de
              préchargement : inutile pour les visiteurs. */}
          <Link href="/admin" prefetch={false} className={styles.lienEquipe}>
            Espace équipe
          </Link>
        </nav>
        <p>Supernova — collectif étudiant indépendant, Béjaïa.</p>
      </div>
    </footer>
  );
}
