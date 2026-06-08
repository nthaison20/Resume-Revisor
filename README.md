# Resume Revisor

An AI-powered resume tailoring app built with Next.js 14, Supabase, and the Anthropic API. Upload your resume, paste a job description, and get a rewritten resume with an ATS match score and side-by-side comparison.

## Features

- Upload resume as PDF or Word (.docx)
- AI rewrite via Claude (Anthropic API) tailored to a specific job description
- ATS keyword match score — before and after
- Side-by-side comparison with keyword highlighting
- Export revised resume as PDF
- Auth (sign up, log in, log out) via Supabase
- Sessions persist across page refreshes

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Auth + DB + Storage:** Supabase
- **AI:** Anthropic API (`claude-sonnet-4-5`)
- **PDF parsing:** `pdf-parse`, `mammoth`
- **PDF export:** `jsPDF`
- **Hosting:** Netlify

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### 3. Set up Supabase

Run the following SQL in your Supabase project (SQL Editor):

```sql
-- Resumes table
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  original_text text,
  file_url text,
  created_at timestamp with time zone default now()
);
alter table resumes enable row level security;
create policy "Users can manage their own resumes"
  on resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Revisions table
create table revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  resume_id uuid references resumes,
  job_description text,
  revised_json jsonb,
  score_before int,
  score_after int,
  created_at timestamp with time zone default now()
);
alter table revisions enable row level security;
create policy "Users can manage their own revisions"
  on revisions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Create a private **Storage bucket** named `resumes`, then run:

```sql
create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read their own resumes"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
```

In Supabase → **Authentication → URL Configuration**, add:
```
http://localhost:3000/auth/callback
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy on Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import an existing project**
2. Connect your GitHub account and select this repo
3. Set **Base directory** to `resume-revisor` (if deployed from a monorepo subfolder)
4. Build command and publish directory are set automatically via `netlify.toml`

### 3. Add environment variables

In Netlify → **Site configuration → Environment variables**, add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### 4. Update Supabase redirect URL

In Supabase → **Authentication → URL Configuration**, add your Netlify URL:
```
https://your-site.netlify.app/auth/callback
```

Netlify will auto-deploy on every push to `main`.
