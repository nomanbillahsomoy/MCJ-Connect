import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PendingClaims from './PendingClaims'
import RoleManager from './RoleManager'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use admin client to reliably check role 
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: roleData } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">Only administrators can access this panel.</p>
        <Link href="/dashboard" className="mt-4 text-blue-600 hover:underline">Return to Dashboard</Link>
      </div>
    )
  }

  // Fetch all pending claims
  const { data: pendingClaims } = await adminSupabase
    .from('identity_registry')
    .select(`
      id,
      full_name,
      student_id,
      academic_status,
      claimed_by_user_id,
      batch:batches(batch_number)
    `)
    .eq('claim_status', 'pending')
    .order('student_id', { ascending: true })

  // Fetch data for Role Manager
  // 1. Fetch batches
  const { data: batches } = await adminSupabase
    .from('batches')
    .select('id, batch_number')
    .order('batch_number', { ascending: true })

  // 2. Fetch verified identities and manually join roles since there's no direct FK
  const { data: verifiedIdentities } = await adminSupabase
    .from('identity_registry')
    .select(`id, full_name, student_id, claimed_by_user_id, batch:batches(batch_number)`)
    .eq('claim_status', 'verified')
    .not('claimed_by_user_id', 'is', null)

  const { data: userRoles } = await adminSupabase
    .from('user_roles')
    .select('user_id, role, assigned_batch_id')
    .neq('role', 'pending')

  // Merge the two datasets
  const members = (verifiedIdentities || []).map(identity => {
    const roleInfo = userRoles?.find(r => r.user_id === identity.claimed_by_user_id)
    return {
      user_id: identity.claimed_by_user_id!,
      role: roleInfo?.role || 'member',
      assigned_batch_id: roleInfo?.assigned_batch_id || null,
      full_name: identity.full_name,
      student_id: identity.student_id,
      batch_number: (identity.batch as any)?.batch_number
    }
  }).filter(m => m.user_id !== user.id) // Filter out the current admin so they don't accidentally demote themselves

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-2">Manage users, verify claims, and assign roles.</p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
            Exit Admin
          </Link>
        </div>

        <div className="space-y-12">
          {/* Identity Claims Section */}
          <section>
            <div className="border-b border-gray-200 pb-5 mb-5">
              <h3 className="text-xl font-semibold leading-6 text-gray-900">
                Pending Identity Claims
              </h3>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Review users who have claimed an identity from the registry but haven't been verified yet.
              </p>
            </div>
            
            <PendingClaims claims={pendingClaims || []} />
          </section>

          {/* Role Management Section */}
          <section>
            <div className="border-b border-gray-200 pb-5 mb-5">
              <h3 className="text-xl font-semibold leading-6 text-gray-900">
                Member Management (Roles & Batch Reps)
              </h3>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                Promote verified members to Admins or assign them as Batch Representatives. A Batch Rep can verify claims for their specific batch.
              </p>
            </div>
            
            <RoleManager members={members} batches={batches || []} />
          </section>
        </div>
      </div>
    </div>
  )
}
