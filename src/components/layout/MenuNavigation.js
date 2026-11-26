"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, RESEAUX } from "@/lib/site";
import styles from "./MenuNavigation.module.css";

// Menu « hamburger » : un bouton dans l'en-tête qui déplie la liste des
// pages du site (définie une seule fois dans lib/site.js).
//
// Accessibilité :
//   - le bouton annonce son état (ouvert / fermé) aux lecteurs d'écran ;
//   - la touche Échap ferme le menu et rend la main au bouton ;
//   - la page en cours est signalée (aria-current) ;
//   - la page derrière ne défile plus tant que le menu est ouvert.
export default function MenuNavigation() {
  const [ouvert, setOuvert] = useState(false);
  const bouton = useRef(null);
  const premierLien = useRef(null);
  // Vrai si le menu a été ouvert au clavier : on place alors le focus sur
  // le premier lien. À la souris ou au doigt, on évite ce cadre de focus.
  const ouvertAuClavier = useRef(false);

  // Menu ouvert : défilement bloqué, focus sur le premier lien, Échap ferme.
  useEffect(() => {
    if (!ouvert) return;

    // Le blocage se fait sur <html> et non sur <body> : comme <html> a déjà
    // « overflow-x: clip », un <body> en « overflow: hidden » deviendrait son
    // propre conteneur de défilement, et l'en-tête collant (avec le bouton
    // « Fermer ») remonterait tout en haut de la page.
    const racine = document.documentElement;
    const debordementAvant = racine.style.overflow;
    racine.style.overflow = "hidden";
    // Signale le menu ouvert : globals.css met alors en pause les
    // animations de la page, invisibles derrière le panneau.
    racine.dataset.menu = "ouvert";
    if (ouvertAuClavier.current) premierLien.current?.focus();

    function surTouche(evenement) {
      if (evenement.key === "Escape") {
        setOuvert(false);
        bouton.current?.focus();
      }
    }
    document.addEventListener("keydown", surTouche);

    return () => {
      racine.style.overflow = debordementAvant;
      delete racine.dataset.menu;
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  const fermer = () => setOuvert(false);

  return (
    <>
      {/* Ordinateur : les pages directement dans la barre du haut. */}
      <nav aria-label="Navigation principale" className={styles.barre}>
        <Suspense fallback={null}>
          <LiensBarre />
        </Suspense>
      </nav>

      <button
        ref={bouton}
        type="button"
        className={styles.bouton}
        aria-expanded={ouvert}
        aria-controls="menu-principal"
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={(evenement) => {
          // « detail » vaut 0 quand le bouton est activé au clavier.
          ouvertAuClavier.current = evenement.detail === 0;
          setOuvert((valeur) => !valeur);
        }}
      >
        <span className={styles.libelleBouton} aria-hidden="true">
          {ouvert ? "Fermer" : "Menu"}
        </span>
        <span className={styles.icone} data-ouvert={ouvert} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Le panneau existe dès le chargement, simplement invisible et
          inerte (ni clic, ni clavier, ni lecteur d'écran) : il n'y a ainsi
          rien à construire au moment du premier clic. */}
      <div
        id="menu-principal"
        className={styles.panneau}
        data-ouvert={ouvert}
        inert={!ouvert}
      >
        <div className="conteneur">
          <nav aria-label="Navigation principale" className={styles.contenu}>
            {/* La liste a besoin de l'adresse de la page en cours. Sur une
                page dont l'adresse n'est connue qu'à la visite (un
                article), Next.js demande de l'isoler dans <Suspense> : le
                bouton du menu, lui, est affiché sans attendre. */}
            <Suspense fallback={null}>
              <ListePages premierLien={premierLien} fermer={fermer} />
            </Suspense>

            {RESEAUX.length > 0 && (
              <div className={styles.reseaux}>
                <p className="annotation">Nos réseaux</p>
                {RESEAUX.map((reseau) => (
                  <a
                    key={reseau.url}
                    href={reseau.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.lienReseau}
                  >
                    {reseau.nom} · {reseau.identifiant}
                    <span aria-hidden="true"> ↗</span>
                    <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
                  </a>
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

// Une page est « en cours » aussi pour ses sous-pages : on reste dans
// « Articles » en lisant un article.
function estActuelle(href, chemin) {
  return href === "/" ? chemin === "/" : chemin === href || chemin.startsWith(`${href}/`);
}

// Les liens de la barre du haut (ordinateur). « Rejoindre » y prend la
// forme d'un bouton.
function LiensBarre() {
  const cheminActuel = usePathname();

  return (
    <ul className={styles.listeBarre}>
      {NAVIGATION.filter((page) => !page.horsBarre).map((page) => (
        <li key={page.href}>
          <Link
            href={page.href}
            className={page.href === "/rejoindre" ? styles.lienBarreAction : styles.lienBarre}
            aria-current={estActuelle(page.href, cheminActuel) ? "page" : undefined}
          >
            {page.libelle}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// La liste des pages, avec la page en cours signalée.
function ListePages({ premierLien, fermer }) {
  const cheminActuel = usePathname();

  return (
    <ol className={styles.liste}>
      {NAVIGATION.map((page, index) => {
        const actuelle = estActuelle(page.href, cheminActuel);

        return (
          <li key={page.href} style={{ "--rang": index }}>
            <Link
              ref={index === 0 ? premierLien : undefined}
              href={page.href}
              className={styles.lien}
              aria-current={actuelle ? "page" : undefined}
              onClick={fermer}
            >
              <span className={styles.numero}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.texteLien}>{page.libelle}</span>
              <span className={styles.fleche} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
