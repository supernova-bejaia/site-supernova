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
export async function proxy(request) {
  let reponse = NextResponse.next({ request });

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
          reponse = NextResponse.next({ request });
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
