-- =====================================================================
-- Supernova — Migration : fonctions, départements et niveaux de droits
--
-- Principe : les droits suivent les fonctions, et les fonctions ont une
-- date de début et une date de fin. La base enregistre qui occupe quoi
-- et depuis quand ; les règles d'organisation restent dans le Code
-- Supernova (les listes sont des tables modifiables, pas du code).
--
--   1. departement            : liste modifiable des départements
--   2. fonction               : Président, Chief Supervisor, Head of
--   3. occupation             : qui occupe quelle fonction, de quand à quand
--   4. ajouts                 : adhesion.id_departement, personne.fondateur,
--                               acces_admin.proprietaire
--   5. niveaux                : est_proprietaire(), mon_niveau()
--   6. nommer(), terminer_fonction(), affecter_departement()
--   7. règles d'accès
--
-- Niveaux (le plus élevé l'emporte en cas de cumul) :
--   0 aucun accès   1 membre du Noyau   2 Head of
--   3 direction (Président, Chief Supervisor)   4 compte propriétaire
--
-- Cette migration ne change encore aucun droit existant (articles,
-- carnet, inscrits) : ils seront rattachés aux niveaux ensuite.
-- Le Président et le Chief Supervisor ne peuvent être nommés depuis le
-- site que par le compte propriétaire. Tant qu'il n'existe pas, ces
-- nominations se font dans le tableau de bord Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DEPARTEMENT
-- ---------------------------------------------------------------------
create table public.departement (
  id_departement uuid primary key default gen_random_uuid(),
  nom            text not null check (char_length(btrim(nom)) between 1 and 80),
  description    text check (char_length(description) <= 500),
  actif          boolean not null default true,   -- faux = ne sert plus, gardé pour l'historique
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index departement_nom_unique on public.departement (lower(nom));

create trigger departement_maj_updated_at
  before update on public.departement
  for each row
  execute function public.maj_updated_at();

-- Départements de départ, provisoires (document de cadrage du 24/11/2026).
insert into public.departement (nom) values
  ('Events'), ('Marketing'), ('Membres'), ('Tech');

-- ---------------------------------------------------------------------
-- 2. FONCTION
-- ---------------------------------------------------------------------
create table public.fonction (
  code            text primary key check (code ~ '^[A-Z][A-Z_]{1,39}$'),
  libelle         text not null check (char_length(btrim(libelle)) between 1 and 80),
  niveau          smallint not null check (niveau between 2 and 3),
  par_departement boolean not null default false   -- vrai : rattachée à un département
);

insert into public.fonction (code, libelle, niveau, par_departement) values
  ('PRESIDENT',        'Président',        3, false),
  ('CHIEF_SUPERVISOR', 'Chief Supervisor', 3, false),
  ('HEAD_OF',          'Head of',          2, true);

-- ---------------------------------------------------------------------
-- 3. OCCUPATION : une personne occupe une fonction, de debut à fin
-- Une occupation est en cours tant que fin est vide. Un mandat se
-- termine à la nomination du successeur (fonction nommer).
-- ---------------------------------------------------------------------
create table public.occupation (
  id_occupation  uuid primary key default gen_random_uuid(),
  id_personne    uuid not null references public.personne (id_personne) on delete cascade,
  code_fonction  text not null references public.fonction (code),
  id_departement uuid references public.departement (id_departement) on delete restrict,
  debut          date not null default current_date,
  fin            date,
  nomme_par      uuid references public.personne (id_personne) on delete set null,
  motif_fin      text check (char_length(motif_fin) <= 500),
  created_at     timestamptz not null default now(),
  check (fin is null or fin >= debut)
);

-- Un seul titulaire en cours par fonction (et par département pour un
-- Head of). Une même personne peut cumuler des fonctions différentes.
create unique index occupation_un_titulaire
  on public.occupation (code_fonction, coalesce(id_departement, '00000000-0000-0000-0000-000000000000'::uuid))
  where fin is null;

create index occupation_personne_idx    on public.occupation (id_personne);
create index occupation_departement_idx on public.occupation (id_departement);
create index occupation_nomme_par_idx   on public.occupation (nomme_par);

-- Vérifications, y compris pour une saisie directe dans Supabase :
-- département obligatoire pour un Head of et interdit sinon ; une
-- nouvelle fonction ne s'ouvre que pour un membre du Noyau.
create or replace function public.verifier_occupation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_par_departement boolean;
begin
  select f.par_departement into v_par_departement
  from public.fonction f
  where f.code = new.code_fonction;

  if v_par_departement and new.id_departement is null then
    raise exception 'Cette fonction est rattachée à un département : précisez-le.'
      using errcode = '23514';
  end if;
  if not v_par_departement and new.id_departement is not null then
    raise exception 'Cette fonction n''est rattachée à aucun département.'
      using errcode = '23514';
  end if;

  if new.fin is null and not exists (
    select 1 from public.adhesion ad
    where ad.id_personne = new.id_personne
      and ad.type = 'NOYAU'
      and ad.statut = 'ACTIVE'
  ) then
    raise exception 'Seul un membre du Noyau peut occuper une fonction.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.verifier_occupation() from public, anon, authenticated;

create trigger occupation_verifier
  before insert or update on public.occupation
  for each row
  execute function public.verifier_occupation();

-- ---------------------------------------------------------------------
-- 4. Ajouts aux tables existantes
-- ---------------------------------------------------------------------

-- Département d'un membre du Noyau, pour la saison de l'adhésion.
alter table public.adhesion
  add column id_departement uuid
  references public.departement (id_departement) on delete restrict;

alter table public.adhesion
  add constraint adhesion_departement_noyau
  check (id_departement is null or type = 'NOYAU');

create index adhesion_departement_idx on public.adhesion (id_departement);

-- Fondateur : statut de reconnaissance à vie. Ne donne aucun droit.
alter table public.personne
  add column fondateur boolean not null default false;

-- Compte propriétaire : tous les droits, sert de secours. Un seul.
alter table public.acces_admin
  add column proprietaire boolean not null default false;

create unique index acces_admin_un_proprietaire
  on public.acces_admin (proprietaire) where proprietaire;

-- ---------------------------------------------------------------------
-- 5. Niveaux
-- ---------------------------------------------------------------------
create or replace function public.est_proprietaire()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.acces_admin a
    where a.id_utilisateur = (select auth.uid())
      and a.proprietaire
  );
$$;

comment on function public.est_proprietaire is
  'Vrai si le compte connecté est le compte propriétaire.';

create or replace function public.mon_niveau()
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.est_proprietaire() then 4::smallint
    when not public.je_suis_membre() then 0::smallint
    else coalesce((
      select max(f.niveau)
      from public.occupation o
      join public.fonction f on f.code = o.code_fonction
      where o.id_personne = public.ma_personne()
        and o.fin is null
        and o.debut <= current_date
    ), 1::smallint)
  end;
$$;

comment on function public.mon_niveau is
  'Niveau du compte connecté : 0 aucun, 1 membre, 2 Head of, 3 direction, 4 propriétaire.';

-- ---------------------------------------------------------------------
-- 6. Nominations et affectations
-- SECURITY DEFINER : seules ces fonctions écrivent dans occupation et
-- dans adhesion.id_departement depuis le site. Chacune vérifie le niveau
-- du compte connecté, et personne ne modifie ses propres fonctions.
-- ---------------------------------------------------------------------

-- Nommer quelqu'un. Le titulaire en cours de la même fonction (et du
-- même département) termine son mandat le même jour : c'est la passation.
create or replace function public.nommer(
  p_personne    uuid,
  p_fonction    text,
  p_departement uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moi    uuid := public.ma_personne();
  v_niveau smallint;
  v_id     uuid;
begin
  select f.niveau into v_niveau from public.fonction f where f.code = p_fonction;
  if v_niveau is null then
    raise exception 'Fonction inconnue.' using errcode = '22023';
  end if;

  if v_niveau >= 3 and not public.est_proprietaire() then
    raise exception 'Seul le compte propriétaire nomme le Président et le Chief Supervisor.'
      using errcode = '42501';
  end if;
  if public.mon_niveau() < 3 then
    raise exception 'Seuls le Président et le Chief Supervisor nomment les responsables.'
      using errcode = '42501';
  end if;
  if p_personne is null or p_personne = v_moi then
    raise exception 'Personne ne peut modifier ses propres fonctions.'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.occupation o
    where o.code_fonction = p_fonction
      and o.id_departement is not distinct from p_departement
      and o.fin is null
      and o.id_personne = p_personne
  ) then
    raise exception 'Cette personne occupe déjà cette fonction.' using errcode = '22023';
  end if;

  update public.occupation o
  set fin = current_date,
      motif_fin = 'Passation : successeur nommé'
  where o.code_fonction = p_fonction
    and o.id_departement is not distinct from p_departement
    and o.fin is null;

  insert into public.occupation (id_personne, code_fonction, id_departement, nomme_par)
  values (p_personne, p_fonction, p_departement, v_moi)
  returning id_occupation into v_id;

  return v_id;
