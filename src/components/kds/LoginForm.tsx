'use client'

import { useState } from 'react'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        setBusy(true)
        setError(null)
        try {
          const res = await fetch('/api/users/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
          })
          if (res.ok) {
            window.location.assign('/kitchen')
            return
          }
          setError(res.status === 401 || res.status === 400 ? 'Invalid email or password' : 'Too many attempts — try again in 10 minutes')
        } catch {
          setError("Can't reach the server. Check the connection.")
        }
        setBusy(false)
      }}
    >
      <div>
        <label htmlFor="kds-email" className="field-label">
          Email
        </label>
        <input id="kds-email" name="email" type="email" autoComplete="username" required className="input" />
      </div>
      <div>
        <label htmlFor="kds-password" className="field-label">
          Password
        </label>
        <input id="kds-password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {error && (
        <p role="alert" className="font-semibold text-gold">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        Sign in
      </button>
    </form>
  )
}
