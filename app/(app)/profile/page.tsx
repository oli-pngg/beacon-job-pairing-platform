import { redirect } from 'next/navigation';
import { ProfileEditor } from '@/components/profile-editor';
import { getAuthenticatedContext } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return <ProfileEditor role={(profile?.role ?? 'candidate') as UserRole} />;
}
