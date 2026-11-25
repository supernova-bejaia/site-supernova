import Link from "next/link";
import Logo from "./Logo";
import MenuNavigation from "./MenuNavigation";
import styles from "./Header.module.css";

// En-tête : le logo, qui ramène à l'accueil, et le menu des pages.
export default function Header() {
  return (
    <header className={styles.entete}>
      <div className={`conteneur ${styles.barre}`}>
        <Link href="/" className={styles.lienLogo} aria-label="Supernova — accueil">
          <Logo prioritaire />
        </Link>
        <MenuNavigation />
      </div>
    </header>
  );
}
