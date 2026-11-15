// Fabrique le « slug » d'un article à partir d'un texte : la partie de
// l'adresse qui l'identifie (/articles/<slug>).
//
//   "Retour sur la Masterclass : l'été 2026 !" → "retour-sur-la-masterclass-l-ete-2026"
//
// Résultat : minuscules, chiffres et tirets uniquement, sans accents,
// 80 caractères au plus. Peut être vide si le texte ne contient ni lettre
// ni chiffre.
export function creerSlug(texte) {
  return String(texte ?? "")
    .normalize("NFD") // sépare les lettres de leurs accents…
    .replace(/[̀-ͯ]/g, "") // …puis retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // tout le reste devient un tiret
    .replace(/^-+|-+$/g, "") // pas de tiret au début ni à la fin
    .slice(0, 80)
    .replace(/-+$/g, ""); // au cas où la coupe tombe sur un tiret
}
