-- =====================================================================
-- Supernova — Migration 5 : événements
--
-- Objectif : les événements quittent le fichier src/content/evenements.js
-- et sont gérés par l'équipe autorisée depuis l'espace /admin. Les
-- visiteurs lisent les événements publiés et s'inscrivent à ceux qui le
-- demandent.
--
--   1. evenement              : les événements
--   2. photo_evenement        : leurs photos (stockage « evenements »)
--   3. suivi_evenement        : responsable et bilan, internes à l'équipe
--   4. inscription_evenement  : qui s'inscrit, qui vient
--   5. fonctions              : inscrire_evenement (public),
--                               ajouter_participant (équipe)
--   6. règles d'accès (RLS) et stockage des photos
--
-- Ce que cette migration ne fait PAS : elle ne modifie aucune table
-- existante (personne, saison, adhesion… restent telles quelles). Elle
-- ajoute seulement des tables qui y font référence. Les personnes créées
-- par une inscription à un événement passent par une fonction, jamais par
-- une écriture directe.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EVENEMENT
-- ---------------------------------------------------------------------
create table public.evenement (
  id_evenement        uuid primary key default gen_random_uuid(),
  -- Partie de l'adresse : /evenements/<slug>. Minuscules, chiffres, tirets.
  slug                text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  titre               text not null check (char_length(titre) between 1 and 200),
  resume              text not null default '' check (char_length(resume) <= 500),
  description         text check (char_length(description) <= 10000),
  categorie           text check (char_length(categorie) <= 60),       -- Masterclass, Atelier…
  lieu_nom            text not null check (char_length(lieu_nom) between 1 and 150),
  lieu_ville          text not null check (char_length(lieu_ville) between 1 and 100),
  debut               timestamptz not null,
  fin                 timestamptz,
  -- Prix en dinars. Vide = gratuit (0 n'est pas accepté, pour qu'il n'y
  -- ait qu'une seule façon de dire « gratuit »).
  prix                numeric(10, 2) check (prix > 0),
  -- Invités et intervenants, un par ligne.
  invites             text check (char_length(invites) <= 2000),
  inscription_requise boolean not null default false,
  -- Formulaire d'inscription tenu ailleurs (facultatif). S'il est rempli,
  -- le site renvoie vers lui au lieu d'afficher son propre formulaire.
  lien_inscription    text check (lien_inscription ~ '^https?://\S+$' and char_length(lien_inscription) <= 500),
  statut              text not null default 'BROUILLON'
                      check (statut in ('BROUILLON', 'PUBLIE', 'ANNULE', 'TERMINE')),
  mise_en_avant       boolean not null default false,
  id_saison           uuid references public.saison (id_saison),
  -- Fixée à la première publication, puis conservée.
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (fin is null or fin >= debut),
  check (statut <> 'PUBLIE' or published_at is not null)
);

comment on table public.evenement is
  'Événements. Visibles du public une fois publiés (PUBLIE, puis ANNULE ou TERMINE), jamais en BROUILLON.';

create index evenement_debut on public.evenement (debut);

create trigger evenement_maj_updated_at
  before update on public.evenement
  for each row
  execute function public.maj_updated_at();

-- ---------------------------------------------------------------------
-- 2. PHOTO_EVENEMENT
-- ---------------------------------------------------------------------
create table public.photo_evenement (
  id_photo         uuid primary key default gen_random_uuid(),
  id_evenement     uuid not null references public.evenement (id_evenement) on delete cascade,
  -- Chemin du fichier dans le stockage « evenements » (pas une adresse complète).
  chemin           text not null unique,
  texte_alternatif text not null check (char_length(btrim(texte_alternatif)) between 1 and 300),
  legende          text check (char_length(legende) <= 300),
  credit           text check (char_length(credit) <= 100),   -- photographe
  ordre            integer not null check (ordre >= 0),
  est_couverture   boolean not null default false,
  -- Une photo n'est montrée au public qu'une fois validée par l'équipe.
  validee          boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (id_evenement, ordre)
);

-- Une seule photo de couverture par événement.
create unique index photo_evenement_une_couverture
  on public.photo_evenement (id_evenement)
  where est_couverture;

-- ---------------------------------------------------------------------
-- 3. SUIVI_EVENEMENT : responsable et bilan
-- Table à part pour que ces informations internes ne soient jamais
-- lisibles par le public (la lecture publique de evenement porte sur la
-- ligne entière).
-- ---------------------------------------------------------------------
create table public.suivi_evenement (
  id_evenement   uuid primary key references public.evenement (id_evenement) on delete cascade,
  responsable    text check (char_length(responsable) <= 150),
  ce_qui_a_marche text check (char_length(ce_qui_a_marche) <= 5000),
  difficultes    text check (char_length(difficultes) <= 5000),
  a_ameliorer    text check (char_length(a_ameliorer) <= 5000),
  ressources     text check (char_length(ressources) <= 5000),   -- liens, un par ligne
  updated_at     timestamptz not null default now()
);

comment on table public.suivi_evenement is
  'Responsable et bilan d''un événement. Réservé à l''équipe autorisée.';

create trigger suivi_evenement_maj_updated_at
  before update on public.suivi_evenement
  for each row
  execute function public.maj_updated_at();

-- ---------------------------------------------------------------------
-- 4. INSCRIPTION_EVENEMENT : une personne et un événement
-- ---------------------------------------------------------------------
create table public.inscription_evenement (
  id_inscription uuid primary key default gen_random_uuid(),
  id_evenement   uuid not null references public.evenement (id_evenement) on delete cascade,
  -- Supprimer une personne (demande de suppression de ses données)
  -- supprime aussi ses inscriptions.
  id_personne    uuid not null references public.personne (id_personne) on delete cascade,
  statut         text not null default 'INSCRIT'
                 check (statut in ('INSCRIT', 'PRESENT', 'ABSENT', 'DESISTE')),
  -- FORMULAIRE : inscrite par le site. EQUIPE : ajoutée par l'équipe
  -- (par exemple, présente sans inscription préalable).
  origine        text not null check (origine in ('FORMULAIRE', 'EQUIPE')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id_evenement, id_personne)
);

create index inscription_evenement_personne on public.inscription_evenement (id_personne);

create trigger inscription_evenement_maj_updated_at
  before update on public.inscription_evenement
  for each row
  execute function public.maj_updated_at();

-- ---------------------------------------------------------------------
-- 5. FONCTIONS
-- ---------------------------------------------------------------------

-- 5a. Trouver une personne par son email, ou la créer.
--
-- Prudence : une fiche existante n'est JAMAIS modifiée (ni nom, ni email,
-- ni téléphone). Sinon, n'importe qui connaissant l'email d'une personne
-- pourrait réécrire sa fiche depuis le formulaire public.
--
-- Fonction interne : personne ne peut l'appeler directement. Elle n'est
-- utilisée que par les deux fonctions suivantes.
create or replace function public.trouver_ou_creer_personne(
  p_nom    text,
  p_prenom text,
  p_email  text,
  p_tel    text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_nom         text := btrim(coalesce(p_nom, ''));
  v_prenom      text := btrim(coalesce(p_prenom, ''));
  v_email       text := lower(btrim(coalesce(p_email, '')));
  v_tel         text := nullif(btrim(coalesce(p_tel, '')), '');
  v_id_personne uuid;
begin
  -- Mêmes vérifications que inscrire_orbite (le téléphone est ici facultatif).
  if v_nom = '' or length(v_nom) > 100 then
    raise exception 'CHAMP_INVALIDE:nom' using errcode = '22023';
  end if;
  if v_prenom = '' or length(v_prenom) > 100 then
    raise exception 'CHAMP_INVALIDE:prenom' using errcode = '22023';
  end if;
  if length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'CHAMP_INVALIDE:email' using errcode = '22023';
  end if;
  if v_tel is not null and v_tel !~ '^[0-9+ ().-]{6,30}$' then
    raise exception 'CHAMP_INVALIDE:tel' using errcode = '22023';
  end if;

  -- Création si l'email est inconnu ; sinon, rien n'est touché.
  insert into public.personne (nom, prenom, email, tel)
  values (v_nom, v_prenom, v_email, v_tel)
  on conflict (lower(email)) do nothing;

  select p.id_personne into v_id_personne
  from public.personne p
  where lower(p.email) = v_email;

  return v_id_personne;
end;
$$;

comment on function public.trouver_ou_creer_personne is
  'Interne : identifiant de la personne qui a cet email, créée si besoin. Ne modifie jamais une fiche existante.';

revoke execute on function public.trouver_ou_creer_personne(text, text, text, text)
  from public, anon, authenticated;

-- 5b. Inscription publique à un événement.
--
-- Seule porte d'entrée du formulaire d'un événement. En une transaction :
--   1. vérifie que l'événement est publié, demande une inscription et
--      n'est pas terminé ;
--   2. trouve ou crée la personne (sans jamais modifier une fiche) ;
--   3. l'inscrit (une seconde inscription ne crée pas de doublon ; une
--      personne qui s'était désistée redevient inscrite) ;
--   4. si la case a été cochée, l'ajoute à l'Orbite de la saison active
--      (sans rien changer à une adhésion existante).
--
-- La réponse est la même, que la personne soit nouvelle ou déjà connue :
-- le formulaire ne révèle pas quels emails existent.
create or replace function public.inscrire_evenement(
  p_id_evenement     uuid,
  p_nom              text,
  p_prenom           text,
  p_email            text,
  p_tel              text    default null,
  p_rejoindre_orbite boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id_personne uuid;
begin
  -- 1. L'événement accepte-t-il des inscriptions ?
  perform 1
  from public.evenement e
  where e.id_evenement = p_id_evenement
    and e.statut = 'PUBLIE'
    and e.published_at is not null
    and e.inscription_requise
    and coalesce(e.fin, e.debut) > now();

  if not found then
    raise exception 'INSCRIPTIONS_FERMEES' using errcode = 'P0001';
  end if;

  -- 2. La personne
  v_id_personne := public.trouver_ou_creer_personne(p_nom, p_prenom, p_email, p_tel);

  -- 3. L'inscription
  insert into public.inscription_evenement as i (id_evenement, id_personne, statut, origine)
  values (p_id_evenement, v_id_personne, 'INSCRIT', 'FORMULAIRE')
  on conflict (id_evenement, id_personne) do update
    set statut = 'INSCRIT'
    where i.statut = 'DESISTE';

  -- 4. L'Orbite, seulement si la personne l'a demandé
  if coalesce(p_rejoindre_orbite, false) then
    insert into public.adhesion (id_personne, id_saison, type)
    select v_id_personne, s.id_saison, 'ORBITE'
    from public.saison s
    where s.statut = 'ACTIVE'
    on conflict (id_personne, id_saison) do nothing;
  end if;
end;
$$;

comment on function public.inscrire_evenement is
  'Inscription publique à un événement publié qui demande une inscription.';

revoke execute on function public.inscrire_evenement(uuid, text, text, text, text, boolean)
  from public;
grant execute on function public.inscrire_evenement(uuid, text, text, text, text, boolean)
  to anon, authenticated;

-- 5c. Ajout d'un participant par l'équipe (par exemple, une personne
-- présente sans inscription préalable). Réservé aux comptes autorisés.
-- Si la personne est déjà dans la liste, seul son statut change.
create or replace function public.ajouter_participant(
  p_id_evenement uuid,
  p_nom          text,
  p_prenom       text,
  p_email        text,
  p_tel          text default null,
  p_statut       text default 'PRESENT'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id_personne uuid;
begin
  if not public.est_admin() then
    raise exception 'ACCES_REFUSE' using errcode = '42501';
  end if;
  if p_statut not in ('INSCRIT', 'PRESENT') then
    raise exception 'CHAMP_INVALIDE:statut' using errcode = '22023';
  end if;
  perform 1 from public.evenement e where e.id_evenement = p_id_evenement;
  if not found then
    raise exception 'EVENEMENT_INCONNU' using errcode = 'P0001';
  end if;

  v_id_personne := public.trouver_ou_creer_personne(p_nom, p_prenom, p_email, p_tel);

  insert into public.inscription_evenement as i (id_evenement, id_personne, statut, origine)
  values (p_id_evenement, v_id_personne, p_statut, 'EQUIPE')
  on conflict (id_evenement, id_personne) do update
    set statut = excluded.statut;
end;
$$;

comment on function public.ajouter_participant is
  'Équipe autorisée : ajoute une personne (présente ou inscrite) à un événement.';

revoke execute on function public.ajouter_participant(uuid, text, text, text, text, text)
  from public, anon;
grant execute on function public.ajouter_participant(uuid, text, text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------
-- 6. RÈGLES D'ACCÈS
-- Un visiteur : lit les événements publiés et leurs photos validées,
-- exécute inscrire_evenement. Rien d'autre.
-- L'équipe autorisée (est_admin) : tout, sur ces quatre tables.
-- ---------------------------------------------------------------------
alter table public.evenement             enable row level security;
alter table public.photo_evenement       enable row level security;
alter table public.suivi_evenement       enable row level security;
alter table public.inscription_evenement enable row level security;

-- Ceinture et bretelles : en plus de la RLS, un visiteur n'a aucun droit
-- d'écriture sur ces tables, ni de lecture sur les deux tables internes.
revoke insert, update, delete, truncate on public.evenement, public.photo_evenement from anon;
revoke all on public.suivi_evenement, public.inscription_evenement from anon;

-- Publié = publié au moins une fois et pas repassé en brouillon. Un
-- événement annulé ou terminé reste visible (pour prévenir les inscrits,
-- et pour les archives).
create policy "Lecture publique des evenements publies"
  on public.evenement
  for select
  to anon, authenticated
  using (statut <> 'BROUILLON' and published_at is not null);

create policy "Gestion par l'equipe autorisee"
  on public.evenement
  for all
  to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

create policy "Lecture publique des photos validees"
  on public.photo_evenement
  for select
  to anon, authenticated
  using (
    validee
    and exists (
      select 1
      from public.evenement e
      where e.id_evenement = photo_evenement.id_evenement
        and e.statut <> 'BROUILLON'
        and e.published_at is not null
    )
  );

create policy "Gestion par l'equipe autorisee"
  on public.photo_evenement
  for all
  to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

create policy "Gestion par l'equipe autorisee"
  on public.suivi_evenement
  for all
  to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

-- Les inscriptions s'ajoutent par les fonctions ci-dessus ; l'équipe les
-- lit, change leur statut (pointage) et peut en retirer une.
create policy "Gestion par l'equipe autorisee"
  on public.inscription_evenement
  for all
  to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

-- ---------------------------------------------------------------------
-- 7. Stockage des photos
-- Même fonctionnement que les images des articles : espace public en
-- lecture par adresse (noms de fichiers aléatoires), 2 Mo par photo,
-- JPEG, PNG ou WebP. Une photo non validée n'est affichée nulle part sur
-- le site, mais son fichier est lisible par qui connaît son adresse exacte.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evenements',
  'evenements',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Evenements : envoi par l'equipe autorisee"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'evenements' and (select public.est_admin()));

create policy "Evenements : lecture par l'equipe autorisee"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'evenements' and (select public.est_admin()));

create policy "Evenements : remplacement par l'equipe autorisee"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'evenements' and (select public.est_admin()))
  with check (bucket_id = 'evenements' and (select public.est_admin()));

create policy "Evenements : suppression par l'equipe autorisee"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'evenements' and (select public.est_admin()));

-- ---------------------------------------------------------------------
-- 8. DONNÉES DE DÉPART
-- Les événements du fichier src/content/evenements.js sont à reprendre
-- ici. Au moment de cette migration, ce fichier ne contient AUCUN
-- événement (sa liste EVENEMENTS est vide, et l'a toujours été dans
-- l'historique du dépôt) : il n'y a donc rien à insérer.
-- ---------------------------------------------------------------------
