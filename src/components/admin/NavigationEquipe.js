"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { seDeconnecter } from "@/actions/authentification";
import styles from "./NavigationEquipe.module.css";

// Barre de navigation de l'espace équipe, affichée en haut de toutes ses
// pages (sauf la connexion) : on sait toujours où l'on est, et on peut
// toujours revenir au tableau de bord ou aux articles.
//
// Deux précautions, parce que ces pages dépendent de la session :
//   - prefetch={false} : le navigateur ne charge pas ces pages à l'avance,
//     et ne garde donc pas en mémoire une version périmée ;
//   - le site public s'ouvre dans un nouvel onglet, pour ne pas quitter
//     l'espace équipe sans le vouloir.
const PAGES = [
  { href: "/admin", libelle: "Tableau de bord" },
  { href: "/admin/articles", libelle: "Articles" },
];

export default function NavigationEquipe() {
  const chemin = usePathname();

  // La page de connexion n'a pas de navigation : on n'est pas encore entré.
  if (chemin === "/admin/connexion") return null;

  return (
    <nav className={styles.barre} aria-label="Espace équipe">
      <div className={`conteneur ${styles.contenu}`}>
        <span className={styles.etiquette}>Espace équipe</span>

        <ul className={styles.liens}>
          {PAGES.map((page) => {
            const actuelle =
              page.href === "/admin" ? chemin === "/admin" : chemin.startsWith(page.href);
            return (
              <li key={page.href}>
                <Link
                  href={page.href}
                  prefetch={false}
                  className={styles.lien}
                  aria-current={actuelle ? "page" : undefined}
                >
                  {page.libelle}
                </Link>
              </li>
            );
          })}
          <li>
            <a href="/" target="_blank" rel="noopener" className={styles.lien}>
              Site public <span aria-hidden="true">↗</span>
              <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
            </a>
          </li>
        </ul>

        <form action={seDeconnecter}>
          <button type="submit" className={styles.deconnexion}>
            Se déconnecter
          </button>
        </form>
      </div>
    </nav>
  );
}
