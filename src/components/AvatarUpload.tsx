'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AvatarUpload({ uid, url, onUpload }: { uid: string, url: string | null, onUpload: (url: string) => void }) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      setAvatarUrl(publicUrl)
      onUpload(publicUrl)
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-6">
      <div className="shrink-0 h-24 w-24 relative rounded-full overflow-hidden bg-gray-100 border border-gray-300">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <svg className="h-full w-full text-gray-300 mt-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </div>
      <label className="block">
        <span className="sr-only">Choose profile photo</span>
        <input 
          type="file" 
          accept="image/*" 
          onChange={uploadAvatar} 
          disabled={uploading}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50
          "/>
        {uploading && <span className="text-xs text-gray-500 block mt-2">Uploading...</span>}
      </label>
    </div>
  )
}
