// Options des cookies de session de l'espace /admin.
// Utilisées par lib/supabase/session.js et par proxy.js : les deux endroits
// qui écrivent ces cookies doivent appliquer exactement les mêmes règles.
//
// - httpOnly : le cookie est invisible pour JavaScript. Même si un script
//   malveillant s'exécutait un jour sur le site, il ne pourrait pas voler
//   la session. Possible ici car le site n'utilise jamais Supabase depuis
//   le navigateur : tout passe par le serveur.
// - secure : le cookie ne voyage qu'en HTTPS. Activé sur Vercel (le site en
//   ligne est toujours en HTTPS) ; désactivé en local, pour que les tests
//   sur téléphone via le Wi-Fi (http://192.168.…) restent possibles.
// - sameSite « lax » : le cookie n'est pas envoyé par les requêtes
//   déclenchées depuis un autre site (protection contre le CSRF).
export const OPTIONS_COOKIES_SESSION = {
  path: "/",
  httpOnly: true,
  secure: Boolean(process.env.VERCEL),
  sameSite: "lax",
};
