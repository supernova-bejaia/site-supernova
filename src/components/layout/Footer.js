import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.pied}>
      <div className={`conteneur ${styles.contenu}`}>
        <nav className={styles.liens} aria-label="Pied de page">
          <Link href="/">Accueil</Link>
          <Link href="/rejoindre">Rejoindre</Link>
          <Link href="/evenements">Événements</Link>
          <Link href="/vos-donnees">Vos données</Link>
        </nav>
        <p>Supernova — collectif étudiant indépendant, Béjaïa.</p>
      </div>
    </footer>
  );
}
