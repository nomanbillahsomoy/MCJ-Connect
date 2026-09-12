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
        
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Official Identity</h3>
              <p className="mt-1 text-sm text-gray-500">
                This information comes from the master registry and cannot be changed here.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded-md text-gray-900">
                    {profile.identity_registry?.full_name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student ID</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded-md text-gray-900">
                    {profile.identity_registry?.student_id}
                  </div>
                </div>
              </div>
            </div>
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
