-- =====================================================================
-- Supernova — Migration 3 : accès de l'équipe à l'espace /admin
--
-- Objectif : permettre à quelques comptes autorisés de LIRE les
-- inscriptions depuis le tableau de bord, et à personne d'autre.
--
--   1. acces_admin : la liste des comptes autorisés (fermée à tous)
--   2. est_admin() : répond si la personne connectée est autorisée
--   3. règles de lecture seule sur les tables des inscriptions
--
-- Ce que cette migration ne fait PAS : aucune écriture, aucune
-- suppression, aucun rôle. Le site public reste fermé comme avant :
-- un visiteur anonyme ne lit toujours rien.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Liste des comptes autorisés
-- Un compte de connexion (auth.users) y figure = il peut lire le tableau
-- de bord. Retirer la ligne coupe l'accès immédiatement.
-- ---------------------------------------------------------------------
create table public.acces_admin (
  id_utilisateur uuid primary key references auth.users (id) on delete cascade,
  note           text,          -- ex. « Prénom, rôle »
  created_at     timestamptz not null default now()
);

comment on table public.acces_admin is
  'Comptes autorisés à consulter l''espace équipe /admin.';

-- RLS activée et aucune règle : la table n'est lisible par personne
-- depuis le site. Elle se gère depuis le tableau de bord Supabase.
alter table public.acces_admin enable row level security;

-- ---------------------------------------------------------------------
-- 2. La personne connectée est-elle autorisée ?
-- SECURITY DEFINER : la fonction peut lire acces_admin (fermée au
-- public) ; elle ne renvoie qu'un oui ou un non, jamais la liste.
-- ---------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.acces_admin a
    where a.id_utilisateur = (select auth.uid())
  );
$$;

comment on function public.est_admin is
  'Vrai si le compte connecté figure dans acces_admin.';

-- Seuls les comptes connectés peuvent poser la question.
revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Lecture seule, réservée aux comptes autorisés
-- Les règles existantes ne changent pas : ces règles s'ajoutent.
-- « (select …) » permet à Postgres de n'évaluer est_admin() qu'une fois
-- par requête, et non pour chaque ligne.
-- ---------------------------------------------------------------------
create policy "Lecture par l'equipe autorisee"
  on public.personne
  for select
  to authenticated
  using ((select public.est_admin()));

create policy "Lecture par l'equipe autorisee"
  on public.adhesion
  for select
  to authenticated
  using ((select public.est_admin()));

create policy "Lecture par l'equipe autorisee"
  on public.interet_adhesion
  for select
  to authenticated
  using ((select public.est_admin()));

create policy "Lecture par l'equipe autorisee"
  on public.saison
  for select
  to authenticated
  using ((select public.est_admin()));
