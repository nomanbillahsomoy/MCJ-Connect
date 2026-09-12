'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import AvatarUpload from '@/components/AvatarUpload'

type ProfileData = {
  avatarUrl: string | null
  headline: string
  bio: string
  bloodGroup: string
  currentCity: string
  phone: string
}

export default function ProfileForm({ uid, initialData }: { uid: string, initialData: ProfileData }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatarUrl)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const formData = new FormData(e.currentTarget)
    // Append the current avatar URL state so it gets saved
    if (avatarUrl) {
      formData.append('avatarUrl', avatarUrl)
    }

    const { success, error } = await updateProfile(formData)
    
    setLoading(false)
    if (error) {
      setMessage(`Error: ${error}`)
    } else if (success) {
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Profile Photo
        </label>
        <AvatarUpload 
          uid={uid} 
          url={avatarUrl} 
          onUpload={(url) => setAvatarUrl(url)} 
        />
      </div>

      <div>
        <label htmlFor="headline" className="block text-sm font-medium text-gray-700">
          Professional Headline
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="headline"
            id="headline"
            defaultValue={initialData.headline}
            placeholder="e.g. Senior Reporter at Prothom Alo"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          About / Bio
        </label>
        <div className="mt-1">
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={initialData.bio}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md px-3 py-2"
            placeholder="Brief description about your experience..."
          />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-6">
        <div className="col-span-6 sm:col-span-3">
          <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
            Blood Group
          </label>
          <select
            id="bloodGroup"
            name="bloodGroup"
            defaultValue={initialData.bloodGroup}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Select...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>

        <div className="col-span-6 sm:col-span-3">
          <label htmlFor="currentCity" className="block text-sm font-medium text-gray-700">
            Current City
          </label>
          <input
            type="text"
            name="currentCity"
            id="currentCity"
            defaultValue={initialData.currentCity}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
          />
        </div>
        
        <div className="col-span-6 sm:col-span-3">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number (Hidden by default)
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            defaultValue={initialData.phone}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4">
        {message && (
          <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="ml-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}
