'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to get admin supabase (bypasses RLS for admin operations)
const getAdminSupabase = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Security check helper
async function verifyIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false }

  const adminSupabase = getAdminSupabase()
  const { data: roleData } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = roleData && ['admin', 'super_admin'].includes(roleData.role)
  return { user, isAdmin }
}

export async function approveClaim(identityId: string, claimedByUserId: string) {
  const { user, isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { error: 'Unauthorized access' }

  const adminSupabase = getAdminSupabase()

  // 1. Update identity status
  const { error: idError } = await adminSupabase.from('identity_registry')
    .update({ claim_status: 'verified' })
    .eq('id', identityId)
  
  if (idError) return { error: idError.message }

  // 2. Update user role
  await adminSupabase.from('user_roles')
    .update({ role: 'member' })
    .eq('user_id', claimedByUserId)

  // 3. Create blank profile
  await adminSupabase.from('profiles').insert({
    id: claimedByUserId,
    identity_id: identityId
  })

  // 4. Audit Log
  await adminSupabase.from('audit_logs').insert({
    actor_id: user!.id,
    action: 'approve_claim',
    target_id: claimedByUserId,
    table_name: 'identity_registry',
    new_data: { identity_id: identityId, status: 'verified' }
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function rejectClaim(identityId: string, claimedByUserId: string) {
  const { user, isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { error: 'Unauthorized access' }

  const adminSupabase = getAdminSupabase()

  // 1. Reset identity status
  const { error: idError } = await adminSupabase.from('identity_registry')
    .update({ claim_status: 'unclaimed', claimed_by_user_id: null })
    .eq('id', identityId)
    
  if (idError) return { error: idError.message }

  // 2. Remove pending role so they can try again with a different ID
  await adminSupabase.from('user_roles')
    .delete()
    .eq('user_id', claimedByUserId)

  // 3. Audit Log
  await adminSupabase.from('audit_logs').insert({
    actor_id: user!.id,
    action: 'reject_claim',
    target_id: claimedByUserId,
    table_name: 'identity_registry',
    new_data: { identity_id: identityId, status: 'rejected' }
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserRole(targetUserId: string, newRole: string, assignedBatchId?: string | null) {
  const { user, isAdmin } = await verifyIsAdmin()
  if (!isAdmin) return { error: 'Unauthorized access' }

  const adminSupabase = getAdminSupabase()
  const finalBatchId = newRole === 'batch_rep' ? assignedBatchId : null

  const { error } = await adminSupabase
    .from('user_roles')
    .update({ role: newRole, assigned_batch_id: finalBatchId })
    .eq('user_id', targetUserId)

  if (error) return { error: error.message }

  await adminSupabase.from('audit_logs').insert({
    actor_id: user!.id,
    action: 'update_role',
    target_id: targetUserId,
    table_name: 'user_roles',
    new_data: { role: newRole, assigned_batch_id: finalBatchId }
  })

  revalidatePath('/admin')
  return { success: true }
}
