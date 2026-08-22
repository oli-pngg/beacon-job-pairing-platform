import { getAuthenticatedContext } from '@/lib/auth';
import { DISABILITY_VALUES } from '@/lib/disability';
import { cleanAllowedArray, cleanStringArray, cleanText, cleanUuidArray, jsonError, jsonOk, safeInteger } from '@/lib/http';

const profileSelect = 'id, email, role, full_name, organization_name, headline, bio, location, work_mode, availability, years_experience, disability_types, accessibility_needs, created_at, updated_at';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    if (!user) return jsonError('Authentication required.', 401);

    const [{ data: profile, error: profileError }, { data: profileSkills, error: skillsError }] = await Promise.all([
      supabase.from('profiles').select(profileSelect).eq('id', user.id).maybeSingle(),
      supabase.from('profile_skills').select('skill_id, proficiency, source, skills(id, slug, name, category)').eq('profile_id', user.id)
    ]);
    if (profileError || skillsError) return jsonError('Unable to load your profile.', 500);
    return jsonOk({ profile, skills: profileSkills ?? [] });
  } catch {
    return jsonError('Unable to load your profile.', 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    if (!user) return jsonError('Authentication required.', 401);
    const body = await request.json() as Record<string, unknown>;
    const existing = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (existing.error || !existing.data) return jsonError('Profile not found.', 404);

    const role = existing.data.role;
    const update = {
      full_name: cleanText(body.fullName, 100),
      organization_name: role === 'employer' ? cleanText(body.organizationName, 140) || null : null,
      headline: cleanText(body.headline, 160) || null,
      bio: cleanText(body.bio, 1500) || null,
      location: cleanText(body.location, 120) || 'Legazpi City, Albay',
      work_mode: cleanText(body.workMode, 50) || 'Flexible',
      availability: cleanText(body.availability, 80) || 'Open to opportunities',
      years_experience: Math.max(0, Math.min(safeInteger(body.yearsExperience), 80)),
      disability_types: cleanAllowedArray(body.disabilityTypes, DISABILITY_VALUES, 6),
      accessibility_needs: cleanStringArray(body.accessibilityNeeds, 8, 80)
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select(profileSelect)
      .single();
    if (profileError) return jsonError('Unable to save your profile.', 500);

    const skillIds = cleanUuidArray(body.skillIds, 20);
    const { data: currentSkills, error: currentSkillsError } = await supabase
      .from('profile_skills')
      .select('skill_id, proficiency, source, verified_at')
      .eq('profile_id', user.id);
    if (currentSkillsError) return jsonError('Unable to update skills.', 500);

    const validSkills = skillIds.length
      ? await supabase.from('skills').select('id').in('id', skillIds).eq('is_active', true)
      : { data: [], error: null };
    if (validSkills.error) return jsonError('Unable to validate selected skills.', 500);
    const validIds = new Set((validSkills.data ?? []).map((skill) => skill.id));
    const selectedIds = [...validIds];
    const currentById = new Map((currentSkills ?? []).map((skill) => [skill.skill_id, skill]));

    const selectedSet = new Set(selectedIds);
    const removedIds = (currentSkills ?? []).map((skill) => skill.skill_id).filter((skillId) => !selectedSet.has(skillId));
    const deleteResults = await Promise.all(removedIds.map((skillId) => supabase.from('profile_skills').delete().eq('profile_id', user.id).eq('skill_id', skillId)));
    if (deleteResults.some((result) => result.error)) return jsonError('Unable to update selected skills.', 500);

    if (selectedIds.length) {
      const rows = selectedIds.filter((skillId) => currentById.get(skillId)?.source !== 'assessment_verified').map((skillId) => {
        const current = currentById.get(skillId);
        return {
          profile_id: user.id,
          skill_id: skillId,
          proficiency: current?.proficiency ?? 2,
          source: current?.source ?? 'self_reported',
          verified_at: current?.verified_at ?? null
        };
      });
      const { error: insertError } = await supabase.from('profile_skills').upsert(rows, { onConflict: 'profile_id,skill_id' });
      if (insertError) return jsonError('Unable to save selected skills.', 500);
    }

    return jsonOk({ profile, skills: selectedIds });
  } catch {
    return jsonError('Unable to save your profile.', 500);
  }
}