end;
$$;

comment on function public.nommer is
  'Nomme une personne à une fonction ; le titulaire en cours termine son mandat (passation).';

-- Retirer une fonction, avec un motif obligatoire.
create or replace function public.terminer_fonction(
  p_occupation uuid,
  p_motif      text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_personne uuid;
  v_niveau   smallint;
begin
  select o.id_personne, f.niveau into v_personne, v_niveau
  from public.occupation o
  join public.fonction f on f.code = o.code_fonction
  where o.id_occupation = p_occupation
    and o.fin is null;

  if v_personne is null then
    raise exception 'Aucune fonction en cours ne correspond.' using errcode = '22023';
  end if;
  if v_niveau >= 3 and not public.est_proprietaire() then
    raise exception 'Seul le compte propriétaire retire le Président ou le Chief Supervisor.'
      using errcode = '42501';
  end if;
  if public.mon_niveau() < 3 then
    raise exception 'Seuls le Président et le Chief Supervisor retirent une fonction.'
      using errcode = '42501';
  end if;
  if v_personne = public.ma_personne() then
    raise exception 'Personne ne peut modifier ses propres fonctions.' using errcode = '42501';
  end if;
  if nullif(btrim(p_motif), '') is null then
    raise exception 'Le motif est obligatoire.' using errcode = '22023';
  end if;

  update public.occupation
  set fin = current_date,
      motif_fin = btrim(p_motif)
  where id_occupation = p_occupation;
end;
$$;

comment on function public.terminer_fonction is
  'Termine une fonction en cours, avec un motif (direction ; propriétaire pour la direction).';

-- Affecter un membre du Noyau à un département pour la saison de son
-- adhésion (vide = aucun département).
create or replace function public.affecter_departement(
  p_adhesion    uuid,
  p_departement uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_personne uuid;
  v_type     text;
begin
  if public.mon_niveau() < 3 then
    raise exception 'Seuls le Président et le Chief Supervisor affectent les départements.'
      using errcode = '42501';
  end if;

  select ad.id_personne, ad.type into v_personne, v_type
  from public.adhesion ad
  where ad.id_adhesion = p_adhesion;

  if v_personne is null then
    raise exception 'Adhésion inconnue.' using errcode = '22023';
  end if;
  if v_type <> 'NOYAU' then
    raise exception 'Seule une adhésion au Noyau a un département.' using errcode = '22023';
  end if;
  if v_personne = public.ma_personne() then
    raise exception 'Personne ne modifie sa propre affectation.' using errcode = '42501';
  end if;
  if p_departement is not null and not exists (
    select 1 from public.departement d
    where d.id_departement = p_departement and d.actif
  ) then
    raise exception 'Département inconnu ou inactif.' using errcode = '22023';
  end if;

  update public.adhesion
  set id_departement = p_departement
  where id_adhesion = p_adhesion;
end;
$$;

comment on function public.affecter_departement is
  'Affecte une adhésion NOYAU à un département (direction uniquement, jamais soi-même).';

-- ---------------------------------------------------------------------
-- 7. Règles d'accès
-- Lecture : les membres voient les départements, les fonctions et qui
-- les occupe (données de travail). Écriture : départements par la
-- direction ; fonctions dans Supabase seulement ; occupations par les
-- fonctions ci-dessus seulement.
-- ---------------------------------------------------------------------
alter table public.departement enable row level security;
alter table public.fonction    enable row level security;
alter table public.occupation  enable row level security;

revoke all on public.departement, public.fonction, public.occupation from anon, authenticated;

grant select on public.departement, public.fonction, public.occupation to authenticated;
grant insert (nom, description, actif) on public.departement to authenticated;
grant update (nom, description, actif) on public.departement to authenticated;
grant delete on public.departement to authenticated;

create policy "Departements : lecture par les membres"
  on public.departement for select to authenticated
  using ((select public.mon_niveau()) >= 1);

create policy "Departements : gestion par la direction"
  on public.departement for all to authenticated
  using ((select public.mon_niveau()) >= 3)
  with check ((select public.mon_niveau()) >= 3);

create policy "Fonctions : lecture par les membres"
  on public.fonction for select to authenticated
  using ((select public.mon_niveau()) >= 1);

create policy "Occupations : lecture par les membres"
  on public.occupation for select to authenticated
  using ((select public.mon_niveau()) >= 1);

revoke execute on function
  public.est_proprietaire(), public.mon_niveau(),
  public.nommer(uuid, text, uuid), public.terminer_fonction(uuid, text),
  public.affecter_departement(uuid, uuid)
  from public, anon;
grant execute on function
  public.est_proprietaire(), public.mon_niveau(),
  public.nommer(uuid, text, uuid), public.terminer_fonction(uuid, text),
  public.affecter_departement(uuid, uuid)
  to authenticated;
