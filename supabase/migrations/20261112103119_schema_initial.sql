-- =====================================================================
-- Supernova — Migration 1 : schéma initial (niveau 1 du MVP)
--
-- Tables créées : personne, saison, adhesion, centre_interet, interet_adhesion
-- Référence : docs/modele-de-donnees.md (MLD d'origine + décisions du 12/11/2026)
--
-- Le bloc « recrutement » du MLD (candidature, entretien, evaluation,
-- historique, fonction, occuper) fera l'objet d'une migration ultérieure.
-- La colonne adhesion.id_candidature sera ajoutée à ce moment-là.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PERSONNE : une ligne par individu, identifié par son email.
-- ---------------------------------------------------------------------
create table public.personne (
  id_personne   uuid primary key default gen_random_uuid(),
  nom           text not null,
  prenom        text not null,
  email         text not null,
  tel           text,
  etablissement text,          -- « fac » dans le MLD d'origine
  filiere       text,
  annee         text,          -- niveau d'études (L1, M2, Ingéniorat 3e année…)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Unicité de l'email sans tenir compte des majuscules.
create unique index personne_email_unique on public.personne (lower(email));

-- ---------------------------------------------------------------------
-- SAISON : une période d'activité de Supernova.
-- ---------------------------------------------------------------------
create table public.saison (
  id_saison  uuid primary key default gen_random_uuid(),
  nom        text not null,
  date_debut date not null,
  date_fin   date,             -- vide tant que la saison est en cours
  statut     text not null check (statut in ('A_VENIR', 'ACTIVE', 'CLOTUREE')),
  check (date_fin is null or date_fin >= date_debut)
);

-- Une seule saison peut être ACTIVE à la fois.
create unique index saison_une_seule_active
  on public.saison (statut) where statut = 'ACTIVE';

-- ---------------------------------------------------------------------
-- ADHESION : le lien entre une personne et une saison (Orbite ou Noyau).
-- ---------------------------------------------------------------------
create table public.adhesion (
  id_adhesion  uuid primary key default gen_random_uuid(),
  id_personne  uuid not null references public.personne (id_personne),
  id_saison    uuid not null references public.saison (id_saison),
  type         text not null check (type in ('ORBITE', 'NOYAU')),
  statut       text not null default 'ACTIVE' check (statut in ('ACTIVE', 'CLOTUREE')),
  date_debut   date not null default current_date,
  date_fin     date,           -- vide tant que l'adhésion est en cours
  attentes     text,           -- « ce que la personne aimerait vivre avec Supernova »
  consentement_newsletter      boolean not null default false,
  date_consentement_newsletter timestamptz,
  created_at   timestamptz not null default now(),
  unique (id_personne, id_saison),   -- une seule adhésion par personne et par saison
  check (date_fin is null or date_fin >= date_debut)
);

create index adhesion_id_saison_idx on public.adhesion (id_saison);

-- ---------------------------------------------------------------------
-- CENTRE_INTERET et INTERET_ADHESION
-- Les centres d'intérêt sont rattachés à l'adhésion (et non à la personne) :
-- ils peuvent être renouvelés à chaque saison.
-- ---------------------------------------------------------------------
create table public.centre_interet (
  id_centre_interet uuid primary key default gen_random_uuid(),
  nom               text not null unique
);

create table public.interet_adhesion (
  id_adhesion       uuid not null references public.adhesion (id_adhesion) on delete cascade,
  id_centre_interet uuid not null references public.centre_interet (id_centre_interet),
  primary key (id_adhesion, id_centre_interet)
);

create index interet_adhesion_centre_idx on public.interet_adhesion (id_centre_interet);

-- ---------------------------------------------------------------------
-- SÉCURITÉ (RLS)
-- RLS activée partout, sans politique : un visiteur ne peut ni lire ni
-- écrire dans ces tables. Les inscriptions passent uniquement par la
-- fonction public.inscrire_orbite (migration suivante).
-- ---------------------------------------------------------------------
alter table public.personne         enable row level security;
alter table public.saison           enable row level security;
alter table public.adhesion         enable row level security;
alter table public.centre_interet   enable row level security;
alter table public.interet_adhesion enable row level security;

-- Seule exception : la liste des centres d'intérêt (donnée non personnelle)
-- est lisible par tous, pour pouvoir l'afficher dans le formulaire.
create policy "Lecture publique des centres d'interet"
  on public.centre_interet
  for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------
-- DONNÉES DE DÉPART
-- ---------------------------------------------------------------------
insert into public.saison (nom, date_debut, statut)
values ('Saison 1', '2026-11-01', 'ACTIVE');

-- Premier jet, modifiable ensuite depuis Supabase.
insert into public.centre_interet (nom) values
  ('Tech & développement'),
  ('Intelligence artificielle'),
  ('Design'),
  ('Photo & vidéo'),
  ('Marketing & communication'),
  ('Entrepreneuriat'),
  ('Événementiel'),
  ('Finance'),
  ('Écriture & contenu');
