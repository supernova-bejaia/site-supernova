// Images de couverture des articles : elles sont hébergées dans le
// stockage Supabase du projet. On n'autorise que ce dossier-là, sur ce
// serveur-là (lu dans la variable d'environnement, jamais écrit en dur).
const adresseSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const imagesAutorisees = adresseSupabase
  ? [
      {
        protocol: "https",
        hostname: new URL(adresseSupabase).hostname,
        pathname: "/storage/v1/object/public/articles/**",
      },
    ]
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: imagesAutorisees,
  },
  experimental: {
    serverActions: {
      // Une image de couverture pèse jusqu'à 2 Mo : la limite d'envoi par
      // défaut (1 Mo) est relevée, avec une marge pour le texte de l'article.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
