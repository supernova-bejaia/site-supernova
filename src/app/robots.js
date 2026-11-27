import { URL_SITE } from "@/lib/site";

// /robots.txt : tout le site est ouvert aux moteurs de recherche, sauf
// l'espace équipe (dont les pages sont en plus marquées « noindex »).
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
