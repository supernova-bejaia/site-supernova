-- =====================================================================
-- Supernova — Migration 2 : fonction d'inscription à l'Orbite
--
-- Unique porte d'entrée du formulaire public. En une seule transaction :
--   1. vérifie les champs ;
--   2. trouve la saison active ;
--   3. crée la personne, ou met à jour ses informations si l'email existe ;
--   4. crée son adhésion ORBITE pour la saison, ou la met à jour
--      (sans jamais changer son type : un membre du Noyau reste au Noyau) ;
--   5. remplace ses centres d'intérêt.
--
-- SECURITY DEFINER : la fonction s'exécute avec les droits de son
-- propriétaire, ce qui lui permet d'écrire dans des tables fermées au
-- public par la RLS. Le visiteur ne peut rien faire d'autre que l'appeler.
-- =====================================================================

create or replace function public.inscrire_orbite(
  p_nom                     text,
  p_prenom                  text,
  p_email                   text,
  p_tel                     text,
  p_etablissement           text,
  p_filiere                 text,
  p_annee                   text,
  p_centres_interet         uuid[]  default '{}',
  p_attentes                text    default null,
  p_consentement_newsletter boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nom           text := btrim(coalesce(p_nom, ''));
  v_prenom        text := btrim(coalesce(p_prenom, ''));
  v_email         text := lower(btrim(coalesce(p_email, '')));
  v_tel           text := btrim(coalesce(p_tel, ''));
  v_etablissement text := btrim(coalesce(p_etablissement, ''));
  v_filiere       text := btrim(coalesce(p_filiere, ''));
  v_annee         text := btrim(coalesce(p_annee, ''));
  v_attentes      text := nullif(btrim(coalesce(p_attentes, '')), '');
  v_consentement  boolean := coalesce(p_consentement_newsletter, false);
  v_centres       uuid[] := coalesce(p_centres_interet, '{}');
  v_id_saison     uuid;
  v_id_personne   uuid;
  v_id_adhesion   uuid;
begin
  -- 1. Vérifications (le site les fait aussi, mais la base ne fait confiance à personne)
  if v_nom = '' or length(v_nom) > 100 then
    raise exception 'CHAMP_INVALIDE:nom' using errcode = '22023';
  end if;
  if v_prenom = '' or length(v_prenom) > 100 then
    raise exception 'CHAMP_INVALIDE:prenom' using errcode = '22023';
  end if;
  if length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'CHAMP_INVALIDE:email' using errcode = '22023';
  end if;
  if v_tel !~ '^[0-9+ ().-]{6,30}$' then
    raise exception 'CHAMP_INVALIDE:tel' using errcode = '22023';
  end if;
  if v_etablissement = '' or length(v_etablissement) > 150 then
    raise exception 'CHAMP_INVALIDE:etablissement' using errcode = '22023';
  end if;
  if v_filiere = '' or length(v_filiere) > 150 then
    raise exception 'CHAMP_INVALIDE:filiere' using errcode = '22023';
  end if;
  if v_annee = '' or length(v_annee) > 60 then
    raise exception 'CHAMP_INVALIDE:annee' using errcode = '22023';
  end if;
  if length(v_attentes) > 2000 then
    raise exception 'CHAMP_INVALIDE:attentes' using errcode = '22023';
  end if;
  if coalesce(array_length(v_centres, 1), 0) > 30 then
    raise exception 'CHAMP_INVALIDE:centres_interet' using errcode = '22023';
  end if;

  -- 2. Saison active
  select s.id_saison into v_id_saison
  from public.saison s
  where s.statut = 'ACTIVE';

  if v_id_saison is null then
    raise exception 'AUCUNE_SAISON_ACTIVE' using errcode = 'P0001';
  end if;

  -- 3. Personne : création, ou mise à jour si l'email existe déjà
  insert into public.personne as p
    (nom, prenom, email, tel, etablissement, filiere, annee)
  values
    (v_nom, v_prenom, v_email, v_tel, v_etablissement, v_filiere, v_annee)
  on conflict (lower(email)) do update
    set nom           = excluded.nom,
        prenom        = excluded.prenom,
        tel           = excluded.tel,
        etablissement = excluded.etablissement,
        filiere       = excluded.filiere,
        annee         = excluded.annee,
        updated_at    = now()
  returning p.id_personne into v_id_personne;

  -- 4. Adhésion de la saison : création en ORBITE, ou mise à jour
  --    (le type et le statut existants ne sont jamais modifiés ici)
  insert into public.adhesion as a
    (id_personne, id_saison, type, attentes,
     consentement_newsletter, date_consentement_newsletter)
  values
    (v_id_personne, v_id_saison, 'ORBITE', v_attentes,
     v_consentement, case when v_consentement then now() end)
  on conflict (id_personne, id_saison) do update
    set attentes                     = excluded.attentes,
        consentement_newsletter      = excluded.consentement_newsletter,
        date_consentement_newsletter = case
          when not excluded.consentement_newsletter then null
          when a.consentement_newsletter then a.date_consentement_newsletter
          else now()
        end
  returning a.id_adhesion into v_id_adhesion;

  -- 5. Centres d'intérêt : on remplace la sélection précédente.
  --    Les identifiants inconnus sont simplement ignorés.
  delete from public.interet_adhesion ia
  where ia.id_adhesion = v_id_adhesion;

  insert into public.interet_adhesion (id_adhesion, id_centre_interet)
  select v_id_adhesion, ci.id_centre_interet
  from public.centre_interet ci
  where ci.id_centre_interet = any (v_centres);
end;
$$;

comment on function public.inscrire_orbite is
  'Inscription publique à l''Orbite pour la saison active (personne + adhésion + centres d''intérêt).';

-- Qui peut appeler la fonction : uniquement les rôles du site (visiteur ou connecté).
revoke execute on function public.inscrire_orbite(
  text, text, text, text, text, text, text, uuid[], text, boolean
) from public;

grant execute on function public.inscrire_orbite(
  text, text, text, text, text, text, text, uuid[], text, boolean
) to anon, authenticated;
