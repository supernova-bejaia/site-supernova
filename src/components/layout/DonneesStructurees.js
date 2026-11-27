// Insère des données structurées JSON-LD dans la page (voir
// lib/donnees-structurees.js). Le caractère « < » est échappé : un titre
// saisi dans l'espace équipe ne peut pas refermer la balise <script>.
export default function DonneesStructurees({ donnees }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees).replace(/</g, "\\u003c") }}
    />
  );
}
