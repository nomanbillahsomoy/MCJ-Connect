'use client'

import { useState } from 'react'
import { approveClaim, rejectClaim } from './actions'

type Claim = {
  id: string
  full_name: string
  student_id: string
  academic_status: string
  claimed_by_user_id: string
  batch: {
    batch_number: number
  }
}

export default function PendingClaims({ claims }: { claims: Claim[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleApprove = async (identityId: string, userId: string) => {
    setLoadingId(identityId)
    setError('')
    const { error } = await approveClaim(identityId, userId)
    if (error) setError(error)
    setLoadingId(null)
  }

  const handleReject = async (identityId: string, userId: string) => {
    if (!confirm('Are you sure you want to reject this claim?')) return
    
    setLoadingId(identityId)
    setError('')
    const { error } = await rejectClaim(identityId, userId)
    if (error) setError(error)
    setLoadingId(null)
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No pending claims to review.</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {claims.map((claim) => (
            <li key={claim.id} className="p-4 sm:px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{claim.full_name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID: <span className="font-semibold">{claim.student_id}</span> • Batch: {claim.batch?.batch_number} • {claim.academic_status}
                </p>
                <p className="text-xs text-gray-400 mt-1">Claimed by User: {claim.claimed_by_user_id}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleReject(claim.id, claim.claimed_by_user_id)}
                  disabled={loadingId === claim.id}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-transparent rounded-md shadow-sm disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(claim.id, claim.claimed_by_user_id)}
                  disabled={loadingId === claim.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-transparent rounded-md shadow-sm disabled:opacity-50"
                >
                  {loadingId === claim.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
