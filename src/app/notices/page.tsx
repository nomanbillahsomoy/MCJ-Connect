import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NoticesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use admin client to reliably fetch notices and roles 
  // (bypassing cross-table RLS issues since we control access here)
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch notices first
  const { data: noticesData, error } = await adminSupabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notices:', error)
  }

  // Fetch author names manually to avoid complex PostgREST join issues with auth.users
  let notices = noticesData || []
  if (notices.length > 0) {
    const authorIds = notices.map(n => n.author_id)
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, identity:identity_registry(full_name)')
      .in('id', authorIds)
      
    notices = notices.map(notice => {
      const profile = profiles?.find(p => p.id === notice.author_id)
      return {
        ...notice,
        author: profile
      }
    })
  }

  const { data: roleData } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const canCreate = roleData && ['super_admin', 'admin', 'batch_rep'].includes(roleData.role)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notice Board</h1>
            <p className="text-gray-500 mt-2">Stay updated with department news, events, and job offers.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
              Dashboard
            </Link>
            {canCreate && (
              <Link href="/notices/create" className="text-sm font-medium text-white hover:bg-blue-700 px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm">
                Post Notice
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {notices?.map((notice: any) => (
            <div key={notice.id} className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{notice.title}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Posted by <span className="font-medium text-gray-700">{notice.author?.identity?.full_name || 'Admin'}</span> on {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${notice.category === 'event' ? 'bg-purple-100 text-purple-800' : 
                    notice.category === 'job' ? 'bg-green-100 text-green-800' : 
                    notice.category === 'announcement' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'}`}>
                  {notice.category.toUpperCase()}
                </span>
              </div>
              <div className="px-4 py-5 sm:p-6 text-gray-700 whitespace-pre-wrap">
                {notice.content}
              </div>
            </div>
          ))}

          {(!notices || notices.length === 0) && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No notices posted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
