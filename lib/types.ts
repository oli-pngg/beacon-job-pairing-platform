export type UserRole = 'candidate' | 'employer' | 'admin';
export type JobStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'submitted' | 'shortlisted' | 'interview' | 'rejected' | 'hired';

export type Profile = {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  organization_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  work_mode: string;
  availability: string;
  years_experience: number;
  disability_types: string[];
  accessibility_needs: string[];
  created_at?: string;
  updated_at?: string;
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

export type JobSkill = {
  skill_id: string;
  required_level: number;
  importance: number;
  skills?: Skill | Skill[] | null;
};

export type Job = {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string;
  work_mode: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  accommodations: string | null;
  status: JobStatus;
  created_at: string;
  job_skills?: JobSkill[];
  organization_name?: string | null;
  fit_score?: number;
  matched_skills?: string[];
  match_reason?: string;
  application_status?: ApplicationStatus | null;
};

export type CandidateSkill = {
  skill_id: string;
  proficiency: number;
  source: string;
  skills?: Skill | Skill[] | null;
};

export type AssessmentQuestion = {
  id: string;
  skill_id: string;
  prompt: string;
  options: string[];
  points: number;
  sort_order: number;
};

export type CandidatePreview = {
  application_id: string;
  job_id: string;
  job_title: string;
  candidate_ref: string;
  fit_score: number;
  matched_skills: string[];
  status: ApplicationStatus;
  created_at: string;
};
