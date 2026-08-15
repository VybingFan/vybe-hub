-- VYBE V24.45A - entertainment creator taxonomy.
-- Taxonomy is not workspace access: roles, discovery tags and credits never
-- grant a paid focus or bypass membership/focus authorization.

begin;

insert into public.creator_focus_catalog (focus_code,public_name,description,launch_state,sort_order)
values
 ('music','Music','Songs, releases, playlists, lyrics, performances, and artist tools.','available',10),
 ('film','Film & Video','Films, series, trailers, scenes, shorts, and behind-the-scenes media.','foundation',20),
 ('acting','Acting & On-Camera Performance','Reels, scenes, monologues, voice samples, credits, and appearances.','planned',30),
 ('comedy','Comedy','Clips, specials, sketches, shows, podcasts, and tour dates.','planned',40),
 ('theater','Theater & Live Production','Productions, rehearsals, readings, scenes, schedules, and tickets.','planned',50),
 ('writing','Writing, Poetry & Storytelling','Books, excerpts, poems, readings, serialized work, and appearances.','planned',60),
 ('dance','Dance & Choreography','Performances, choreography reels, rehearsals, classes, and events.','planned',70),
 ('podcasting','Podcasting & Audio Entertainment','Episodes, seasons, clips, interviews, and live recordings.','planned',80),
 ('visual_art','Visual & Digital Entertainment','Galleries, comics, artwork, digital releases, and exhibitions.','planned',90)
on conflict(focus_code) do update set public_name=excluded.public_name,description=excluded.description,sort_order=excluded.sort_order,updated_at=now();

alter table public.creator_profiles drop constraint if exists creator_profiles_primary_creator_discipline_check;
alter table public.creator_profiles add constraint creator_profiles_primary_creator_discipline_check
 check(primary_creator_discipline in ('music','film','acting','comedy','theater','writing','dance','podcasting','visual_art'));

create table public.creator_focus_roles (
 focus_code text not null references public.creator_focus_catalog(focus_code) on delete cascade,
 role_code text not null,
 public_name text not null,
 description text not null default '',
 sort_order integer not null default 0,
 active boolean not null default true,
 primary key(focus_code,role_code)
);

insert into public.creator_focus_roles(focus_code,role_code,public_name,sort_order) values
 ('music','artist','Artist',10),('music','singer','Singer',20),('music','rapper','Rapper',30),('music','musician','Musician',40),('music','producer','Producer',50),('music','dj','DJ',60),('music','songwriter','Songwriter',70),('music','composer','Composer',80),
 ('film','filmmaker','Filmmaker',10),('film','director','Director',20),('film','producer','Producer',30),('film','screenwriter','Screenwriter',40),('film','editor','Editor',50),('film','cinematographer','Cinematographer',60),('film','animator','Animator',70),
 ('acting','actor','Actor',10),('acting','voice_actor','Voice Actor',20),('acting','host','Host',30),('acting','presenter','Presenter',40),('acting','model','Model',50),
 ('comedy','stand_up','Stand-Up Comedian',10),('comedy','sketch','Sketch Comedian',20),('comedy','improv','Improv Performer',30),('comedy','writer','Comedy Writer',40),('comedy','satirist','Satirist',50),
 ('theater','playwright','Playwright',10),('theater','director','Director',20),('theater','producer','Producer',30),('theater','company','Theater Company',40),('theater','performer','Stage Performer',50),('theater','designer','Designer',60),
 ('writing','author','Author',10),('writing','poet','Poet',20),('writing','novelist','Novelist',30),('writing','spoken_word','Spoken-Word Artist',40),('writing','screenwriter','Screenwriter',50),('writing','journalist','Journalist',60),
 ('dance','dancer','Dancer',10),('dance','choreographer','Choreographer',20),('dance','company','Dance Company',30),('dance','instructor','Instructor',40),
 ('podcasting','podcaster','Podcaster',10),('podcasting','interviewer','Interviewer',20),('podcasting','radio_host','Radio Host',30),('podcasting','audio_dramatist','Audio Dramatist',40),('podcasting','narrator','Narrator',50),
 ('visual_art','illustrator','Illustrator',10),('visual_art','comic_creator','Comic Creator',20),('visual_art','photographer','Photographer',30),('visual_art','digital_artist','Digital Artist',40),('visual_art','animator','Animator',50)
on conflict(focus_code,role_code) do update set public_name=excluded.public_name,sort_order=excluded.sort_order,active=true;

create table public.creator_discovery_categories (
 category_code text primary key,
 public_name text not null,
 description text not null default '',
 sort_order integer not null default 0,
 active boolean not null default true
);
insert into public.creator_discovery_categories(category_code,public_name,sort_order) values
 ('listen','Listen',10),('watch','Watch',20),('read','Read',30),('live','Live & Upcoming',40),('performance','Performance',50),('stories','Stories',60),('visual_stories','Visual Stories',70),('community','Community',80),('merch','Merchandise',90)
