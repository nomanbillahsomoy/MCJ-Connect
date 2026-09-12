'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function searchIdentity(query: string) {
  if (!query || query.length < 4) {
    return { error: 'Search query must be at least 4 characters long.' }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_unclaimed_identity', { search_query: query })
  
  if (error) return { error: error.message }
  return { data }
}

export async function submitIdentityClaim(identityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "You must be logged in to claim an identity." }

  // Use Admin client to bypass RLS for this specific update
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Double check it's still unclaimed
  const { data: identity } = await adminSupabase
    .from('identity_registry')
    .select('claim_status')
    .eq('id', identityId)
    .single()

  if (!identity || identity.claim_status !== 'unclaimed') {
     return { error: "This identity is no longer available or already claimed." }
  }

  // Update record safely using Admin privileges
  const { error: updateError } = await adminSupabase
    .from('identity_registry')
    .update({
       claimed_by_user_id: user.id,
       claim_status: 'pending'
    })
    .eq('id', identityId)

  if (updateError) return { error: updateError.message }

  // Insert into User Roles
  await adminSupabase.from('user_roles').insert({
    user_id: user.id,
    role: 'pending'
  })

  // Insert an Audit Log
  await adminSupabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'identity_claim_request',
    target_id: user.id,
    table_name: 'identity_registry',
    new_data: { identity_id: identityId, status: 'pending' }
  })

  return { success: true }
}
