// Barre d'outils de l'éditeur d'articles : chaque outil insère la syntaxe
// Markdown à la place de la personne qui écrit.
//
// Ce fichier ne contient que de la logique de texte (aucun affichage) :
// la barre elle-même est dessinée par FormulaireArticle.js.

// Les outils, dans l'ordre de la barre.
//   symbole   : ce qui est affiché sur le bouton
//   raccourci : touche à combiner avec Ctrl (ou Cmd sur Mac), facultatif
export const OUTILS = [
  { id: "gras", nom: "Gras", symbole: "G", style: "gras", raccourci: "b" },
  { id: "italique", nom: "Italique", symbole: "I", style: "italique", raccourci: "i" },
  { id: "intertitre", nom: "Intertitre", symbole: "Titre" },
  { id: "sous-titre", nom: "Sous-titre", symbole: "Sous-titre" },
  { id: "lien", nom: "Lien", symbole: "Lien", raccourci: "k" },
  { id: "liste", nom: "Liste à puces", symbole: "• Liste" },
  { id: "liste-numerotee", nom: "Liste numérotée", symbole: "1. Liste" },
  { id: "citation", nom: "Citation", symbole: "Citation" },
];

// Marque de début de ligne : titre, puce, numéro ou citation.
const MARQUE_DE_LIGNE = /^(#{1,6} |[-*] |\d+\. |> )/;

// Calcule le nouveau texte et la nouvelle sélection.
//   texte, debut, fin : le contenu de la zone et la sélection actuelle
// Renvoie { debut, fin, remplacement, selection: [debut, fin] } : la
// portion [debut, fin] du texte est remplacée, puis la sélection placée.
export function calculerOutil(idOutil, texte, debut, fin) {
  const selection = texte.slice(debut, fin);

  // Entoure la sélection (ou un texte d'exemple) de deux marques.
  const entourer = (marque, exemple) => {
    const interieur = selection || exemple;
    return {
      debut,
      fin,
      remplacement: `${marque}${interieur}${marque}`,
      selection: [debut + marque.length, debut + marque.length + interieur.length],
    };
  };

  // Agit sur les lignes entières touchées par la sélection : ajoute le
  // préfixe à chacune, ou le retire si elles l'ont déjà toutes.
  //
  // isoler : pour une liste ou une citation, le bloc doit être séparé du
  // texte voisin par une ligne vide. Sans cela, Markdown rattache la ligne
  // suivante à la liste ou à la citation.
  const prefixerLignes = (prefixe, forme, { isoler = false } = {}) => {
    const debutLigne = texte.lastIndexOf("\n", debut - 1) + 1;
    const finTrouvee = texte.indexOf("\n", fin);
    const finLigne = finTrouvee === -1 ? texte.length : finTrouvee;
    const lignes = texte.slice(debutLigne, finLigne).split("\n");

    const dejaMarquees = lignes.every((ligne) => forme.test(ligne));
    const nouvelles = lignes.map((ligne, index) => {
      // On retire d'abord toute marque de début de ligne existante
      // (titre, puce, numéro, citation), pour passer de l'une à l'autre.
      const nue = ligne.replace(MARQUE_DE_LIGNE, "");
      if (dejaMarquees) return nue;
      return (typeof prefixe === "function" ? prefixe(index) : prefixe) + nue;
    });

    // Lignes vides de séparation, seulement si le voisin est du texte
    // ordinaire (pas une autre ligne du même bloc, ni déjà une ligne vide).
    let avant = "";
    let apres = "";
    if (isoler && !dejaMarquees) {
      const ligneAuDessus = texte.slice(texte.lastIndexOf("\n", debutLigne - 2) + 1, Math.max(debutLigne - 1, 0));
      const finSuivante = texte.indexOf("\n", finLigne + 1);
      const ligneEnDessous = texte.slice(finLigne + 1, finSuivante === -1 ? texte.length : finSuivante);
      if (debutLigne > 0 && ligneAuDessus.trim() && !forme.test(ligneAuDessus)) avant = "\n";
      if (finLigne < texte.length && ligneEnDessous.trim() && !forme.test(ligneEnDessous)) apres = "\n";
    }

    const corps = nouvelles.join("\n");
    const debutCorps = debutLigne + avant.length;
    const finCorps = debutCorps + corps.length;

    return {
      debut: debutLigne,
      fin: finLigne,
      remplacement: avant + corps + apres,
      // Sans sélection au départ, le curseur se place en fin de ligne,
      // prêt à écrire. (Sélectionner la ligne ferait disparaître la marque
      // à la première lettre tapée.) Avec une sélection, le bloc reste
      // sélectionné : on peut enchaîner avec un autre outil.
      selection: debut === fin ? [finCorps, finCorps] : [debutCorps, finCorps],
    };
  };

  switch (idOutil) {
    case "gras":
      return entourer("**", "texte en gras");
    case "italique":
      return entourer("*", "texte en italique");
    case "lien": {
      const libelle = selection || "texte du lien";
      const adresse = "https://";
      const remplacement = `[${libelle}](${adresse})`;
      // Le curseur se place sur l'adresse, prête à être remplacée.
      const debutAdresse = debut + libelle.length + 3;
      return { debut, fin, remplacement, selection: [debutAdresse, debutAdresse + adresse.length] };
    }
    case "intertitre":
      return prefixerLignes("## ", /^## /);
    case "sous-titre":
      return prefixerLignes("### ", /^### /);
    case "liste":
      return prefixerLignes("- ", /^[-*] /, { isoler: true });
    case "liste-numerotee":
      return prefixerLignes((index) => `${index + 1}. `, /^\d+\. /, { isoler: true });
    case "citation":
      return prefixerLignes("> ", /^> /, { isoler: true });
    default:
      return null;
  }
}

// Touche Entrée dans une liste ou une citation : la ligne suivante reçoit
// automatiquement la même marque (« - », le numéro suivant, ou « > »).
// Sur un élément resté vide, Entrée retire la marque : on sort du bloc.
//
// Renvoie le même objet que calculerOutil, ou null s'il n'y a rien de
// particulier à faire (Entrée garde alors son comportement normal).
export function calculerEntree(texte, debut, fin) {
  if (debut !== fin) return null;

  const debutLigne = texte.lastIndexOf("\n", debut - 1) + 1;
  const finTrouvee = texte.indexOf("\n", debut);
  const finLigne = finTrouvee === -1 ? texte.length : finTrouvee;
  const ligne = texte.slice(debutLigne, finLigne);

  const trouve = ligne.match(/^([-*] |(\d+)\. |> )/);
  if (!trouve) return null;
  const marque = trouve[1];

  // Élément vide : on retire la marque, c'est la fin du bloc. Si la ligne
  // du dessus contient du texte, on laisse une ligne vide entre elle et la
  // suite : sans cela, Markdown rattacherait le paragraphe suivant au
  // dernier point de la liste (ou à la citation).
  if (ligne.trim() === marque.trim()) {
    const ligneAuDessus = texte.slice(texte.lastIndexOf("\n", debutLigne - 2) + 1, Math.max(debutLigne - 1, 0));
    const separation = debutLigne > 0 && ligneAuDessus.trim() ? "\n" : "";
    const position = debutLigne + separation.length;
    return { debut: debutLigne, fin: finLigne, remplacement: separation, selection: [position, position] };
  }

  // Curseur dans la marque elle-même : comportement normal.
  if (debut < debutLigne + marque.length) return null;

  const suivante = trouve[2] ? `${Number(trouve[2]) + 1}. ` : marque;
  const position = debut + 1 + suivante.length;
  return { debut, fin, remplacement: `\n${suivante}`, selection: [position, position] };
}

// Applique un outil à la zone de texte.
//   zone       : l'élément <textarea>
//   changer    : fonction qui reçoit le nouveau texte (secours)
//
// L'insertion passe par la commande d'édition du navigateur : ainsi,
// « Annuler » (Ctrl + Z) défait aussi les mises en forme de la barre.
export function appliquerOutil(zone, idOutil, changer) {
  if (!zone) return;
  inserer(zone, calculerOutil(idOutil, zone.value, zone.selectionStart, zone.selectionEnd), changer);
}

// Gère la touche Entrée dans une liste ou une citation. Renvoie vrai si
// elle a été prise en charge (l'appelant annule alors le retour à la ligne
// normal du navigateur).
export function appliquerEntree(zone, changer) {
  if (!zone) return false;
  const resultat = calculerEntree(zone.value, zone.selectionStart, zone.selectionEnd);
  if (!resultat) return false;
  inserer(zone, resultat, changer);
  return true;
}

function inserer(zone, resultat, changer) {
  if (!resultat) return;

  zone.focus();
  zone.setSelectionRange(resultat.debut, resultat.fin);

  // (Un remplacement vide est une suppression : commande différente.)
  const insere =
    typeof document.execCommand === "function" &&
    (resultat.remplacement === ""
      ? resultat.debut === resultat.fin || document.execCommand("delete")
      : document.execCommand("insertText", false, resultat.remplacement));

  if (!insere) {
    // Secours si le navigateur refuse la commande : on remplace le texte
    // directement (l'annulation ne couvrira pas cette modification).
    const nouveau =
      zone.value.slice(0, resultat.debut) + resultat.remplacement + zone.value.slice(resultat.fin);
    zone.value = nouveau;
    changer(nouveau);
  }

  // Le curseur est placé tout de suite, sans attendre l'image suivante :
  // si on le plaçait en différé, une frappe rapide pourrait s'intercaler
  // et le texte tapé partirait au mauvais endroit.
  zone.setSelectionRange(resultat.selection[0], resultat.selection[1]);
}
