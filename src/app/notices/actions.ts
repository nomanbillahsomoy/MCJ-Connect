'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNotice(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Use admin client to bypass RLS for role checking
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

  if (!roleData || !['super_admin', 'admin', 'batch_rep'].includes(roleData.role)) {
    return { error: 'You do not have permission to post notices.' }
  }

  // Use admin client to insert so we bypass RLS issues 
  // (we already authorized them securely above)
  const { error } = await adminSupabase.from('notices').insert({
    title,
    content,
    category,
    author_id: user.id
  })

  if (error) {
    console.error('Failed to post notice:', error)
    // You could also redirect to an error page, or we can just throw to trigger Next.js error boundary
    throw new Error(error.message)
  }
  
  revalidatePath('/notices')
  revalidatePath('/dashboard')
  redirect('/notices')
}
