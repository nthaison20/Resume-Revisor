'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12">
      {/* Animated lava lamp background */}
      <div className="lava-bg" aria-hidden="true">
        <div className="lava-blob b1" />
        <div className="lava-blob b2" />
        <div className="lava-blob b3" />
        <div className="lava-blob b4" />
      </div>

      {/* App header */}
      <header className="mb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
          Resume Revisor
        </h1>
        <p className="text-sm text-white/70 mt-1">Tailor your resume to any job with AI</p>
      </header>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          No account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer credit */}
      <footer className="mt-8 text-center">
        <p className="text-xs text-white/60">Designed by Thaison Nguyen</p>
      </footer>
    </div>
  )
}
