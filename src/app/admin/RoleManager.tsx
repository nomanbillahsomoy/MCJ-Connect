'use client'

import { useState } from 'react'
import { updateUserRole } from './actions'

type Member = {
  user_id: string
  role: string
  assigned_batch_id: string | null
  full_name: string
  student_id: string
  batch_number: number
}

type Batch = {
  id: string
  batch_number: number
}

export default function RoleManager({ members, batches }: { members: Member[], batches: Batch[] }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // State to hold local form changes for each user
  const [roleStates, setRoleStates] = useState<Record<string, { role: string, batchId: string }>>({})

  const handleRoleChange = (userId: string, newRole: string) => {
    setRoleStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], role: newRole, batchId: prev[userId]?.batchId || '' }
    }))
  }

  const handleBatchChange = (userId: string, newBatchId: string) => {
    setRoleStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], role: prev[userId]?.role || 'batch_rep', batchId: newBatchId }
    }))
  }

  const handleSave = async (userId: string) => {
    const currentState = roleStates[userId]
    if (!currentState) return

    setUpdatingId(userId)
    const { error } = await updateUserRole(userId, currentState.role, currentState.batchId)
    
    if (error) {
      alert(error)
    } else {
      alert('Role updated successfully!')
    }
    
    setUpdatingId(null)
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200 mt-6">
      <ul role="list" className="divide-y divide-gray-200">
        {members.map((member) => {
          const currentLocalState = roleStates[member.user_id] || { 
            role: member.role, 
            batchId: member.assigned_batch_id || '' 
          }
          
          const hasChanged = currentLocalState.role !== member.role || 
            (currentLocalState.role === 'batch_rep' && currentLocalState.batchId !== (member.assigned_batch_id || ''))

          return (
            <li key={member.user_id} className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{member.full_name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID: <span className="font-semibold">{member.student_id}</span> • Batch {member.batch_number}
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  Current Role: {member.role}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                <select
                  value={currentLocalState.role}
                  onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                  className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white"
                >
                  <option value="member">Member</option>
                  <option value="batch_rep">Batch Rep</option>
                  <option value="admin">Admin</option>
                </select>

                {currentLocalState.role === 'batch_rep' && (
                  <select
                    value={currentLocalState.batchId}
                    onChange={(e) => handleBatchChange(member.user_id, e.target.value)}
                    className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white"
                  >
                    <option value="" disabled>Select Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>Batch {b.batch_number}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => handleSave(member.user_id)}
                  disabled={updatingId === member.user_id || !hasChanged || (currentLocalState.role === 'batch_rep' && !currentLocalState.batchId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {updatingId === member.user_id ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </li>
          )
        })}

        {members.length === 0 && (
          <li className="p-8 text-center text-gray-500">
            No verified members found.
          </li>
        )}
      </ul>
    </div>
  )
}
