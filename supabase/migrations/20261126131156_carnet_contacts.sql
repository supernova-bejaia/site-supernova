-- =====================================================================
-- Supernova — Migration : carnet de contacts
--
-- Objectif : centraliser les contacts rencontrés par l'équipe, pour ne
-- plus les perdre, en protégeant les coordonnées confiées sous condition.
--
--   1. acces_admin.id_personne : relie un compte de connexion à sa personne
--   2. fonctions d'identité   : ma_personne(), est_membre(), je_suis_membre(),
--                               liste_membres()
--   3. contact                : la fiche (sans coordonnées)
--   4. contact_organisation   : 0, 1 ou plusieurs organisations, en texte libre
--   5. coordonnee_contact     : téléphones et emails, protégés à part
--   6. acces_contact          : qui voit les coordonnées d'un contact RESTREINT
--   7. fonctions de contrôle  : peut_voir_contact(), peut_voir_coordonnees(),
--                               est_referent()
--   8. règles d'accès (RLS et droits colonne par colonne)
--   9. ajouter_contact()      : enregistre une fiche complète en une fois
--  10. transferer_contact()   : change de référent
--
-- Un membre est une personne qui a une adhésion NOYAU active et dont le
-- compte figure dans acces_admin (relié par id_personne).
--
-- Visibilité d'un contact :
--   EQUIPE    : tous les membres voient la fiche et les coordonnées ;
--   RESTREINT : tous les membres voient la fiche ; les coordonnées sont
--               réservées au référent et aux membres qu'il autorise ;
--   PRIVE     : seul le référent voit la fiche et les coordonnées.
--
-- Ce que cette migration ne fait PAS : aucune donnée n'est créée. Les
-- adhésions NOYAU de l'équipe et le lien compte → personne se renseignent
-- ensuite dans Supabase. Pas de table organisation pour l'instant : le nom
-- de l'organisation est un texte libre.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Relier un compte de connexion à sa personne
-- Si la personne est supprimée, le compte reste autorisé mais n'est plus
-- relié à personne : il ne peut plus utiliser le carnet.
-- ---------------------------------------------------------------------
alter table public.acces_admin
  add column id_personne uuid unique
  references public.personne (id_personne) on delete set null;

comment on column public.acces_admin.id_personne is
  'Personne à qui appartient ce compte. Nécessaire pour utiliser le carnet de contacts.';

-- ---------------------------------------------------------------------
-- 2. Fonctions d'identité
-- SECURITY DEFINER : elles lisent acces_admin (fermée à tous) et ne
-- renvoient qu'un identifiant, un oui/non ou la liste des membres.
-- ---------------------------------------------------------------------

