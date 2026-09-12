import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="font-bold text-2xl flex items-center gap-2">
            <span className="bg-white text-blue-900 px-2 py-0.5 rounded-sm tracking-tight">MCJ</span>
            <span className="tracking-wide">Connect</span>
          </div>
          <div>
            {user ? (
              <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-md font-medium text-sm transition duration-150 ease-in-out shadow-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-md font-medium text-sm transition duration-150 ease-in-out shadow-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-flex items-center justify-center p-3 bg-blue-100 rounded-full">
            <svg className="w-10 h-10 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9-5-9 5-9-5-9 5z"></path></svg>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Jagannath University <br className="hidden sm:block" />
            <span className="text-blue-700">Mass Communication & Journalism</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The official digital network for the alumni and students. Connect with your batchmates, discover professional opportunities, and stay updated with department notices.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link href="/claim" className="px-8 py-3.5 bg-blue-700 text-white text-lg font-medium rounded-lg hover:bg-blue-800 shadow-md transition transform hover:-translate-y-0.5">
                  Claim Your Identity
                </Link>
                <Link href="/login" className="px-8 py-3.5 bg-white text-blue-700 border border-blue-200 text-lg font-medium rounded-lg hover:bg-blue-50 shadow-sm transition transform hover:-translate-y-0.5">
                  Member Login
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="px-8 py-3.5 bg-blue-700 text-white text-lg font-medium rounded-lg hover:bg-blue-800 shadow-md transition transform hover:-translate-y-0.5">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-blue-900/5 hover:shadow-xl transition duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Directory</h3>
              <p className="text-gray-600 leading-relaxed">Search and connect with verified alumni and current students from all 17 batches of MCJ.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-blue-900/5 hover:shadow-xl transition duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl">📰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Notice Board</h3>
              <p className="text-gray-600 leading-relaxed">Stay up to date with the latest announcements, department events, and professional job postings.</p>
            </div>
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-lg shadow-blue-900/5 hover:shadow-xl transition duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed">Your data is completely safe. Only verified department members can access the directory and contact info.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-gray-300 text-base mb-2 font-medium">MCJ Connect</p>
          <p>© {new Date().getFullYear()} Jagannath University. All rights reserved.</p>
          <p className="mt-2 text-gray-500">Developed for the Alumni & Students of Mass Communication & Journalism.</p>
        </div>
      </footer>
    </div>
  )
}