on conflict(category_code) do update set public_name=excluded.public_name,sort_order=excluded.sort_order,active=true;

create table public.creator_focus_discovery_categories (
 focus_code text not null references public.creator_focus_catalog(focus_code) on delete cascade,
 category_code text not null references public.creator_discovery_categories(category_code) on delete cascade,
 primary key(focus_code,category_code)
);
insert into public.creator_focus_discovery_categories values
 ('music','listen'),('music','watch'),('music','live'),('film','watch'),('film','visual_stories'),
 ('acting','watch'),('acting','performance'),('comedy','watch'),('comedy','live'),('theater','performance'),('theater','live'),
 ('writing','read'),('writing','stories'),('dance','watch'),('dance','performance'),('podcasting','listen'),('podcasting','stories'),
 ('visual_art','visual_stories') on conflict do nothing;

create table public.creator_focus_readiness (
 focus_code text primary key references public.creator_focus_catalog(focus_code) on delete cascade,
 readiness_status text not null check(readiness_status in ('available','foundation','planned','blocked')),
 public_message text not null,
 admin_notes text not null default '',
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
insert into public.creator_focus_readiness(focus_code,readiness_status,public_message) select focus_code,launch_state,case when launch_state='available' then 'Workspace available now.' when launch_state='foundation' then 'Foundation tools are available while the workspace grows.' else 'Workspace planned; no paid access is being sold yet.' end from public.creator_focus_catalog on conflict(focus_code) do nothing;

create table public.creator_work_credits (
 id uuid primary key default gen_random_uuid(),
 owner_creator_id uuid not null references auth.users(id) on delete cascade,
 credited_creator_id uuid references auth.users(id) on delete set null,
 credited_name text not null,
 focus_code text not null references public.creator_focus_catalog(focus_code) on delete restrict,
 role_code text not null,
 work_type text not null,
 work_id uuid,
 work_title text not null,
 status text not null default 'pending' check(status in ('pending','accepted','declined','removed')),
 visibility text not null default 'public' check(visibility in ('public','members','private')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(focus_code,role_code) references public.creator_focus_roles(focus_code,role_code) on delete restrict
);
create index creator_work_credits_owner_idx on public.creator_work_credits(owner_creator_id,status);
create index creator_work_credits_credited_idx on public.creator_work_credits(credited_creator_id,status);

grant select on public.creator_focus_roles,public.creator_discovery_categories,public.creator_focus_discovery_categories,public.creator_focus_readiness to anon,authenticated;
grant insert,update,delete on public.creator_focus_roles,public.creator_discovery_categories,public.creator_focus_discovery_categories,public.creator_focus_readiness to authenticated;
grant all on public.creator_focus_roles,public.creator_discovery_categories,public.creator_focus_discovery_categories,public.creator_focus_readiness,public.creator_work_credits to service_role;
grant select,insert,update,delete on public.creator_work_credits to authenticated;
grant select on public.creator_work_credits to anon;

alter table public.creator_focus_roles enable row level security;
alter table public.creator_discovery_categories enable row level security;
alter table public.creator_focus_discovery_categories enable row level security;
alter table public.creator_focus_readiness enable row level security;
alter table public.creator_work_credits enable row level security;
create policy "Taxonomy roles are readable" on public.creator_focus_roles for select to anon,authenticated using(active);
create policy "Discovery categories are readable" on public.creator_discovery_categories for select to anon,authenticated using(active);
create policy "Focus discovery mappings are readable" on public.creator_focus_discovery_categories for select to anon,authenticated using(true);
create policy "Focus readiness is readable" on public.creator_focus_readiness for select to anon,authenticated using(true);
create policy "Admins manage focus taxonomy roles" on public.creator_focus_roles for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy "Admins manage discovery taxonomy" on public.creator_discovery_categories for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy "Admins manage focus discovery mappings" on public.creator_focus_discovery_categories for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy "Admins manage focus readiness" on public.creator_focus_readiness for all to authenticated using(public.has_role(auth.uid(),'admin')) with check(public.has_role(auth.uid(),'admin'));
create policy "Owners manage work credits" on public.creator_work_credits for all to authenticated using(owner_creator_id=auth.uid()) with check(owner_creator_id=auth.uid() and public.has_role(auth.uid(),'creator'));
create policy "Credited creators read credits" on public.creator_work_credits for select to authenticated using(credited_creator_id=auth.uid());
create policy "Public reads accepted public credits" on public.creator_work_credits for select to anon,authenticated using(status='accepted' and visibility='public');
create policy "Admins audit work credits" on public.creator_work_credits for select to authenticated using(public.has_role(auth.uid(),'admin'));

comment on table public.creator_work_credits is 'Cross-focus contribution records. A credit never grants workspace access.';
commit;
