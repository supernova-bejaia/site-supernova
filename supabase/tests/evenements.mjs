// Vérification locale de la migration « événements », sans toucher à la
// base en ligne : toutes les migrations sont rejouées dans un Postgres
// embarqué (PGlite), avec de faux schémas « auth » et « storage » qui
// imitent ceux de Supabase. Puis on vérifie les droits et les fonctions.
//
//   npm install --no-save @electric-sql/pglite
//   node supabase/tests/evenements.mjs
//
// Le script s'arrête à la première vérification qui échoue.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

const dossier = join(import.meta.dirname, "..", "migrations");
const db = new PGlite();

// --- Imitation minimale de Supabase -----------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;

  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(),
    bucket_id text, name text);
  alter table storage.objects enable row level security;
`);

for (const fichier of readdirSync(dossier).sort()) {
  await db.exec(readFileSync(join(dossier, fichier), "utf8"));
}

// --- Outils -------------------------------------------------------------
const ADMIN = "00000000-0000-0000-0000-00000000000a";
const MEMBRE = "00000000-0000-0000-0000-00000000000b"; // connecté, non autorisé

async function en(role, sub, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`);
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec("reset role;");
  }
}
const visiteur = (sql, p) => en("anon", null, sql, p);
const admin = (sql, p) => en("authenticated", ADMIN, sql, p);
const membre = (sql, p) => en("authenticated", MEMBRE, sql, p);
const proprietaire = async (sql, p) => (await db.query(sql, p)).rows;

async function refuse(promesse, motif) {
  await assert.rejects(promesse, motif);
}

// --- Données ------------------------------------------------------------
await proprietaire(`insert into auth.users values ('${ADMIN}'), ('${MEMBRE}')`);
await proprietaire(`insert into public.acces_admin (id_utilisateur) values ('${ADMIN}')`);

const [{ id_evenement: OUVERT }] = await proprietaire(`
  insert into public.evenement (slug, titre, lieu_nom, lieu_ville, debut, statut, published_at, inscription_requise)
  values ('atelier', 'Atelier', 'Campus', 'Béjaïa', now() + interval '7 days', 'PUBLIE', now(), true)
  returning id_evenement`);
const [{ id_evenement: BROUILLON }] = await proprietaire(`
  insert into public.evenement (slug, titre, lieu_nom, lieu_ville, debut, inscription_requise)
  values ('brouillon', 'Brouillon', 'Campus', 'Béjaïa', now() + interval '7 days', true)
  returning id_evenement`);
const [{ id_evenement: PASSE }] = await proprietaire(`
  insert into public.evenement (slug, titre, lieu_nom, lieu_ville, debut, statut, published_at, inscription_requise)
  values ('passe', 'Passé', 'Campus', 'Béjaïa', now() - interval '7 days', 'TERMINE', now(), true)
  returning id_evenement`);
await proprietaire(`insert into public.suivi_evenement (id_evenement, responsable) values ($1, 'Amel')`, [OUVERT]);
await proprietaire(`
  insert into public.photo_evenement (id_evenement, chemin, texte_alternatif, ordre, validee) values
    ($1, 'a.jpg', 'Photo validée', 0, true),
    ($1, 'b.jpg', 'Photo à valider', 1, false),
    ($2, 'c.jpg', 'Photo d''un brouillon', 0, true)`, [OUVERT, BROUILLON]);
await proprietaire(`
  insert into public.personne (nom, prenom, email, tel) values ('Existant', 'Ali', 'ali@exemple.dz', '0555000000')`);

// --- Visiteur : lecture ----------------------------------------------------
const lus = await visiteur("select slug from public.evenement order by slug");
assert.deepEqual(lus.map((l) => l.slug), ["atelier", "passe"], "le visiteur ne lit que les publiés");

const photos = await visiteur("select chemin from public.photo_evenement");
assert.deepEqual(photos.map((p) => p.chemin), ["a.jpg"], "le visiteur ne lit que les photos validées d'un publié");

await refuse(visiteur("select * from public.suivi_evenement"), /permission denied/);
await refuse(visiteur("select * from public.inscription_evenement"), /permission denied/);
assert.equal((await visiteur("select * from public.personne")).length, 0, "aucune fiche lisible");

// --- Visiteur : écriture interdite ----------------------------------------
await refuse(visiteur("update public.evenement set titre = 'x'"), /permission denied/);
await refuse(
  visiteur(`insert into public.evenement (slug, titre, lieu_nom, lieu_ville, debut) values ('x','x','x','x', now())`),
  /permission denied/
);
await refuse(visiteur("select public.trouver_ou_creer_personne('a','b','c@d.ef', null)"), /permission denied/);
await refuse(visiteur(`select public.ajouter_participant('${OUVERT}','a','b','c@d.ef')`), /permission denied/);

