import Link from "next/link";
import Apparition from "@/components/mouvement/Apparition";
import styles from "./PageEnPreparation.module.css";

// Gabarit d'une page dont le contenu n'est pas encore écrit : une ouverture
// (repère, titre) puis un message « bientôt disponible ».
//
// Quand une page reçoit son vrai contenu, elle n'utilise plus ce gabarit.
//
//   repere  : petit texte au-dessus du titre
//   titre   : le titre de la page (texte ou éléments)
//   message : la phrase affichée à la place du contenu
export default function PageEnPreparation({ repere, titre, message }) {
  return (
    <>
      <header className={`conteneur ${styles.ouverture}`}>
        <p className={`annotation ${styles.entree}`}>{repere}</p>
        <h1 className={`titre-ouverture ${styles.entree}`}>{titre}</h1>
      </header>

      <section className={`conteneur ${styles.section}`}>
        <Apparition className={styles.vide}>
          <p className={styles.titreVide}>Bientôt disponible</p>
          <p className="chapeau">{message}</p>
          <Link href="/rejoindre" className="bouton">
            Rejoindre l&apos;Orbite
            <span className="fleche" aria-hidden="true">
              →
            </span>
          </Link>
        </Apparition>
      </section>
    </>
  );
}
