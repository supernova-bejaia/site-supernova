// Adresse où revenir après la connexion à l'espace équipe (paramètre
// « suite » de la page de connexion). Utilisé côté serveur et navigateur.
//
// N'accepte qu'une page de l'espace équipe : jamais une adresse
// extérieure (pas de redirection vers un autre site), ni la page de
// connexion elle-même. Renvoie null si l'adresse ne convient pas.
export function adresseDeRetour(adresse) {
  if (typeof adresse !== "string") return null;
  if (!/^\/admin(\/[\w\-/]*)?(\?[\w\-=&%.]*)?$/.test(adresse)) return null;
  if (adresse.startsWith("//") || adresse.startsWith("/admin/connexion")) return null;
  return adresse;
}
