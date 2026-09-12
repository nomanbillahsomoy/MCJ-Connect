import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select(`
      avatar_url,
      headline,
      bio,
      blood_group,
      identity_id,
      identity_registry ( full_name, student_id, academic_status )
    `)
    .eq('id', user.id)
    .single()

  // Auto-initialize profile if it's missing but user has an identity
  if (!profile) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: identity } = await adminSupabase
      .from('identity_registry')
      .select('id, claim_status')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (identity) {
      // Insert blank profile
      const { error: insertError } = await adminSupabase.from('profiles').insert({
        id: user.id,
        identity_id: identity.id
      });

      if (insertError) {
        console.error("Failed to insert profile:", insertError);
        return <div className="p-8 text-red-600">Failed to create profile record: {insertError.message}</div>;
      }

      // Reload page to fetch new profile
      redirect('/profile')
    } else {
      redirect('/claim')
    }
  }

  const { data: contactInfo } = await supabase
    .from('contact_info')
    .select('phone_number, current_city')
    .eq('profile_id', user.id)
    .single()

  // Wait, what if it is initialized but pending? The UI will just show it. 
  // We can let pending users edit their profile.

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 border border-gray-200">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Academic Identity</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Official registry details.</p>
            </div>
            {profile.avatar_url && (
              <img src={profile.avatar_url} alt="Profile Avatar" className="w-16 h-16 rounded-full object-cover border" />
            )}
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{Array.isArray(profile.identity_registry) ? profile.identity_registry[0]?.full_name : (profile.identity_registry as any)?.full_name}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{Array.isArray(profile.identity_registry) ? profile.identity_registry[0]?.student_id : (profile.identity_registry as any)?.student_id}</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Academic Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 uppercase">{Array.isArray(profile.identity_registry) ? profile.identity_registry[0]?.academic_status : (profile.identity_registry as any)?.academic_status}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Professional Profile</h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your professional details to share with the community.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <ProfileForm 
                uid={user.id}
                initialData={{
                  avatarUrl: profile.avatar_url || null,
                  headline: profile.headline || '',
                  bio: profile.bio || '',
                  bloodGroup: profile.blood_group || '',
                  currentCity: contactInfo?.current_city || '',
                  phone: contactInfo?.phone_number || ''
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