// --- Visiteur : inscription ------------------------------------------------
const inscrire = (id, email, { nom = "Nouveau", tel = null, orbite = false } = {}) =>
  visiteur("select public.inscrire_evenement($1, $2, 'Nina', $3, $4, $5)", [id, nom, email, tel, orbite]);

await inscrire(OUVERT, "nina@exemple.dz");
await refuse(inscrire(BROUILLON, "nina@exemple.dz"), /INSCRIPTIONS_FERMEES/);
await refuse(inscrire(PASSE, "nina@exemple.dz"), /INSCRIPTIONS_FERMEES/);
await refuse(inscrire(OUVERT, "pas-un-email"), /CHAMP_INVALIDE:email/);

// Fiche existante : ni le nom, ni l'email, ni le téléphone ne changent.
await inscrire(OUVERT, "ALI@exemple.dz", { nom: "Pirate", tel: "0666999999" });
const [ali] = await proprietaire("select nom, email, tel from public.personne where email = 'ali@exemple.dz'");
assert.deepEqual(ali, { nom: "Existant", email: "ali@exemple.dz", tel: "0555000000" });

// Orbite : seulement si la case est cochée, et sans doublon.
const adhesions = (email) =>
  proprietaire(
    "select a.type from public.adhesion a join public.personne p using (id_personne) where p.email = $1",
    [email]
  );
assert.equal((await adhesions("nina@exemple.dz")).length, 0, "case non cochée : pas d'Orbite");
await inscrire(OUVERT, "nina@exemple.dz", { orbite: true });
await inscrire(OUVERT, "nina@exemple.dz", { orbite: true });
assert.deepEqual(await adhesions("nina@exemple.dz"), [{ type: "ORBITE" }]);

// Pas de doublon d'inscription ; un désistement se rattrape ; un présent reste présent.
const statut = async (email) =>
  (
    await proprietaire(
      `select i.statut from public.inscription_evenement i join public.personne p using (id_personne)
       where p.email = $1 and i.id_evenement = $2`,
      [email, OUVERT]
    )
  ).map((l) => l.statut);
assert.deepEqual(await statut("nina@exemple.dz"), ["INSCRIT"]);
await proprietaire("update public.inscription_evenement set statut = 'DESISTE'");
await inscrire(OUVERT, "nina@exemple.dz");
assert.deepEqual(await statut("nina@exemple.dz"), ["INSCRIT"]);
await proprietaire("update public.inscription_evenement set statut = 'PRESENT'");
await inscrire(OUVERT, "nina@exemple.dz");
assert.deepEqual(await statut("nina@exemple.dz"), ["PRESENT"]);

// --- Compte connecté mais non autorisé -----------------------------------
assert.equal((await membre("select * from public.evenement where statut = 'BROUILLON'")).length, 0);
assert.equal((await membre("select * from public.inscription_evenement")).length, 0);
assert.equal((await membre("select * from public.suivi_evenement")).length, 0);
await refuse(membre(`select public.ajouter_participant('${OUVERT}','a','b','c@d.ef')`), /ACCES_REFUSE/);

// --- Équipe autorisée -------------------------------------------------------
assert.equal((await admin("select * from public.evenement")).length, 3, "l'équipe voit tout");
assert.equal((await admin("select * from public.suivi_evenement")).length, 1);

// Présent sans inscription préalable.
await admin(`select public.ajouter_participant('${OUVERT}', 'Sans', 'Inscription', 'sans@exemple.dz')`);
const [ajoute] = await admin(`
  select i.statut, i.origine from public.inscription_evenement i
  join public.personne p using (id_personne) where p.email = 'sans@exemple.dz'`);
assert.deepEqual(ajoute, { statut: "PRESENT", origine: "EQUIPE" });

// Pointage à la main.
await admin("update public.inscription_evenement set statut = 'ABSENT' where origine = 'EQUIPE'");
await refuse(admin("update public.inscription_evenement set statut = 'PERDU'"), /check/);

// Une seule couverture par événement.
await admin("update public.photo_evenement set est_couverture = true where chemin = 'a.jpg'");
await refuse(admin("update public.photo_evenement set est_couverture = true where chemin = 'b.jpg'"), /unique/);

// Statuts et contraintes.
await refuse(admin(`update public.evenement set statut = 'PUBLIE', published_at = null where slug = 'brouillon'`), /check/);
await refuse(admin(`update public.evenement set prix = 0 where slug = 'atelier'`), /check/);
await refuse(admin(`update public.evenement set lien_inscription = 'javascript:alert(1)' where slug = 'atelier'`), /check/);
await admin(`update public.evenement set statut = 'ANNULE' where slug = 'atelier'`);
assert.deepEqual(
  (await visiteur("select slug, statut from public.evenement where slug = 'atelier'"))[0],
  { slug: "atelier", statut: "ANNULE" },
  "un événement annulé reste visible"
);
await refuse(inscrire(OUVERT, "autre@exemple.dz"), /INSCRIPTIONS_FERMEES/);

console.log("Migration événements : toutes les vérifications passent.");
