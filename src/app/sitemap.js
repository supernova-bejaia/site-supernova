import { NAVIGATION, URL_SITE } from "@/lib/site";
import { getArticlesPublies } from "@/services/articles";
import { getEvenementsPublies } from "@/services/evenements";

// Plan du site (/sitemap.xml), lu par les moteurs de recherche : les pages
// du menu, puis chaque article et chaque événement publiés. L'espace
// équipe n'y figure pas.
export default async function sitemap() {
  const [articles, evenements] = await Promise.all([getArticlesPublies(), getEvenementsPublies()]);

  return [
    ...NAVIGATION.map((page) => ({ url: `${URL_SITE}${page.href === "/" ? "" : page.href}` })),
    ...articles.map((article) => ({
      url: `${URL_SITE}/articles/${article.slug}`,
      lastModified: article.published_at,
    })),
    ...evenements.map((evenement) => ({
      url: `${URL_SITE}/evenements/${evenement.slug}`,
      lastModified: evenement.modifieLe,
    })),
  ];
}
