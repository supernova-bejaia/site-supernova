-- =====================================================================
-- Supernova — Migration : droits rattachés aux niveaux
--
-- Les droits de l'espace équipe dépendent désormais du niveau du compte
-- connecté (mon_niveau() : 1 membre, 2 Head of, 3 direction,
-- 4 propriétaire), et non plus de sa seule présence dans acces_admin.
--
--   1. est_admin()   : « niveau ≥ 1 » (entrée de l'espace équipe)
--   2. articles      : statut ARCHIVE ; un membre écrit ses brouillons,
--                      un Head of modifie, publie et archive, la direction
--                      supprime ; mes_articles()
--   3. images        : envoi par un membre ; remplacement et suppression
--                      par un Head of ou par celui qui a envoyé l'image
--   4. personnes     : téléphone et email réservés à la direction
--                      (coordonnees_personne())
--   5. carnet        : archivage ; les Head of modifient les fiches
--                      Équipe et Restreint ; transfert des contacts d'un
--                      membre parti (transferer_contacts_de())
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Entrée de l'espace équipe
-- Toutes les règles existantes fondées sur est_admin() (inscrits,
-- saisons, lecture des articles et des images) suivent.
-- ---------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.mon_niveau() >= 1;
$$;

comment on function public.est_admin is
  'Vrai si le compte connecté a accès à l''espace équipe (niveau 1 ou plus).';

-- ---------------------------------------------------------------------
-- 2. Articles
-- ---------------------------------------------------------------------

-- Nouveau statut : ARCHIVE (retiré du site, récupérable).
alter table public.article drop constraint article_statut_check;
alter table public.article
  add constraint article_statut_check
  check (statut in ('BROUILLON', 'PUBLIE', 'ARCHIVE'));

-- id_auteur ne s'écrit jamais depuis le site : la valeur par défaut
-- (le compte connecté) s'applique à la création.
revoke insert, update, delete, truncate, references, trigger on public.article from anon, authenticated;
grant insert (titre, slug, resume, contenu, image_couverture, statut, published_at)
  on public.article to authenticated;
grant update (titre, slug, resume, contenu, image_couverture, statut, published_at)
  on public.article to authenticated;
grant delete on public.article to authenticated;

drop policy "Gestion par l'equipe autorisee" on public.article;

-- Lecture : l'équipe lit tout, brouillons et archives compris.
create policy "Articles : lecture par l'equipe"
  on public.article for select to authenticated
  using ((select public.est_admin()));

-- Création : un membre crée un brouillon ; publier demande un Head of.
create policy "Articles : creation"
  on public.article for insert to authenticated
  with check (
    (select public.mon_niveau()) >= 1
    and id_auteur = (select auth.uid())
    and (statut = 'BROUILLON' or (select public.mon_niveau()) >= 2)
  );

-- Modification : un Head of modifie tout ; un membre, ses brouillons
-- seulement (un article publié ou archivé ne change plus sans un Head of).
create policy "Articles : modification"
  on public.article for update to authenticated
  using (
    (select public.mon_niveau()) >= 2
    or ((select public.mon_niveau()) >= 1 and id_auteur = (select auth.uid()) and statut = 'BROUILLON')
  )
  with check (
    (select public.mon_niveau()) >= 2
    or ((select public.mon_niveau()) >= 1 and id_auteur = (select auth.uid()) and statut = 'BROUILLON')
  );

-- Suppression définitive : la direction ; un membre, ses brouillons
-- jamais publiés.
create policy "Articles : suppression"
  on public.article for delete to authenticated
  using (
    (select public.mon_niveau()) >= 3
    or (
      (select public.mon_niveau()) >= 1
      and id_auteur = (select auth.uid())
      and statut = 'BROUILLON'
      and published_at is null
    )
  );

-- Les articles du compte connecté (la colonne id_auteur n'est pas
-- lisible depuis le site).
create or replace function public.mes_articles()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select a.id_article
  from public.article a
  where public.est_admin()
    and a.id_auteur = (select auth.uid());
$$;

comment on function public.mes_articles is
  'Identifiants des articles créés par le compte connecté.';

-- ---------------------------------------------------------------------
-- 3. Images de couverture
-- ---------------------------------------------------------------------
drop policy "Articles : envoi par l'equipe autorisee" on storage.objects;
drop policy "Articles : remplacement par l'equipe autorisee" on storage.objects;
drop policy "Articles : suppression par l'equipe autorisee" on storage.objects;

create policy "Articles : envoi par un membre"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'articles' and (select public.mon_niveau()) >= 1);

create policy "Articles : remplacement par un Head of ou l'auteur de l'image"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'articles'
    and ((select public.mon_niveau()) >= 2
         or ((select public.mon_niveau()) >= 1 and owner_id = (select auth.uid())::text))
  )
  with check (
    bucket_id = 'articles'
    and ((select public.mon_niveau()) >= 2
         or ((select public.mon_niveau()) >= 1 and owner_id = (select auth.uid())::text))
  );

create policy "Articles : suppression par un Head of ou l'auteur de l'image"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'articles'
    and ((select public.mon_niveau()) >= 2
         or ((select public.mon_niveau()) >= 1 and owner_id = (select auth.uid())::text))
  );

-- ---------------------------------------------------------------------
-- 4. Personnes : téléphone et email réservés à la direction
-- Les membres lisent les autres colonnes (règle existante). La direction
-- consulte les coordonnées avec coordonnees_personne().
-- ---------------------------------------------------------------------
revoke select on public.personne from anon, authenticated;
grant select (id_personne, nom, prenom, etablissement, filiere, annee,
              fondateur, created_at, updated_at)
  on public.personne to authenticated;

