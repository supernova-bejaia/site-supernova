import { createClient } from "@supabase/supabase-js";

// Client Supabase pour le code qui s'exécute SUR LE SERVEUR
// (services, Server Actions, pages rendues côté serveur).
//
// Il utilise la clé « publishable » : elle ne donne que les droits d'un
// visiteur anonyme, limités par la RLS de la base. La clé secrète
// (service_role) n'est utilisée nulle part dans ce projet.
//
// Ce client n'a pas de session : il sert au site public. L'espace équipe
// /admin utilise lib/supabase/session.js, qui agit avec les droits du
// compte connecté.
export function creerClientSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !cle) {
    throw new Error(
      "Variables d'environnement Supabase manquantes : voir .env.example."
    );
  }

  return createClient(url, cle, {
    // Pas de session utilisateur à mémoriser : le site public n'a pas de connexion.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
