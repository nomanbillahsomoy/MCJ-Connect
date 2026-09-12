'use client'

import { useState } from 'react'
import { searchIdentity, submitIdentityClaim } from './actions'
import { useRouter } from 'next/navigation'

type SearchResult = {
  id: string
  full_name: string
  student_id_masked: string
}

export default function ClaimForm() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResults([])
    
    if (query.length < 4) {
      setError('Please enter at least 4 characters.')
      return
    }

    setLoading(true)
    const { data, error: searchError } = await searchIdentity(query)
    setLoading(false)

    if (searchError) {
      setError(searchError)
      return
    }

    if (data && data.length === 0) {
      setError('No unclaimed identities found matching your search.')
    } else if (data) {
      setResults(data)
    }
  }

  const handleClaim = async (identityId: string) => {
    setLoading(true)
    setError('')
    
    const { success, error: claimError } = await submitIdentityClaim(identityId)
    setLoading(false)

    if (claimError) {
      setError(claimError)
    } else if (success) {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    }
  }

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-md text-center">
        <h3 className="text-lg font-medium text-green-900 mb-2">Claim Request Submitted!</h3>
        <p className="text-sm text-green-700">
          Your request has been sent for verification. You will be redirected to the dashboard shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="search-query" className="sr-only">Search</label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Name or Student ID (e.g. B170...)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Searching...' : 'Search Registry'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Matches found:</h3>
          <ul className="space-y-3">
            {results.map((result) => (
              <li key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">{result.full_name}</p>
                  <p className="text-xs text-gray-500">ID: {result.student_id_masked}</p>
                </div>
                <button
                  onClick={() => handleClaim(result.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 focus:outline-none disabled:bg-green-300"
                >
                  Claim This
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
