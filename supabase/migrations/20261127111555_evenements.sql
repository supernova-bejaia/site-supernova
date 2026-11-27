-- =====================================================================
-- Supernova — Migration : événements
--
-- Les événements quittent le fichier src/content/evenements.js (vide) et
-- se gèrent depuis l'espace équipe. Les visiteurs lisent les événements
-- publiés et s'inscrivent à ceux qui le demandent.
--
--   1. evenement              : les événements
--   2. photo_evenement        : leurs photos (stockage « evenements »)
--   3. suivi_evenement        : responsable et bilan, internes à l'équipe
--   4. partenaire_evenement   : partenaires, sponsors, intervenants liés
--                               (internes à l'équipe, jamais publiés)
--   5. inscription_evenement  : qui s'inscrit, qui vient
--   6. fonctions              : inscrire_evenement (public),
--                               ajouter_participant, coordonnees_inscrits,
--                               peut_modifier_evenement (équipe)
--   7. règles d'accès, selon les niveaux (mon_niveau)
--   8. stockage des photos
--
-- Droits (document de cadrage) :
--   membre (1)    : crée un événement en brouillon et modifie les siens ;
--                   envoie des photos ; pointe les présences
--   Head of (2)   : modifie tout, publie, annule, termine ; valide les
--                   photos ; retire un inscrit
--   direction (3) : supprime définitivement ; voit l'email et le
--                   téléphone des inscrits
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EVENEMENT
-- Pas de catégorie : le cadrage ne distingue pas de types d'événements.
-- ---------------------------------------------------------------------
create table public.evenement (
  id_evenement        uuid primary key default gen_random_uuid(),
  -- Partie de l'adresse : /evenements/<slug>. Minuscules, chiffres, tirets.
  slug                text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  titre               text not null check (char_length(titre) between 1 and 200),
  resume              text not null default '' check (char_length(resume) <= 500),
  description         text check (char_length(description) <= 10000),
  lieu_nom            text not null check (char_length(lieu_nom) between 1 and 150),
  lieu_ville          text not null check (char_length(lieu_ville) between 1 and 100),
  debut               timestamptz not null,
  fin                 timestamptz,
  -- Prix en dinars. Vide = gratuit (0 n'est pas accepté, pour qu'il n'y
  -- ait qu'une seule façon de dire « gratuit »).
  prix                numeric(10, 2) check (prix > 0),
  -- Invités et intervenants, un par ligne (texte affiché sur le site).
  invites             text check (char_length(invites) <= 2000),
  inscription_requise boolean not null default false,
  -- Formulaire d'inscription tenu ailleurs (facultatif). S'il est rempli,
  -- le site renvoie vers lui au lieu d'afficher son propre formulaire.
  lien_inscription    text check (lien_inscription ~ '^https?://\S+$' and char_length(lien_inscription) <= 500),
  statut              text not null default 'BROUILLON'
                      check (statut in ('BROUILLON', 'PUBLIE', 'ANNULE', 'TERMINE')),
  mise_en_avant       boolean not null default false,
  id_saison           uuid references public.saison (id_saison),
  -- Compte qui a créé l'événement (droits du membre sur ses brouillons).
  -- Rempli par la base, jamais lisible depuis le site.
  id_auteur           uuid default auth.uid() references auth.users (id) on delete set null,
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
create index evenement_saison_idx on public.evenement (id_saison);
create index evenement_auteur_idx on public.evenement (id_auteur);

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
  -- Une photo n'est montrée au public qu'une fois validée par un Head of.
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
-- lisibles par le public (la lecture publique d'evenement porte sur la
-- ligne entière).
--
-- Responsable : facultatif, un seul pour l'instant, obligatoirement un
-- membre du Noyau. (Plusieurs responsables viendront peut-être plus tard ;
-- ce sera alors une table à part.)
-- ---------------------------------------------------------------------
create table public.suivi_evenement (
  id_evenement    uuid primary key references public.evenement (id_evenement) on delete cascade,
  id_responsable  uuid references public.personne (id_personne) on delete set null,
  ce_qui_a_marche text check (char_length(ce_qui_a_marche) <= 5000),
  difficultes     text check (char_length(difficultes) <= 5000),
  a_ameliorer     text check (char_length(a_ameliorer) <= 5000),
  ressources      text check (char_length(ressources) <= 5000),   -- liens, un par ligne
  updated_at      timestamptz not null default now()
);

comment on table public.suivi_evenement is
  'Responsable et bilan d''un événement. Réservé à l''équipe.';

create index suivi_evenement_responsable_idx on public.suivi_evenement (id_responsable);

create trigger suivi_evenement_maj_updated_at
  before update on public.suivi_evenement
  for each row
  execute function public.maj_updated_at();

-- Le responsable doit être un membre du Noyau (vérifié aussi pour une
-- saisie directe dans Supabase). Un responsable déjà en place qui n'est
-- plus membre reste affiché : l'historique n'est pas réécrit.
create or replace function public.verifier_responsable_evenement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id_responsable is not null
     and new.id_responsable is distinct from (case when tg_op = 'UPDATE' then old.id_responsable end)
     and not public.est_membre(new.id_responsable) then
    raise exception 'Le responsable doit être un membre du Noyau.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.verifier_responsable_evenement() from public, anon, authenticated;

create trigger suivi_evenement_verifier_responsable
  before insert or update on public.suivi_evenement
  for each row
  execute function public.verifier_responsable_evenement();

-- ---------------------------------------------------------------------
-- 4. PARTENAIRE_EVENEMENT : partenaires, sponsors, intervenants, lieux
-- Un contact du carnet, ou à défaut le nom d'une organisation. Interne à
-- l'équipe : rien n'est affiché sur le site sans l'accord du partenaire.
-- ---------------------------------------------------------------------
create table public.partenaire_evenement (
  id_lien      uuid primary key default gen_random_uuid(),
  id_evenement uuid not null references public.evenement (id_evenement) on delete cascade,
  -- Si le contact est supprimé du carnet, le lien garde l'organisation.
  id_contact   uuid references public.contact (id_contact) on delete set null,
  organisation text check (char_length(btrim(organisation)) between 1 and 150),
  role         text not null check (role in ('PARTENAIRE', 'SPONSOR', 'INTERVENANT', 'LIEU', 'AUTRE')),
  note         text check (char_length(note) <= 500 and public.sans_coordonnees(note)),
  created_at   timestamptz not null default now(),
  check (id_contact is not null or organisation is not null)
);

create index partenaire_evenement_evenement_idx on public.partenaire_evenement (id_evenement);
create index partenaire_evenement_contact_idx on public.partenaire_evenement (id_contact);

-- ---------------------------------------------------------------------
-- 5. INSCRIPTION_EVENEMENT : une personne et un événement
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
-- 6. FONCTIONS
-- ---------------------------------------------------------------------

-- 6a. Le compte connecté peut-il modifier cet événement ?
-- Un Head of et plus : toujours. Un membre : son brouillon.
create or replace function public.peut_modifier_evenement(p_evenement uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.mon_niveau() >= 2
    or (
      public.mon_niveau() >= 1
      and exists (
        select 1 from public.evenement e
        where e.id_evenement = p_evenement
          and e.id_auteur = (select auth.uid())
          and e.statut = 'BROUILLON'
      )
    );
$$;

comment on function public.peut_modifier_evenement is
  'Vrai si le compte connecté peut modifier cet événement (Head of et plus, ou auteur d''un brouillon).';

-- 6b. Les événements créés par le compte connecté (id_auteur n'est pas
-- lisible depuis le site).
create or replace function public.mes_evenements()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id_evenement
  from public.evenement e
  where public.mon_niveau() >= 1
    and e.id_auteur = (select auth.uid());
$$;

-- 6c. Trouver une personne par son email, ou la créer.
--
-- Prudence : une fiche existante n'est JAMAIS modifiée (ni nom, ni email,
-- ni téléphone). Sinon, n'importe qui connaissant l'email d'une personne
-- pourrait réécrire sa fiche depuis le formulaire public.
--
-- Fonction interne : personne ne peut l'appeler directement.
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

-- 6d. Inscription publique à un événement.
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

  v_id_personne := public.trouver_ou_creer_personne(p_nom, p_prenom, p_email, p_tel);

  insert into public.inscription_evenement as i (id_evenement, id_personne, statut, origine)
  values (p_id_evenement, v_id_personne, 'INSCRIT', 'FORMULAIRE')
  on conflict (id_evenement, id_personne) do update
    set statut = 'INSCRIT'
    where i.statut = 'DESISTE';

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

-- 6e. Ajout d'un participant par l'équipe (par exemple, une personne
-- présente sans inscription préalable). Tout membre du Noyau : le
-- pointage se fait à l'entrée, par qui est là. L'email reste obligatoire,
-- pour reconnaître la personne et éviter les doublons.
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
  if public.mon_niveau() < 1 then
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
  'Membre du Noyau : ajoute une personne (présente ou inscrite) à un événement.';

-- 6f. Email et téléphone des inscrits d'un événement : réservés à la
-- direction, comme toutes les coordonnées des personnes.
create or replace function public.coordonnees_inscrits(p_evenement uuid)
returns table (id_personne uuid, email text, tel text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.mon_niveau() < 3 then
    raise exception 'Coordonnées réservées au Président et au Chief Supervisor.'
      using errcode = '42501';
  end if;

  return query
    select p.id_personne, p.email, p.tel
    from public.inscription_evenement i
    join public.personne p on p.id_personne = i.id_personne
    where i.id_evenement = p_evenement;
end;
$$;

comment on function public.coordonnees_inscrits is
  'Email et téléphone des inscrits d''un événement (direction uniquement).';

revoke execute on function
  public.peut_modifier_evenement(uuid), public.mes_evenements(),
  public.ajouter_participant(uuid, text, text, text, text, text),
  public.coordonnees_inscrits(uuid)
  from public, anon;
grant execute on function
  public.peut_modifier_evenement(uuid), public.mes_evenements(),
  public.ajouter_participant(uuid, text, text, text, text, text),
  public.coordonnees_inscrits(uuid)
  to authenticated;

-- ---------------------------------------------------------------------
-- 7. RÈGLES D'ACCÈS
-- Un visiteur lit les événements publiés et leurs photos validées, et
-- exécute inscrire_evenement. Rien d'autre.
-- ---------------------------------------------------------------------
alter table public.evenement             enable row level security;
alter table public.photo_evenement       enable row level security;
alter table public.suivi_evenement       enable row level security;
alter table public.partenaire_evenement  enable row level security;
alter table public.inscription_evenement enable row level security;

revoke all on public.evenement, public.photo_evenement, public.suivi_evenement,
              public.partenaire_evenement, public.inscription_evenement
  from anon, authenticated;

-- EVENEMENT -------------------------------------------------------------
-- id_auteur n'est ni lisible ni modifiable depuis le site.
grant select (id_evenement, slug, titre, resume, description, lieu_nom, lieu_ville,
              debut, fin, prix, invites, inscription_requise, lien_inscription,
              statut, mise_en_avant, id_saison, published_at, created_at, updated_at)
  on public.evenement to anon, authenticated;
grant insert (slug, titre, resume, description, lieu_nom, lieu_ville, debut, fin, prix,
              invites, inscription_requise, lien_inscription, statut, mise_en_avant,
              id_saison, published_at)
  on public.evenement to authenticated;
grant update (slug, titre, resume, description, lieu_nom, lieu_ville, debut, fin, prix,
              invites, inscription_requise, lien_inscription, statut, mise_en_avant,
              id_saison, published_at)
  on public.evenement to authenticated;
grant delete on public.evenement to authenticated;

-- Publié = publié au moins une fois et pas repassé en brouillon. Un
-- événement annulé ou terminé reste visible (pour prévenir les inscrits,
-- et pour les archives).
create policy "Evenements : lecture publique des publies"
  on public.evenement for select to anon, authenticated
  using (statut <> 'BROUILLON' and published_at is not null);

create policy "Evenements : lecture par l'equipe"
  on public.evenement for select to authenticated
  using ((select public.mon_niveau()) >= 1);

create policy "Evenements : creation"
  on public.evenement for insert to authenticated
  with check (
    (select public.mon_niveau()) >= 1
    and id_auteur = (select auth.uid())
    and (statut = 'BROUILLON' or (select public.mon_niveau()) >= 2)
  );

create policy "Evenements : modification"
  on public.evenement for update to authenticated
  using (
    (select public.mon_niveau()) >= 2
    or ((select public.mon_niveau()) >= 1 and id_auteur = (select auth.uid()) and statut = 'BROUILLON')
  )
  with check (
    (select public.mon_niveau()) >= 2
    or ((select public.mon_niveau()) >= 1 and id_auteur = (select auth.uid()) and statut = 'BROUILLON')
  );

create policy "Evenements : suppression"
  on public.evenement for delete to authenticated
  using (
    (select public.mon_niveau()) >= 3
    or (
      (select public.mon_niveau()) >= 1
      and id_auteur = (select auth.uid())
      and statut = 'BROUILLON'
      and published_at is null
    )
  );

-- PHOTO_EVENEMENT --------------------------------------------------------
grant select on public.photo_evenement to anon, authenticated;
grant insert (id_evenement, chemin, texte_alternatif, legende, credit, ordre, est_couverture, validee)
  on public.photo_evenement to authenticated;
grant update (texte_alternatif, legende, credit, ordre, est_couverture, validee)
  on public.photo_evenement to authenticated;
grant delete on public.photo_evenement to authenticated;

create policy "Photos : lecture publique des validees"
  on public.photo_evenement for select to anon, authenticated
  using (
    validee
    and exists (
      select 1 from public.evenement e
      where e.id_evenement = photo_evenement.id_evenement
        and e.statut <> 'BROUILLON'
        and e.published_at is not null
    )
  );

create policy "Photos : lecture par l'equipe"
  on public.photo_evenement for select to authenticated
  using ((select public.mon_niveau()) >= 1);

-- Tout membre envoie une photo ; elle attend la validation d'un Head of.
create policy "Photos : envoi par un membre"
  on public.photo_evenement for insert to authenticated
  with check (
    (select public.mon_niveau()) >= 2
    or ((select public.mon_niveau()) >= 1 and not validee)
  );

-- Valider, réordonner, choisir la couverture, supprimer : Head of et plus.
create policy "Photos : gestion par un Head of"
  on public.photo_evenement for update to authenticated
  using ((select public.mon_niveau()) >= 2)
  with check ((select public.mon_niveau()) >= 2);

create policy "Photos : suppression par un Head of"
  on public.photo_evenement for delete to authenticated
  using ((select public.mon_niveau()) >= 2);

-- SUIVI_EVENEMENT (responsable, bilan) ------------------------------------
grant select on public.suivi_evenement to authenticated;
grant insert (id_evenement, id_responsable, ce_qui_a_marche, difficultes, a_ameliorer, ressources)
  on public.suivi_evenement to authenticated;
grant update (id_responsable, ce_qui_a_marche, difficultes, a_ameliorer, ressources)
  on public.suivi_evenement to authenticated;

create policy "Suivi : lecture par l'equipe"
  on public.suivi_evenement for select to authenticated
  using ((select public.mon_niveau()) >= 1);

create policy "Suivi : ecriture par qui peut modifier l'evenement"
  on public.suivi_evenement for insert to authenticated
  with check (public.peut_modifier_evenement(id_evenement));

create policy "Suivi : modification par qui peut modifier l'evenement"
  on public.suivi_evenement for update to authenticated
  using (public.peut_modifier_evenement(id_evenement))
  with check (public.peut_modifier_evenement(id_evenement));

-- PARTENAIRE_EVENEMENT -----------------------------------------------------
-- Visible par l'équipe ; un lien vers un contact privé ou invisible n'est
-- vu que si le contact l'est (pas de fuite par l'événement).
grant select on public.partenaire_evenement to authenticated;
grant insert (id_evenement, id_contact, organisation, role, note)
  on public.partenaire_evenement to authenticated;
grant update (id_contact, organisation, role, note)
  on public.partenaire_evenement to authenticated;
grant delete on public.partenaire_evenement to authenticated;

create policy "Partenaires : lecture par l'equipe"
  on public.partenaire_evenement for select to authenticated
  using (
    (select public.mon_niveau()) >= 1
    and (id_contact is null or public.peut_voir_contact(id_contact))
  );

create policy "Partenaires : gestion par qui peut modifier l'evenement"
  on public.partenaire_evenement for insert to authenticated
  with check (
    public.peut_modifier_evenement(id_evenement)
    and (id_contact is null or public.peut_voir_contact(id_contact))
  );

create policy "Partenaires : modification par qui peut modifier l'evenement"
  on public.partenaire_evenement for update to authenticated
  using (public.peut_modifier_evenement(id_evenement))
  with check (
    public.peut_modifier_evenement(id_evenement)
    and (id_contact is null or public.peut_voir_contact(id_contact))
  );

create policy "Partenaires : retrait par qui peut modifier l'evenement"
  on public.partenaire_evenement for delete to authenticated
  using (public.peut_modifier_evenement(id_evenement));

-- INSCRIPTION_EVENEMENT ----------------------------------------------------
-- Les inscriptions s'ajoutent par les fonctions ci-dessus. Tout membre lit
-- la liste (noms) et pointe les présences ; un Head of retire un inscrit.
grant select on public.inscription_evenement to authenticated;
grant update (statut) on public.inscription_evenement to authenticated;
grant delete on public.inscription_evenement to authenticated;

create policy "Inscriptions : lecture par l'equipe"
  on public.inscription_evenement for select to authenticated
  using ((select public.mon_niveau()) >= 1);

create policy "Inscriptions : pointage par un membre"
  on public.inscription_evenement for update to authenticated
  using ((select public.mon_niveau()) >= 1)
  with check ((select public.mon_niveau()) >= 1);

create policy "Inscriptions : retrait par un Head of"
  on public.inscription_evenement for delete to authenticated
  using ((select public.mon_niveau()) >= 2);

-- ---------------------------------------------------------------------
-- 8. STOCKAGE DES PHOTOS
-- Comme les images des articles : espace public en lecture par adresse
-- (noms de fichiers aléatoires), 2 Mo par photo, JPEG, PNG ou WebP. Une
-- photo non validée n'est affichée nulle part sur le site, mais son
-- fichier est lisible par qui connaît son adresse exacte.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evenements',
  'evenements',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Evenements : envoi par un membre"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'evenements' and (select public.mon_niveau()) >= 1);

create policy "Evenements : lecture par l'equipe"
  on storage.objects for select to authenticated
  using (bucket_id = 'evenements' and (select public.mon_niveau()) >= 1);

create policy "Evenements : remplacement par un Head of ou l'auteur du fichier"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'evenements'
    and ((select public.mon_niveau()) >= 2
         or ((select public.mon_niveau()) >= 1 and owner_id = (select auth.uid())::text))
  )
  with check (
    bucket_id = 'evenements'
    and ((select public.mon_niveau()) >= 2
         or ((select public.mon_niveau()) >= 1 and owner_id = (select auth.uid())::text))
  );

create policy "Evenements : suppression par un Head of ou l'auteur du fichier"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evenements'
    and ((select public.mon_niveau()) >= 2
         or ((select public.mon_niveau()) >= 1 and owner_id = (select auth.uid())::text))
  );

-- ---------------------------------------------------------------------
-- DONNÉES DE DÉPART
-- src/content/evenements.js ne contenait aucun événement : rien à reprendre.
-- ---------------------------------------------------------------------
