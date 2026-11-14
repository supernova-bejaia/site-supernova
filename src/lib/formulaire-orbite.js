// Listes proposées dans le formulaire d'inscription à l'Orbite.
// Elles sont modifiables ici, sans toucher au reste du code.
// Le formulaire (affichage) et la validation (serveur) lisent ces mêmes
// listes : ils restent donc toujours d'accord entre eux.

export const AUTRE = "Autre";

// Établissements proposés. « Autre » ouvre un champ libre.
export const ETABLISSEMENTS = ["Targa Ouzemour","Aboudaou","El Kseur", "ESTIN", AUTRE];

// Niveaux d'études, regroupés par cycle.
// Les cursus d'ingéniorat, d'architecture et de médecine gardent leur
// propre numérotation : ils ne sont pas ramenés au format L1–M2.
function annees(prefixe, nombre) {
  return Array.from({ length: nombre }, (_, i) => {
    const rang = i === 0 ? "1re" : `${i + 1}e`;
    return `${prefixe} — ${rang} année`;
  });
}

export const NIVEAUX = [
  { cycle: "Licence", niveaux: ["L1", "L2", "L3"] },
  { cycle: "Master", niveaux: ["M1", "M2"] },
  { cycle: "Ingéniorat", niveaux: annees("Ingéniorat", 5) },
  { cycle: "Architecture", niveaux: annees("Architecture", 5) },
  { cycle: "Médecine / Pharmacie", niveaux: annees("Médecine / Pharmacie", 7) },
  { cycle: "Doctorat", niveaux: ["Doctorat"] },
  { cycle: "Autre", niveaux: [AUTRE] },
];

// Liste à plat de toutes les valeurs acceptées (utilisée par la validation).
export const NIVEAUX_VALIDES = NIVEAUX.flatMap((groupe) => groupe.niveaux);

// Suggestions de filières (université de Béjaïa). La saisie reste libre :
// un étudiant d'un autre établissement peut écrire sa propre filière.
export const FILIERES = [
  "Électromécanique",
  "Électronique",
  "Télécommunications",
  "Électrotechnique",
  "Génie civil",
  "Génie des procédés",
  "Génie mécanique",
  "Génie minier",
  "Hydraulique",
  "Mathématiques",
  "Informatique",
  "Physique",
  "Chimie",
  "Sciences biologiques",
  "Biotechnologies",
  "Sciences alimentaires",
  "Écologie et environnement",
  "Hydrobiologie marine et continentale",
  "Sciences économiques",
  "Sciences de gestion",
  "Sciences commerciales",
  "Sciences financières et comptabilité",
  "Droit",
  "Langue anglaise",
  "Langue française",
  "Traduction",
  "Langue et littérature arabes",
  "Langue et culture amazighes",
  "Sociologie",
  "Psychologie",
  "Philosophie",
  "Orthophonie",
  "Sciences de l'information et de la communication",
  "Histoire",
  "STAPS",
  "Architecture",
  "Médecine",
  "Pharmacie",
];
