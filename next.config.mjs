// Images des articles et des photos d'événements : elles sont hébergées
// dans le stockage Supabase du projet. On n'autorise que ces deux
// dossiers-là, sur ce serveur-là (lu dans la variable d'environnement,
// jamais écrit en dur).
const adresseSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const imagesAutorisees = adresseSupabase
  ? ["articles", "evenements"].map((dossier) => ({
      protocol: "https",
      hostname: new URL(adresseSupabase).hostname,
      pathname: `/storage/v1/object/public/${dossier}/**`,
    }))
  : [];

// En-têtes de sécurité envoyés avec toutes les pages.
const entetesSecurite = [
  // Le site ne peut pas être affiché dans un cadre sur un autre site
  // (protection contre le « détournement de clic »). Les deux en-têtes
  // disent la même chose : l'ancien et le nouveau standard.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Le navigateur respecte le type annoncé d'un fichier, sans le deviner.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Vers un autre site, seule l'adresse du site est transmise, pas la page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Le site n'utilise ni caméra, ni micro, ni géolocalisation.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // N'annonce pas la technologie utilisée (« X-Powered-By: Next.js »).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: entetesSecurite }];
  },
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
