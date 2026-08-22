create extension if not exists pgcrypto;

create type public.user_role as enum ('candidate', 'employer', 'admin');
create type public.job_status as enum ('draft', 'published', 'closed');
create type public.application_status as enum ('submitted', 'shortlisted', 'interview', 'rejected', 'hired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  role public.user_role not null default 'candidate',
  full_name text not null default '',
  organization_name text,
  headline text,
  bio text,
  location text default 'Legazpi City, Albay',
  work_mode text not null default 'Flexible',
  availability text not null default 'Open to opportunities',
  years_experience integer not null default 0 check (years_experience between 0 and 80),
  disability_types text[] not null default '{}',
  accessibility_needs text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  category text not null default 'General',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.profile_skills (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  proficiency integer not null default 2 check (proficiency between 1 and 5),
  source text not null default 'self_reported' check (source in ('self_reported', 'assessment_verified')),
  verified_at timestamptz,
  primary key (profile_id, skill_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 20 and 5000),
  location text not null default 'Legazpi City, Albay',
  work_mode text not null default 'Flexible',
  employment_type text not null default 'Full-time',
  salary_min integer,
  salary_max integer,
  accommodations text,
  status public.job_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (salary_min is null or salary_min >= 0),
  check (salary_max is null or salary_max >= 0),
  check (salary_max is null or salary_min is null or salary_max >= salary_min)
);

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  required_level integer not null default 3 check (required_level between 1 and 5),
  importance integer not null default 1 check (importance between 1 and 3),
  primary key (job_id, skill_id)
);

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete restrict,
  slug text unique not null,
  prompt text not null,
  options jsonb not null,
  points integer not null default 1 check (points > 0),
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.assessment_answer_keys (
  question_id uuid primary key references public.assessment_questions(id) on delete cascade,
  correct_option text not null
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0,
  total_points integer not null default 0,
  accommodation_notes text,
  completed_at timestamptz not null default timezone('utc', now())
);

create table public.assessment_responses (
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete restrict,
  selected_option text not null,
  is_correct boolean not null,
  points_awarded integer not null default 0,
  primary key (attempt_id, question_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  fit_score numeric(5,2) not null default 0 check (fit_score between 0 and 100),
  matched_skills text[] not null default '{}',
  status public.application_status not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (job_id, candidate_id)
);

create table public.platform_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  duration_ms integer,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index profiles_role_idx on public.profiles(role);
create index jobs_status_created_idx on public.jobs(status, created_at desc);
create index jobs_employer_idx on public.jobs(employer_id);
create index applications_candidate_idx on public.applications(candidate_id, created_at desc);
create index applications_job_idx on public.applications(job_id, status, fit_score desc);
create index profile_skills_skill_idx on public.profile_skills(skill_id);

alter table public.profiles add constraint profiles_disability_types_check check (
  disability_types <@ array['visual', 'hearing', 'speech', 'multiple', 'other', 'prefer_not_to_say']::text[]
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Authenticated clients can edit their profile content, never their role or
  -- profile email. A SQL administrator can still perform a controlled role
  -- promotion because auth.uid() is null outside an end-user JWT request.
  if auth.uid() is not null and auth.role() <> 'service_role' and (new.role <> old.role or new.email <> old.email) then
    raise exception 'Profile security fields cannot be changed by the account owner';
  end if;
  return new;
end;
$$;

create or replace function public.protect_verified_skill_source()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.role() <> 'service_role' and new.source = 'assessment_verified' then
    raise exception 'Verified skills can only be written by the assessment service';
  end if;
  return new;
end;
$$;

create or replace function public.protect_assessment_records()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.role() <> 'service_role' then
    raise exception 'Assessment records can only be written by the assessment service';
  end if;
  return new;
end;
$$;

create or replace function public.protect_application_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      raise exception 'Applications can only be created by the matching service';
    end if;
    if new.job_id <> old.job_id
      or new.candidate_id <> old.candidate_id
      or new.fit_score <> old.fit_score
      or new.matched_skills <> old.matched_skills then
      raise exception 'Application match data cannot be changed by an end-user client';
    end if;
    if auth.uid() = old.candidate_id and new.status <> old.status then
      raise exception 'Candidates cannot change application status';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();
create trigger profiles_protect_security_fields before update on public.profiles
for each row execute procedure public.protect_profile_security_fields();
create trigger jobs_set_updated_at before update on public.jobs
for each row execute procedure public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications
for each row execute procedure public.set_updated_at();
create trigger profile_skills_protect_verified_source before insert or update on public.profile_skills
for each row execute procedure public.protect_verified_skill_source();
create trigger assessment_attempts_protect_records before insert or update on public.assessment_attempts
for each row execute procedure public.protect_assessment_records();
create trigger assessment_responses_protect_records before insert or update on public.assessment_responses
for each row execute procedure public.protect_assessment_records();
create trigger applications_protect_integrity before insert or update on public.applications
for each row execute procedure public.protect_application_integrity();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'candidate');
  safe_role public.user_role := case
    when requested_role = 'employer' then 'employer'::public.user_role
    else 'candidate'::public.user_role
  end;
  safe_disability_types text[] := coalesce(array(
    select value
    from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'disability_types', '[]'::jsonb)) as value
    where value in ('visual', 'hearing', 'speech', 'multiple', 'other', 'prefer_not_to_say')
  ), '{}');
