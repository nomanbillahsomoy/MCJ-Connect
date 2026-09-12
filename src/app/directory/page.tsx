import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>
}) {
  const { q } = await searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify the user is a member using admin client (bypassing RLS in case user_roles select policy is missing)
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: roleData } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || !['member', 'admin', 'super_admin'].includes(roleData.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">Only verified members can view the Alumni Directory.</p>
        <Link href="/dashboard" className="mt-4 text-blue-600 hover:underline">Return to Dashboard</Link>
      </div>
    )
  }

  // Fetch Directory Data
  let query = supabase
    .from('profiles')
    .select(`
      id,
      avatar_url,
      headline,
      current_city:contact_info(current_city),
      identity:identity_registry(full_name, student_id, academic_status, batch:batches(batch_number))
    `)
  
  // Basic search filter if query is provided
  if (q) {
    query = query.ilike('headline', `%${q}%`)
  }

  const { data: profiles, error } = await query

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alumni Directory</h1>
            <p className="text-gray-500 mt-2">Connect with verified members of MCJ Jagannath University</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
              Dashboard
            </Link>
            <Link href="/profile" className="text-sm font-medium text-white hover:bg-blue-700 px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm">
              My Profile
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form className="mb-8">
          <div className="max-w-md flex gap-2">
            <input 
              type="text" 
              name="q" 
              defaultValue={q || ''}
              placeholder="Search by headline or company..." 
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
            />
            <button type="submit" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium text-sm shadow-sm">
              Search
            </button>
            {q && (
              <Link href="/directory" className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-sm flex items-center">
                Clear
              </Link>
            )}
          </div>
        </form>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles?.map((profile: any) => (
            <div key={profile.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-300 mb-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.identity?.full_name} className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-full w-full text-gray-300 mt-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{profile.identity?.full_name || 'Anonymous'}</h3>
              <p className="text-sm text-blue-600 font-medium mb-1">Batch {profile.identity?.batch?.batch_number}</p>
              <p className="text-sm text-gray-600 mb-3">{profile.headline || 'No headline provided'}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 w-full">
                <p className="text-xs text-gray-500">
                  {profile.current_city?.current_city ? `📍 ${profile.current_city.current_city}` : '📍 Location hidden'}
                </p>
              </div>
            </div>
          ))}

          {(!profiles || profiles.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No verified profiles found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
