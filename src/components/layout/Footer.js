import Link from "next/link";
import { EMAIL_CONTACT, NAVIGATION, RESEAUX } from "@/lib/site";
import Logo from "./Logo";
import styles from "./Footer.module.css";

// Pied de page : les mêmes pages que le menu (lib/site.js), en grille
// régulière ; puis une ligne de bas de page avec la mention du collectif
// et l'accès discret de l'équipe.
export default function Footer() {
  return (
    <footer className={styles.pied}>
      <div className={`conteneur ${styles.contenu}`}>
        <div className={styles.marque}>
          <Logo />
          <ul className={styles.contacts}>
            {RESEAUX.map((reseau) => (
              <li key={reseau.url}>
                <a href={reseau.url} target="_blank" rel="noopener noreferrer">
                  {reseau.nom} · {reseau.identifiant}
                  <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
                </a>
              </li>
            ))}
            {EMAIL_CONTACT && (
              <li>
                <a href={`mailto:${EMAIL_CONTACT}`}>{EMAIL_CONTACT}</a>
              </li>
            )}
          </ul>
        </div>

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
