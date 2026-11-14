import Link from "next/link";
import Logo from "./Logo";
import styles from "./Header.module.css";

// En-tête volontairement minimal : le logo, qui ramène à l'accueil.
// Les accès « Rejoindre » et « Événements » sont portés par la page d'accueil.
export default function Header() {
  return (
    <header className={styles.entete}>
      <div className={`conteneur ${styles.barre}`}>
        <Link href="/" className={styles.lienLogo} aria-label="Supernova — accueil">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