create or replace function public.coordonnees_personne(p_personne uuid)
returns table (email text, tel text)
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
    select p.email, p.tel
    from public.personne p
    where p.id_personne = p_personne;
end;
$$;

comment on function public.coordonnees_personne is
  'Email et téléphone d''une personne (direction uniquement).';

-- ---------------------------------------------------------------------
-- 5. Carnet de contacts
-- ---------------------------------------------------------------------

-- Archivage : la fiche disparaît des listes mais reste récupérable.
alter table public.contact add column archive_le timestamptz;

grant update (archive_le) on public.contact to authenticated;

-- Qui gère la fiche (et ses organisations) : le référent, ou un Head of
-- et plus pour un contact Équipe ou Restreint.
create or replace function public.peut_gerer_contact(p_contact uuid)
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
          c.referent = public.ma_personne()
          or (public.mon_niveau() >= 2 and c.visibilite <> 'PRIVE')
        )
    );
$$;

-- Qui gère les coordonnées : le référent, ou un Head of et plus pour un
-- contact Équipe (celles d'un contact Restreint restent au référent).
create or replace function public.peut_gerer_coordonnees(p_contact uuid)
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
          c.referent = public.ma_personne()
          or (public.mon_niveau() >= 2 and c.visibilite = 'EQUIPE')
        )
    );
$$;

comment on function public.peut_gerer_contact is
  'Vrai si le compte connecté peut modifier la fiche de ce contact.';
comment on function public.peut_gerer_coordonnees is
  'Vrai si le compte connecté peut modifier les coordonnées de ce contact.';

drop policy "Contact : modification par le referent" on public.contact;
drop policy "Contact : suppression par le referent" on public.contact;

create policy "Contact : modification par le referent ou un Head of"
  on public.contact for update to authenticated
  using (
    (select public.je_suis_membre())
    and (referent = (select public.ma_personne())
         or ((select public.mon_niveau()) >= 2 and visibilite <> 'PRIVE'))
  )
  with check (
    (select public.je_suis_membre())
    and (referent = (select public.ma_personne())
         or ((select public.mon_niveau()) >= 2 and visibilite <> 'PRIVE'))
  );

create policy "Contact : suppression par le referent ou la direction"
  on public.contact for delete to authenticated
  using (
    (select public.je_suis_membre())
    and (referent = (select public.ma_personne())
         or ((select public.mon_niveau()) >= 3 and visibilite <> 'PRIVE'))
  );

-- La visibilité et les conditions sont l'engagement du référent : lui
-- seul les change (sauf dans le tableau de bord Supabase).
create or replace function public.proteger_engagement_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and (new.visibilite is distinct from old.visibilite
          or new.conditions is distinct from old.conditions)
     and old.referent is distinct from public.ma_personne() then
    raise exception 'Seul le référent change la visibilité ou les conditions d''un contact.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.proteger_engagement_contact() from public, anon, authenticated;

create trigger contact_proteger_engagement
  before update on public.contact
  for each row
  execute function public.proteger_engagement_contact();

drop policy "Organisation d'un contact : gestion par le referent" on public.contact_organisation;
create policy "Organisation d'un contact : gestion par le referent ou un Head of"
  on public.contact_organisation for all to authenticated
  using (public.peut_gerer_contact(id_contact))
  with check (public.peut_gerer_contact(id_contact));

drop policy "Coordonnees : gestion par le referent" on public.coordonnee_contact;
create policy "Coordonnees : gestion par le referent ou un Head of"
  on public.coordonnee_contact for all to authenticated
  using (public.peut_gerer_coordonnees(id_contact))
  with check (public.peut_gerer_coordonnees(id_contact));

-- Transférer tous les contacts d'une personne qui n'est plus membre.
-- Réservé à la direction ; les contacts privés sont transférés sans être
-- lus. La visibilité et les conditions ne changent pas, les accès sont
-- vidés. Renvoie le nombre de contacts transférés.
create or replace function public.transferer_contacts_de(
  p_ancien  uuid,
  p_nouveau uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nombre integer;
begin
  if public.mon_niveau() < 3 then
    raise exception 'Seuls le Président et le Chief Supervisor transfèrent les contacts d''un membre parti.'
      using errcode = '42501';
  end if;
  if p_ancien is null or public.est_membre(p_ancien) then
    raise exception 'Cette personne est encore membre : c''est à elle de transférer ses contacts.'
      using errcode = '22023';
  end if;
  if p_nouveau is null or p_nouveau = p_ancien or not public.est_membre(p_nouveau) then
    raise exception 'Le nouveau référent doit être un membre.' using errcode = '22023';
  end if;

  delete from public.acces_contact ac
  using public.contact c
  where ac.id_contact = c.id_contact
    and c.referent = p_ancien;

  update public.contact
  set referent = p_nouveau
  where referent = p_ancien;

  get diagnostics v_nombre = row_count;
  return v_nombre;
end;
$$;

comment on function public.transferer_contacts_de is
  'Transfère tous les contacts d''une personne qui n''est plus membre (direction uniquement).';

-- ---------------------------------------------------------------------
-- Droits d'exécution : comptes connectés uniquement.
-- ---------------------------------------------------------------------
revoke execute on function
  public.mes_articles(), public.coordonnees_personne(uuid),
  public.peut_gerer_contact(uuid), public.peut_gerer_coordonnees(uuid),
  public.transferer_contacts_de(uuid, uuid)
  from public, anon;
grant execute on function
  public.mes_articles(), public.coordonnees_personne(uuid),
  public.peut_gerer_contact(uuid), public.peut_gerer_coordonnees(uuid),
  public.transferer_contacts_de(uuid, uuid)
  to authenticated;
