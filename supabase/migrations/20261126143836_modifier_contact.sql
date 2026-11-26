-- =====================================================================
-- Supernova — Migration : modifier un contact en une seule opération
--
-- modifier_contact() met à jour la fiche, remplace ses organisations et,
-- si demandé, ses coordonnées. Tout réussit ou rien n'est enregistré.
--
-- SECURITY INVOKER : les règles d'accès existantes s'appliquent telles
-- quelles. Le référent modifie tout ; un Head of ou la direction modifie
-- une fiche Équipe ou Restreint, sans changer sa visibilité ni ses
-- conditions (déclencheur), et les coordonnées d'un contact Équipe
-- seulement (règle de coordonnee_contact).
-- =====================================================================

create or replace function public.modifier_contact(
  p_contact          uuid,
  p_nom              text,
  p_lieu_rencontre   text,
  p_date_rencontre   date,
  p_visibilite       text,
  p_raison_rencontre text    default null,
  p_conditions       text    default null,
  p_notes            text    default null,
  p_partenaire       boolean default false,
  -- [{ "organisation": "…", "poste": "…", "actuel": true }, …]
  -- la première est la principale ; tableau vide = sans organisation
  p_organisations    jsonb   default '[]',
  -- faux : les coordonnées ne sont pas touchées
  p_modifier_coordonnees boolean default false,
  p_telephones       text[]  default '{}',   -- le premier est le principal
  p_emails           text[]  default '{}'    -- le premier est le principal
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ordre  integer;
  v_valeur text;
  v_lien   jsonb;
begin
  update public.contact
  set nom              = btrim(p_nom),
      lieu_rencontre   = btrim(p_lieu_rencontre),
      date_rencontre   = coalesce(p_date_rencontre, date_rencontre),
      raison_rencontre = nullif(btrim(p_raison_rencontre), ''),
      visibilite       = p_visibilite,
      conditions       = nullif(btrim(p_conditions), ''),
      notes            = nullif(btrim(p_notes), ''),
      partenaire       = coalesce(p_partenaire, false)
  where id_contact = p_contact;

  -- Aucune ligne : contact inexistant, invisible, ou non modifiable.
  if not found then
    raise exception 'Ce contact ne peut pas être modifié avec ce compte.'
      using errcode = '42501';
  end if;

  -- Organisations : remplacées par la liste reçue.
  delete from public.contact_organisation where id_contact = p_contact;

  v_ordre := 0;
  for v_lien in select * from jsonb_array_elements(coalesce(p_organisations, '[]'::jsonb)) loop
    if nullif(btrim(v_lien ->> 'organisation'), '') is not null then
      v_ordre := v_ordre + 1;
      insert into public.contact_organisation (id_contact, organisation, poste, principale, actuel)
      values (
        p_contact,
        btrim(v_lien ->> 'organisation'),
        nullif(btrim(v_lien ->> 'poste'), ''),
        v_ordre = 1,
        coalesce((v_lien ->> 'actuel')::boolean, true)
      );
    end if;
  end loop;

  -- Coordonnées : remplacées seulement si demandé (et permis).
  if p_modifier_coordonnees then
    delete from public.coordonnee_contact where id_contact = p_contact;

    v_ordre := 0;
    foreach v_valeur in array coalesce(p_telephones, '{}') loop
      if nullif(btrim(v_valeur), '') is not null then
        v_ordre := v_ordre + 1;
        insert into public.coordonnee_contact (id_contact, type, valeur, principal)
        values (p_contact, 'TELEPHONE', btrim(v_valeur), v_ordre = 1);
      end if;
    end loop;

    v_ordre := 0;
    foreach v_valeur in array coalesce(p_emails, '{}') loop
      if nullif(btrim(v_valeur), '') is not null then
        v_ordre := v_ordre + 1;
        insert into public.coordonnee_contact (id_contact, type, valeur, principal)
        values (p_contact, 'EMAIL', lower(btrim(v_valeur)), v_ordre = 1);
      end if;
    end loop;
  end if;
end;
$$;

comment on function public.modifier_contact is
  'Modifie un contact (fiche, organisations, et coordonnées si demandé) en une seule opération, selon les droits du compte connecté.';

revoke execute on function public.modifier_contact(
  uuid, text, text, date, text, text, text, text, boolean, jsonb, boolean, text[], text[]
) from public, anon;
grant execute on function public.modifier_contact(
  uuid, text, text, date, text, text, text, text, boolean, jsonb, boolean, text[], text[]
) to authenticated;
