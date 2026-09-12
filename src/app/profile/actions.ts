'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const headline = formData.get('headline') as string
  const bio = formData.get('bio') as string
  const bloodGroup = formData.get('bloodGroup') as string
  const currentCity = formData.get('currentCity') as string
  const phone = formData.get('phone') as string
  const avatarUrl = formData.get('avatarUrl') as string

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      headline,
      bio,
      blood_group: bloodGroup,
      avatar_url: avatarUrl || null
    })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  // Check if contact_info exists, if not insert, else update
  const { data: existingContact } = await supabase
    .from('contact_info')
    .select('profile_id')
    .eq('profile_id', user.id)
    .single()

  if (existingContact) {
    await supabase
      .from('contact_info')
      .update({ current_city: currentCity, phone_number: phone })
      .eq('profile_id', user.id)
  } else {
    await supabase
      .from('contact_info')
      .insert({
        profile_id: user.id,
        primary_email: user.email, // Using auth email as primary
        current_city: currentCity,
        phone_number: phone
      })
  }

  revalidatePath('/profile')
  return { success: true }
}
