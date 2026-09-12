import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ClaimForm from './ClaimForm'

export default async function ClaimPage() {
  const supabase = await createClient()

  // Ensure user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Claim Your Identity
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Search for your name or Student ID to link your account to the official department registry.
          </p>
        </div>
        
        <ClaimForm />

        <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center">
              Identity verification is required to access the directory. The Super Admin or your Batch Representative will review your claim.
            </p>
        </div>
      </div>
    </div>
  )
}
