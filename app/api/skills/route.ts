import { getAuthenticatedContext } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedContext();
    if (!user) return jsonError('Authentication required.', 401);
    const { data, error } = await supabase.from('skills').select('id, slug, name, category').eq('is_active', true).order('category').order('name');
    if (error) return jsonError('Unable to load skills.', 500);
    return jsonOk({ skills: data ?? [] });
  } catch {
    return jsonError('Unable to load skills.', 500);
  }
}