-- La personne du compte connecté (vide si le compte n'est relié à personne).
create or replace function public.ma_personne()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id_personne
  from public.acces_admin a
  where a.id_utilisateur = (select auth.uid());
$$;

comment on function public.ma_personne is
  'Identifiant de la personne reliée au compte connecté.';

-- Une personne est-elle membre : compte autorisé + adhésion NOYAU active ?
create or replace function public.est_membre(p_personne uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_personne is not null
    and exists (
      select 1 from public.acces_admin a
      where a.id_personne = p_personne
    )
    and exists (
      select 1 from public.adhesion ad
      where ad.id_personne = p_personne
        and ad.type = 'NOYAU'
        and ad.statut = 'ACTIVE'
    );
$$;

comment on function public.est_membre is
  'Vrai si la personne a un compte autorisé et une adhésion NOYAU active.';

-- Le compte connecté est-il celui d'un membre ?
create or replace function public.je_suis_membre()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.est_membre(public.ma_personne());
$$;

comment on function public.je_suis_membre is
  'Vrai si le compte connecté est celui d''un membre (voir est_membre).';

-- La liste des membres, pour choisir à qui donner un accès ou transférer
-- un contact. Réservée aux membres ; prénom et nom seulement.
create or replace function public.liste_membres()
returns table (id_personne uuid, prenom text, nom text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id_personne, p.prenom, p.nom
  from public.personne p
  where public.je_suis_membre()
    and public.est_membre(p.id_personne)
  order by p.prenom, p.nom;
$$;

comment on function public.liste_membres is
  'Membres (prénom, nom), visibles des seuls membres.';

-- Une note ne doit contenir ni email ni numéro de téléphone : elle n'est
-- pas protégée comme les coordonnées. Repère un email, ou 9 chiffres ou
-- plus séparés au plus par un espace, un point ou un tiret (un numéro
-- algérien en compte 9 ou 10 ; une date comme 12.11.2026 n'en compte que 8).
create or replace function public.sans_coordonnees(p_texte text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_texte is null
    or (
      p_texte !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
      and p_texte !~ '[0-9]([ .-]?[0-9]){8,}'
    );
$$;

comment on function public.sans_coordonnees is
  'Faux si le texte contient un email ou un numéro de téléphone.';

-- ---------------------------------------------------------------------
-- 3. CONTACT : la fiche, sans aucune coordonnée
-- ---------------------------------------------------------------------
create table public.contact (
  id_contact       uuid primary key default gen_random_uuid(),
  nom              text not null check (char_length(btrim(nom)) between 1 and 150),
  lieu_rencontre   text not null check (char_length(btrim(lieu_rencontre)) between 1 and 200),
  date_rencontre   date not null default current_date,
  raison_rencontre text check (char_length(raison_rencontre) <= 1000),
  -- Membre qui a ajouté le contact. Rempli par la base, jamais par le
  -- formulaire. Vidé si la personne est supprimée.
  ajoute_par       uuid default public.ma_personne()
                   references public.personne (id_personne) on delete set null,
  -- Membre qui suit la relation aujourd'hui. Une personne encore
  -- référente ne peut pas être supprimée : transférer ses contacts d'abord.
  referent         uuid not null default public.ma_personne()
                   references public.personne (id_personne) on delete restrict,
  visibilite       text not null default 'RESTREINT'
                   check (visibilite in ('EQUIPE', 'RESTREINT', 'PRIVE')),
  partenaire       boolean not null default false,
  -- Règles d'usage des coordonnées (ex. « ne pas appeler sans accord »).
  conditions       text check (char_length(conditions) <= 1000 and public.sans_coordonnees(conditions)),
  notes            text check (char_length(notes) <= 5000 and public.sans_coordonnees(notes)),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.contact is
  'Carnet de contacts de l''équipe. Les coordonnées sont dans coordonnee_contact.';

create index contact_referent_idx   on public.contact (referent);
create index contact_ajoute_par_idx on public.contact (ajoute_par);
create index contact_nom_idx        on public.contact (lower(nom));

create trigger contact_maj_updated_at
  before update on public.contact
  for each row
  execute function public.maj_updated_at();

-- ---------------------------------------------------------------------
-- 4. CONTACT_ORGANISATION : les organisations d'un contact, en texte libre
-- Aucune ligne = « sans organisation ».
-- ---------------------------------------------------------------------
create table public.contact_organisation (
  id_lien       uuid primary key default gen_random_uuid(),
  id_contact    uuid not null references public.contact (id_contact) on delete cascade,
  organisation  text not null check (char_length(btrim(organisation)) between 1 and 150),
  poste         text check (char_length(poste) <= 150),
  principale    boolean not null default false,
  actuel        boolean not null default true,   -- faux s'il l'a quittée
  created_at    timestamptz not null default now(),
  unique (id_contact, organisation)
);

-- Une seule organisation principale par contact.
create unique index contact_organisation_une_principale
  on public.contact_organisation (id_contact) where principale;

-- Suggestions de noms déjà saisis.
create index contact_organisation_nom_idx
  on public.contact_organisation (lower(organisation));

-- ---------------------------------------------------------------------
-- 5. COORDONNEE_CONTACT : téléphones et emails, protégés à part
-- ---------------------------------------------------------------------
create table public.coordonnee_contact (
  id_coordonnee uuid primary key default gen_random_uuid(),
  id_contact    uuid not null references public.contact (id_contact) on delete cascade,
  type          text not null check (type in ('TELEPHONE', 'EMAIL')),
  valeur        text not null,
  libelle       text check (char_length(libelle) <= 50),   -- pro, perso, WhatsApp…
  principal     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (id_contact, type, valeur),
  check (
    (type = 'EMAIL'
      and char_length(valeur) <= 254
      and valeur ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
    or
    (type = 'TELEPHONE'
      and valeur ~ '^\+?[0-9][0-9 .()-]{5,28}[0-9]$')
  )
);

-- Un seul numéro principal et un seul email principal par contact.
create unique index coordonnee_contact_un_principal
  on public.coordonnee_contact (id_contact, type) where principal;

-- ---------------------------------------------------------------------
-- 6. ACCES_CONTACT : membres autorisés à voir les coordonnées d'un
-- contact RESTREINT. Ignoré pour un contact EQUIPE ou PRIVE.
-- ---------------------------------------------------------------------
create table public.acces_contact (
  id_contact  uuid not null references public.contact (id_contact) on delete cascade,
  id_membre   uuid not null references public.personne (id_personne) on delete cascade,
  accorde_par uuid default public.ma_personne()
              references public.personne (id_personne) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (id_contact, id_membre)
);

create index acces_contact_membre_idx     on public.acces_contact (id_membre);
create index acces_contact_accorde_par_idx on public.acces_contact (accorde_par);

-- ---------------------------------------------------------------------
-- 7. Fonctions de contrôle
-- SECURITY DEFINER : elles lisent contact et acces_contact sans repasser
-- par leurs propres règles (ce qui bouclerait), et ne renvoient qu'un
-- oui ou un non pour un contact donné.
-- ---------------------------------------------------------------------
create or replace function public.peut_voir_contact(p_contact uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.je_suis_membre()
    and exists (
      select 1 from public.contact c
      where c.id_contact = p_contact
        and (c.visibilite <> 'PRIVE' or c.referent = public.ma_personne())
    );
$$;

create or replace function public.peut_voir_coordonnees(p_contact uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.je_suis_membre()
    and exists (
      select 1 from public.contact c
      where c.id_contact = p_contact
        and (
          c.visibilite = 'EQUIPE'
          or c.referent = public.ma_personne()
          or (
            c.visibilite = 'RESTREINT'
            and exists (
              select 1 from public.acces_contact ac
              where ac.id_contact = c.id_contact
                and ac.id_membre = public.ma_personne()
            )
          )
        )
    );
$$;

create or replace function public.est_referent(p_contact uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.je_suis_membre()
    and exists (
      select 1 from public.contact c
      where c.id_contact = p_contact
        and c.referent = public.ma_personne()
    );
$$;

comment on function public.peut_voir_contact is
  'Vrai si le compte connecté peut voir la fiche de ce contact.';
comment on function public.peut_voir_coordonnees is
  'Vrai si le compte connecté peut voir les coordonnées de ce contact.';
comment on function public.est_referent is
  'Vrai si le compte connecté est le référent de ce contact.';

-- ---------------------------------------------------------------------
-- 8. Règles d'accès
-- Les visiteurs (anon) n'ont aucun droit. Les comptes connectés ont des
-- droits colonne par colonne, puis les règles RLS filtrent les lignes.
-- ---------------------------------------------------------------------
alter table public.contact              enable row level security;
alter table public.contact_organisation enable row level security;
alter table public.coordonnee_contact   enable row level security;
alter table public.acces_contact        enable row level security;

revoke all on public.contact, public.contact_organisation,
              public.coordonnee_contact, public.acces_contact
  from anon, authenticated;

-- CONTACT -------------------------------------------------------------
-- ajoute_par, referent et les dates ne s'écrivent jamais depuis le site :
-- les valeurs par défaut s'appliquent, le transfert passe par
-- transferer_contact().
grant select on public.contact to authenticated;
grant insert (nom, lieu_rencontre, date_rencontre, raison_rencontre,
              visibilite, partenaire, conditions, notes)
  on public.contact to authenticated;
grant update (nom, lieu_rencontre, date_rencontre, raison_rencontre,
              visibilite, partenaire, conditions, notes)
  on public.contact to authenticated;
grant delete on public.contact to authenticated;

create policy "Contact : lecture par les membres"
  on public.contact
  for select
  to authenticated
  using (
    (select public.je_suis_membre())
    and (visibilite <> 'PRIVE' or referent = (select public.ma_personne()))
  );

create policy "Contact : ajout par un membre, qui en devient referent"
  on public.contact
  for insert
  to authenticated
  with check (
    (select public.je_suis_membre())
    and referent = (select public.ma_personne())
    and ajoute_par = (select public.ma_personne())
  );

create policy "Contact : modification par le referent"
  on public.contact
  for update
  to authenticated
  using ((select public.je_suis_membre()) and referent = (select public.ma_personne()))
  with check ((select public.je_suis_membre()) and referent = (select public.ma_personne()));

create policy "Contact : suppression par le referent"
  on public.contact
  for delete
  to authenticated
  using ((select public.je_suis_membre()) and referent = (select public.ma_personne()));

-- CONTACT_ORGANISATION -------------------------------------------------
grant select on public.contact_organisation to authenticated;
grant insert (id_contact, organisation, poste, principale, actuel)
  on public.contact_organisation to authenticated;
grant update (organisation, poste, principale, actuel)
  on public.contact_organisation to authenticated;
grant delete on public.contact_organisation to authenticated;

create policy "Organisation d'un contact : lecture si la fiche est visible"
  on public.contact_organisation
  for select
  to authenticated
  using (public.peut_voir_contact(id_contact));

create policy "Organisation d'un contact : gestion par le referent"
  on public.contact_organisation
  for all
  to authenticated
  using (public.est_referent(id_contact))
  with check (public.est_referent(id_contact));

-- COORDONNEE_CONTACT ---------------------------------------------------
grant select on public.coordonnee_contact to authenticated;
grant insert (id_contact, type, valeur, libelle, principal)
  on public.coordonnee_contact to authenticated;
grant update (type, valeur, libelle, principal)
  on public.coordonnee_contact to authenticated;
grant delete on public.coordonnee_contact to authenticated;

create policy "Coordonnees : lecture si autorise"
  on public.coordonnee_contact
  for select
  to authenticated
  using (public.peut_voir_coordonnees(id_contact));

create policy "Coordonnees : gestion par le referent"
  on public.coordonnee_contact
  for all
  to authenticated
  using (public.est_referent(id_contact))
  with check (public.est_referent(id_contact));

-- ACCES_CONTACT --------------------------------------------------------
-- Le référent voit et gère la liste ; un membre voit ses propres accès.
-- On n'accorde un accès qu'à un membre, et seulement pour un contact
-- RESTREINT. accorde_par est rempli par la base.
grant select on public.acces_contact to authenticated;
grant insert (id_contact, id_membre) on public.acces_contact to authenticated;
grant delete on public.acces_contact to authenticated;

create policy "Acces : lecture par le referent ou le membre concerne"
  on public.acces_contact
  for select
  to authenticated
  using (
    public.est_referent(id_contact)
    or ((select public.je_suis_membre()) and id_membre = (select public.ma_personne()))
  );

create policy "Acces : accord par le referent"
  on public.acces_contact
  for insert
  to authenticated
  with check (
    public.est_referent(id_contact)
    and accorde_par = (select public.ma_personne())
    and id_membre <> (select public.ma_personne())
    and public.est_membre(id_membre)
    and exists (
      select 1 from public.contact c
      where c.id_contact = acces_contact.id_contact
        and c.visibilite = 'RESTREINT'
    )
  );

create policy "Acces : retrait par le referent"
  on public.acces_contact
  for delete
  to authenticated
  using (public.est_referent(id_contact));

-- Fonctions : réservées aux comptes connectés.
revoke execute on function
  public.ma_personne(), public.est_membre(uuid), public.je_suis_membre(),
  public.liste_membres(), public.peut_voir_contact(uuid),
  public.peut_voir_coordonnees(uuid), public.est_referent(uuid)
  from public, anon;
grant execute on function
  public.ma_personne(), public.est_membre(uuid), public.je_suis_membre(),
  public.liste_membres(), public.peut_voir_contact(uuid),
  public.peut_voir_coordonnees(uuid), public.est_referent(uuid)
  to authenticated;

-- ---------------------------------------------------------------------
-- 9. ajouter_contact : une fiche complète en une seule opération
-- SECURITY INVOKER : toutes les règles ci-dessus s'appliquent. Si une
-- étape échoue (email invalide, note avec un numéro…), rien n'est
-- enregistré.
-- ---------------------------------------------------------------------
create or replace function public.ajouter_contact(
  p_nom              text,
  p_lieu_rencontre   text,
  p_date_rencontre   date,
  p_visibilite       text,
  p_organisation     text    default null,   -- vide = sans organisation
  p_poste            text    default null,
  p_raison_rencontre text    default null,
  p_conditions       text    default null,
  p_notes            text    default null,
  p_partenaire       boolean default false,
  p_telephones       text[]  default '{}',   -- le premier est le principal
  p_emails           text[]  default '{}'    -- le premier est le principal
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id    uuid;
  v_ordre integer;
  v_valeur text;
begin
  insert into public.contact (
    nom, lieu_rencontre, date_rencontre, raison_rencontre,
    visibilite, partenaire, conditions, notes
  )
  values (
    btrim(p_nom), btrim(p_lieu_rencontre), coalesce(p_date_rencontre, current_date),
    nullif(btrim(p_raison_rencontre), ''),
    p_visibilite, coalesce(p_partenaire, false),
    nullif(btrim(p_conditions), ''), nullif(btrim(p_notes), '')
  )
  returning id_contact into v_id;

  if nullif(btrim(p_organisation), '') is not null then
    insert into public.contact_organisation (id_contact, organisation, poste, principale)
    values (v_id, btrim(p_organisation), nullif(btrim(p_poste), ''), true);
  end if;

  v_ordre := 0;
  foreach v_valeur in array coalesce(p_telephones, '{}') loop
    if nullif(btrim(v_valeur), '') is not null then
      v_ordre := v_ordre + 1;
      insert into public.coordonnee_contact (id_contact, type, valeur, principal)
      values (v_id, 'TELEPHONE', btrim(v_valeur), v_ordre = 1);
    end if;
  end loop;

  v_ordre := 0;
  foreach v_valeur in array coalesce(p_emails, '{}') loop
    if nullif(btrim(v_valeur), '') is not null then
      v_ordre := v_ordre + 1;
      insert into public.coordonnee_contact (id_contact, type, valeur, principal)
      values (v_id, 'EMAIL', lower(btrim(v_valeur)), v_ordre = 1);
    end if;
  end loop;

  return v_id;
end;
$$;

comment on function public.ajouter_contact is
  'Ajoute un contact, son organisation et ses coordonnées en une fois. Le membre connecté en devient le référent.';

revoke execute on function public.ajouter_contact(
  text, text, date, text, text, text, text, text, text, boolean, text[], text[]
) from public, anon;
grant execute on function public.ajouter_contact(
  text, text, date, text, text, text, text, text, text, boolean, text[], text[]
) to authenticated;

-- ---------------------------------------------------------------------
-- 10. transferer_contact : confier un contact à un autre membre
-- Réservé au référent actuel. La visibilité et les conditions ne
-- changent pas. La liste des accès est vidée : c'est au nouveau
-- référent de décider à qui il donne les coordonnées.
-- ---------------------------------------------------------------------
create or replace function public.transferer_contact(
  p_contact          uuid,
  p_nouveau_referent uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moi uuid := public.ma_personne();
begin
  if not public.est_referent(p_contact) then
    raise exception 'Seul le référent actuel peut transférer ce contact.'
      using errcode = '42501';
  end if;

  if p_nouveau_referent is null
     or p_nouveau_referent = v_moi
     or not public.est_membre(p_nouveau_referent) then
    raise exception 'Le nouveau référent doit être un autre membre.'
      using errcode = '22023';
  end if;

  update public.contact
  set referent = p_nouveau_referent
  where id_contact = p_contact;

  delete from public.acces_contact
  where id_contact = p_contact;
end;
$$;

comment on function public.transferer_contact is
  'Change le référent d''un contact (référent actuel uniquement) et vide la liste des accès.';

revoke execute on function public.transferer_contact(uuid, uuid) from public, anon;
grant execute on function public.transferer_contact(uuid, uuid) to authenticated;
