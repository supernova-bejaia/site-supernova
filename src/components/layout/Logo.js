import Image from "next/image";
import styles from "./Logo.module.css";

// Logo officiel (Brand Official / Supernova Logo.png) : le mot SUPERNOVA
// en blanc, avec la comète rouge à la place du O. Fond transparent.
export default function Logo({ taille = "normale", prioritaire = false }) {
  const classe = taille === "grande" ? `${styles.logo} ${styles.grande}` : styles.logo;

  return (
    <Image
      src="/marque/logo-supernova-blanc.png"
      alt="Supernova"
      width={1537}
      height={195}
      className={classe}
      priority={prioritaire}
    />
  );
}