begin
  insert into public.profiles (id, email, role, full_name, disability_types)
  values (
    new.id,
    coalesce(new.email, ''),
    safe_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    safe_disability_types
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.profile_skills enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_answer_keys enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.applications enable row level security;
alter table public.platform_events enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (id = (select auth.uid()) and role in ('candidate', 'employer'));
create policy "profiles_update_own" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "skills_read_authenticated" on public.skills
for select to authenticated using (is_active = true);

create policy "profile_skills_select_own_or_job_owner" on public.profile_skills
for select to authenticated using (
  profile_id = (select auth.uid()) or exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.candidate_id = profile_skills.profile_id
      and j.employer_id = (select auth.uid())
  )
);
create policy "profile_skills_insert_own" on public.profile_skills
for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "profile_skills_update_own" on public.profile_skills
for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "profile_skills_delete_own" on public.profile_skills
for delete to authenticated using (profile_id = (select auth.uid()));

create policy "jobs_read_published_or_own" on public.jobs
for select to authenticated using (status = 'published' or employer_id = (select auth.uid()));
create policy "jobs_insert_employer" on public.jobs
for insert to authenticated with check (
  employer_id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'employer'
  )
);
create policy "jobs_update_own" on public.jobs
for update to authenticated using (employer_id = (select auth.uid())) with check (employer_id = (select auth.uid()));
create policy "jobs_delete_own" on public.jobs
for delete to authenticated using (employer_id = (select auth.uid()));

create policy "job_skills_read_visible_job" on public.job_skills
for select to authenticated using (exists (select 1 from public.jobs j where j.id = job_skills.job_id and (j.status = 'published' or j.employer_id = (select auth.uid()))));
create policy "job_skills_insert_own_job" on public.job_skills
for insert to authenticated with check (exists (select 1 from public.jobs j where j.id = job_skills.job_id and j.employer_id = (select auth.uid())));
create policy "job_skills_delete_own_job" on public.job_skills
for delete to authenticated using (exists (select 1 from public.jobs j where j.id = job_skills.job_id and j.employer_id = (select auth.uid())));

create policy "assessment_questions_read_active" on public.assessment_questions
for select to authenticated using (active = true);

create policy "assessment_attempts_own" on public.assessment_attempts
for all to authenticated using (candidate_id = (select auth.uid())) with check (candidate_id = (select auth.uid()));
create policy "assessment_responses_own" on public.assessment_responses
for all to authenticated using (exists (select 1 from public.assessment_attempts aa where aa.id = assessment_responses.attempt_id and aa.candidate_id = (select auth.uid())))
with check (exists (select 1 from public.assessment_attempts aa where aa.id = assessment_responses.attempt_id and aa.candidate_id = (select auth.uid())));

