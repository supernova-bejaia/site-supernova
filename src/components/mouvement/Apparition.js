"use client";

import { useEffect, useRef, useState } from "react";

// Fait apparaître son contenu en douceur quand il entre à l'écran.
// L'apparition ne se joue qu'une fois. Les styles sont dans globals.css
// (classe « apparition ») ; sans JavaScript ou avec le mouvement réduit,
// le contenu est simplement visible.
//
// Le composant signale aussi en continu si son contenu est à l'écran
// (attribut « data-ecran ») : les animations qu'il contient (emblèmes…)
// sont mises en pause dès qu'il en sort, pour que le téléphone ne
// travaille pas pour ce qu'on ne voit pas.
//
// delai : décalage en millisecondes, pour enchaîner plusieurs éléments.
// as    : balise à utiliser (« div » par défaut).

// Part de l'élément qui doit être à l'écran pour déclencher l'apparition.
const SEUIL_APPARITION = 0.12;

export default function Apparition({ children, delai = 0, as: Balise = "div", className = "" }) {
  const element = useRef(null);
  const [visible, setVisible] = useState(false);
  const [aLEcran, setALEcran] = useState(false);

  useEffect(() => {
    const cible = element.current;
    if (!cible) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        // Seul le dernier relevé compte : c'est l'état actuel.
        const entree = entrees[entrees.length - 1];
        setALEcran(entree.isIntersecting);
        // (Petite marge sous le seuil, pour les arrondis du navigateur.)
        if (entree.isIntersecting && entree.intersectionRatio >= SEUIL_APPARITION - 0.02) {
          setVisible(true);
        }
      },
      // L'apparition se déclenche un peu avant que l'élément soit
      // entièrement à l'écran. Le seuil 0 sert à savoir quand il en sort.
      { rootMargin: "0px 0px -8% 0px", threshold: [0, SEUIL_APPARITION] }
    );

    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);

  return (
    <Balise
      ref={element}
      className={`apparition ${className}`}
      data-visible={visible}
      data-ecran={aLEcran}
      style={delai ? { "--delai": `${delai}ms` } : undefined}
    >
      {children}
    </Balise>
  );
}
