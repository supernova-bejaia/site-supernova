"use client";

import { useEffect, useRef, useState } from "react";

// Fait apparaître son contenu en douceur quand il entre à l'écran.
// L'apparition ne se joue qu'une fois. Les styles sont dans globals.css
// (classe « apparition ») ; sans JavaScript ou avec le mouvement réduit,
// le contenu est simplement visible.
//
// delai : décalage en millisecondes, pour enchaîner plusieurs éléments.
// as    : balise à utiliser (« div » par défaut).
export default function Apparition({ children, delai = 0, as: Balise = "div", className = "" }) {
  const element = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cible = element.current;
    if (!cible) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((entree) => entree.isIntersecting)) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      // Se déclenche un peu avant que l'élément soit entièrement à l'écran.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);

  return (
    <Balise
      ref={element}
      className={`apparition ${className}`}
      data-visible={visible}
      style={delai ? { "--delai": `${delai}ms` } : undefined}
    >
      {children}
    </Balise>
  );
}