create policy "applications_read_own_or_job_owner" on public.applications
for select to authenticated using (
  candidate_id = (select auth.uid()) or exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = (select auth.uid()))
);
create policy "applications_insert_own_candidate" on public.applications
for insert to authenticated with check (
  candidate_id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'candidate'
  )
);
create policy "applications_update_candidate_or_employer" on public.applications
for update to authenticated using (
  candidate_id = (select auth.uid()) or exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = (select auth.uid()))
) with check (
  candidate_id = (select auth.uid()) or exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = (select auth.uid()))
);

create policy "platform_events_insert_own" on public.platform_events
for insert to authenticated with check (
  actor_id = (select auth.uid())
  and event_name in ('dashboard_load', 'jobs_load', 'assessment_load', 'profile_load')
  and duration_ms between 0 and 120000
);

insert into public.skills (slug, name, category) values
  ('data-entry', 'Data entry', 'Digital work'),
  ('customer-support', 'Customer support', 'People'),
  ('written-communication', 'Written communication', 'People'),
  ('spreadsheets', 'Spreadsheets', 'Digital work'),
  ('social-media', 'Social media', 'Digital work'),
  ('graphic-design', 'Graphic design', 'Creative'),
  ('web-development', 'Web development', 'Technology'),
  ('bookkeeping', 'Bookkeeping', 'Business'),
  ('research', 'Research', 'Thinking'),
  ('office-administration', 'Office administration', 'Business')
on conflict (slug) do nothing;

insert into public.assessment_questions (skill_id, slug, prompt, options, points, sort_order)
select s.id, q.slug, q.prompt, q.options::jsonb, 1, q.sort_order
from public.skills s
join (values
  ('data-entry', 'data-entry-accuracy', 'Which action best protects accuracy when entering a long list of records?', '["Skip repeated checks to finish faster","Use a consistent process and verify a sample","Only enter records that look important","Ask another person to enter every record"]', 1),
  ('written-communication', 'clear-client-message', 'Which message is clearest when you need more information from a client?', '["Send it now.","Please provide the invoice number so I can check this for you.","What?","You should know the number already."]', 2),
  ('spreadsheets', 'spreadsheet-formula', 'What is a spreadsheet formula used for?', '["To calculate or transform values","To print a document","To change a monitor setting","To record audio"]', 3),
  ('customer-support', 'support-first-response', 'What is the most helpful first response to a customer reporting a problem?', '["Ignore the report","Acknowledge the issue and ask a focused question","Tell them it is not your problem","Close the conversation immediately"]', 4),
  ('research', 'research-source', 'Which source is strongest for checking a factual claim?', '["An anonymous comment","A dated primary or authoritative source","A headline without an article","A message forwarded without context"]', 5),
  ('office-administration', 'task-deadlines', 'What is a good way to manage several tasks with different deadlines?', '["Keep every deadline in memory","Record priorities and deadlines in one accessible list","Do the easiest tasks only","Wait until someone reminds you"]', 6)
) as q(skill_slug, slug, prompt, options, sort_order) on q.skill_slug = s.slug
on conflict (slug) do nothing;

insert into public.assessment_answer_keys (question_id, correct_option)
select aq.id, answer.correct_option
from public.assessment_questions aq
join (values
  ('data-entry-accuracy', 'Use a consistent process and verify a sample'),
  ('clear-client-message', 'Please provide the invoice number so I can check this for you.'),
  ('spreadsheet-formula', 'To calculate or transform values'),
  ('support-first-response', 'Acknowledge the issue and ask a focused question'),
  ('research-source', 'A dated primary or authoritative source'),
  ('task-deadlines', 'Record priorities and deadlines in one accessible list')
) as answer(slug, correct_option) on answer.slug = aq.slug
on conflict (question_id) do nothing;
