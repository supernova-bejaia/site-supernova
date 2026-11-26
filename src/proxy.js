import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { OPTIONS_COOKIES_SESSION } from "@/lib/supabase/options-cookies";

// Proxy (anciennement « middleware ») : s'exécute avant chaque requête
// vers /admin, et UNIQUEMENT vers /admin — le site public n'est pas concerné.
//
// Son seul rôle : rafraîchir la session de connexion quand elle expire, et
// transmettre les cookies à jour au navigateur et aux pages. Il ne décide
// pas de l'accès : ce contrôle est fait par chaque page (lib/acces-admin.js)
// et par la base elle-même.
//
// Il transmet aussi aux pages l'adresse demandée (en-tête x-chemin-admin) :
// si la personne n'est pas connectée, la page de connexion la ramènera
// ensuite à cette adresse (par exemple le carnet, depuis l'application
// installée sur téléphone).
// (Lu par lib/acces-admin.js.)
const ENTETE_CHEMIN = "x-chemin-admin";

export async function proxy(request) {
  const chemin = request.nextUrl.pathname + request.nextUrl.search;

  // La suite de la requête, avec l'adresse demandée et les cookies à jour.
  const suivant = () => {
    const entetes = new Headers(request.headers);
    entetes.set(ENTETE_CHEMIN, chemin);
    return NextResponse.next({ request: { headers: entetes } });
  };

  let reponse = suivant();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: OPTIONS_COOKIES_SESSION,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesAEcrire, entetes) {
          cookiesAEcrire.forEach(({ name, value }) => request.cookies.set(name, value));
          reponse = suivant();
          cookiesAEcrire.forEach(({ name, value, options }) =>
            reponse.cookies.set(name, value, options)
          );
          // Empêche la mise en cache d'une réponse qui contient une session.
          Object.entries(entetes ?? {}).forEach(([nom, valeur]) =>
            reponse.headers.set(nom, valeur)
          );
        },
      },
    }
  );

  // Vérifie le jeton et le renouvelle si nécessaire.
  await supabase.auth.getClaims();

  return reponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
