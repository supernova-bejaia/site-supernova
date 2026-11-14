import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { OPTIONS_COOKIES_SESSION } from "./options-cookies";

// Client Supabase lié à la SESSION de la personne connectée (espace /admin).
//
// Il utilise la même clé publique que le site, mais agit avec les droits du
// compte connecté : la base n'accorde la lecture des inscriptions qu'aux
// comptes autorisés (voir la migration acces_admin). La clé secrète
// (service_role) n'est utilisée nulle part.
//
// Le client du site public, sans session, reste lib/supabase/server.js.
export async function creerClientSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !cle) {
    throw new Error("Variables d'environnement Supabase manquantes : voir .env.example.");
  }

  // La session dépend de chaque visite, et la vérification du jeton lit
  // l'heure actuelle : rien de ce qui suit ne doit être préparé à l'avance.
  await connection();

  const magasinCookies = await cookies();

  return createServerClient(url, cle, {
    cookieOptions: OPTIONS_COOKIES_SESSION,
    cookies: {
      getAll() {
        return magasinCookies.getAll();
      },
      setAll(cookiesAEcrire) {
        try {
          cookiesAEcrire.forEach(({ name, value, options }) =>
            magasinCookies.set(name, value, options)
          );
        } catch {
          // Appelé depuis un composant serveur, qui ne peut pas écrire de
          // cookies : sans conséquence, proxy.js rafraîchit déjà la session.
        }
      },
    },
  });
}
