import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Handle logout action
  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Check identity status bypassing RLS to ensure accurate dashboard state
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: identity } = await adminSupabase
    .from('identity_registry')
    .select('claim_status, full_name, student_id')
    .eq('claimed_by_user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex gap-4 items-center">
            <Link href="/profile" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              My Profile
            </Link>
            <form action={signOut}>
              <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                Sign Out
              </button>
            </form>
          </div>
        </div>
        <p className="text-gray-600 mb-6">Welcome! You are logged in as <span className="font-semibold">{user.email}</span>.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/profile" className="block p-6 bg-white rounded-lg border border-gray-200 shadow hover:bg-gray-50 transition">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">My Profile</h5>
            <p className="font-normal text-gray-700">Update your professional details and contact information.</p>
          </Link>
          <Link href="/directory" className="block p-6 bg-white rounded-lg border border-gray-200 shadow hover:bg-gray-50 transition">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Alumni Directory</h5>
            <p className="font-normal text-gray-700">Search and connect with other verified members of the department.</p>
          </Link>
          <Link href="/notices" className="block p-6 bg-white rounded-lg border border-gray-200 shadow hover:bg-gray-50 transition">
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Notice Board</h5>
            <p className="font-normal text-gray-700">View department news, events, announcements, and job offers.</p>
          </Link>
        </div>

        {!identity ? (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">Next Step: Claim Your Identity</h2>
            <p className="text-sm text-yellow-800 mb-4">
              It looks like you haven't verified your identity yet.
            </p>
            <Link href="/claim" className="inline-block bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700">
              Go to Identity Claim
            </Link>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Identity Claimed</h2>
            <p className="text-sm text-green-800 mb-2">
              Name: <strong>{identity.full_name}</strong> | ID: <strong>{identity.student_id}</strong>
            </p>
            <p className="text-sm text-green-800 mb-4">
              Status: <span className="uppercase font-bold">{identity.claim_status}</span>
            </p>
            
            {identity.claim_status === 'pending' && (
              <p className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded mb-4">
                Your account is pending admin verification. You can still set up your profile while you wait.
              </p>
            )}

            <Link href="/profile" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
              Edit Professional Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
