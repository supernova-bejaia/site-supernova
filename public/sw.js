// Service worker de l'application « Contacts Supernova » (espace équipe).
//
// Son seul rôle : permettre aux navigateurs (Chrome sur Android, surtout)
// de reconnaître l'espace équipe comme une application installable, et
// donc de proposer le bouton « Installer ».
//
// Il ne met RIEN en cache : chaque requête part au réseau, exactement
// comme sans lui. Aucune page ni aucune donnée de l'équipe n'est donc
// gardée sur le téléphone, et on ne voit jamais une version périmée.
// Conséquence : pas de mode hors ligne.
//
// Il est enregistré avec la portée /admin/ : le site public n'est pas
// concerné.

self.addEventListener("install", () => {
  // La nouvelle version prend la place de l'ancienne sans attendre.
  self.skipWaiting();
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(self.clients.claim());
});

// Pages de l'espace équipe : transmises telles quelles au réseau.
self.addEventListener("fetch", (evenement) => {
  if (evenement.request.mode !== "navigate") return;
  evenement.respondWith(fetch(evenement.request));
});
