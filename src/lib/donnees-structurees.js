import { adresseCouverture } from "./articles";
import { EMAIL_CONTACT, RESEAUX, URL_SITE } from "./site";

// Données structurées (schema.org, au format JSON-LD) : elles décrivent
// aux moteurs de recherche ce qu'est la page — le collectif, un événement,
// un article — pour un affichage plus riche dans les résultats.
// Vérifiables avec https://validator.schema.org/

const ORGANISATION = {
  "@type": "Organization",
  name: "Supernova",
  url: URL_SITE,
};

// Le collectif (affiché sur toutes les pages, dans le pied de page).
export function donneesOrganisation() {
  return {
    "@context": "https://schema.org",
    ...ORGANISATION,
    logo: `${URL_SITE}/apple-icon.png`,
    description:
      "Collectif étudiant indépendant basé à Béjaïa, qui relie les étudiants à l'écosystème entrepreneurial algérien.",
    email: EMAIL_CONTACT || undefined,
    address: { "@type": "PostalAddress", addressLocality: "Béjaïa", addressCountry: "DZ" },
    sameAs: RESEAUX.map((reseau) => reseau.url),
  };
}

// Un événement (page /evenements/<slug>), tel que le renvoie services/evenements.js.
export function donneesEvenement(evenement) {
  const url = `${URL_SITE}/evenements/${evenement.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evenement.titre,
    description: evenement.resume || evenement.description,
    url,
    startDate: evenement.debut,
    endDate: evenement.fin ?? undefined,
    eventStatus: `https://schema.org/${evenement.annule ? "EventCancelled" : "EventScheduled"}`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: evenement.lieu.nom,
      address: {
        "@type": "PostalAddress",
        addressLocality: evenement.lieu.ville,
        addressCountry: "DZ",
      },
    },
    image: evenement.photos.length ? evenement.photos.map((photo) => photo.src) : undefined,
    organizer: ORGANISATION,
    performer: evenement.invites.length
      ? evenement.invites.map((nom) => ({ "@type": "Person", name: nom }))
      : undefined,
    offers: {
      "@type": "Offer",
      price: evenement.prix ? Number(evenement.prix) : 0,
      priceCurrency: "DZD",
      url: evenement.lienInscription ?? url,
    },
  };
}

// Un article (page /articles/<slug>), tel que le renvoie services/articles.js.
export function donneesArticle(article) {
  const url = `${URL_SITE}/articles/${article.slug}`;
  const image = adresseCouverture(article.image_couverture);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.titre,
    description: article.resume || undefined,
    url,
    mainEntityOfPage: url,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    image: image ? [image] : undefined,
    author: ORGANISATION,
    publisher: { ...ORGANISATION, logo: `${URL_SITE}/apple-icon.png` },
  };
}
