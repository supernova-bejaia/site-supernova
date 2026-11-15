"use client";

import { useEffect, useRef, useState } from "react";

// Élément purement décoratif et animé en continu (l'orbite de l'accueil…).
// Son animation est mise en pause dès qu'il sort de l'écran : sans cela,
// elle tournerait indéfiniment, même quand on lit le bas de la page.
//
// L'apparence et l'animation viennent de « className » ; la mise en pause
// est faite par globals.css (classe « decor-anime »).
export default function DecorAnime({ className = "" }) {
  const element = useRef(null);
  const [aLEcran, setALEcran] = useState(false);

  useEffect(() => {
    const cible = element.current;
    if (!cible) return;

    const observateur = new IntersectionObserver((entrees) => {
      setALEcran(entrees[entrees.length - 1].isIntersecting);
    });

    observateur.observe(cible);
    return () => observateur.disconnect();
  }, []);

  return (
    <div
      ref={element}
      className={`decor-anime ${className}`}
      data-ecran={aLEcran}
      aria-hidden="true"
    />
  );
}
