'use client'

import { useRef, useState } from 'react'
import { INQUIRY_TYPES } from '@/collections/Inquiries'
import { validateInquiry, type InquiryErrors } from '@/lib/inquiries'

// VIS-020..022
type Key = keyof InquiryErrors
const FIELDS: { key: Key; label: string; type?: string; required?: boolean }[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: true },
  { key: 'date', label: 'Event date', type: 'date', required: true },
  { key: 'guests', label: 'Number of guests', type: 'number', required: true },
  { key: 'type', label: 'Event type', required: true },
  { key: 'message', label: 'Message' },
]

export function InquiryForm({ minDate }: { minDate: string }) {
  const [values, setValues] = useState<Record<Key, string>>({ name: '', email: '', phone: '', date: '', guests: '', type: '', message: '' })
  const [errors, setErrors] = useState<InquiryErrors>({})
  const [summary, setSummary] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)
  const website = useRef<HTMLInputElement>(null)
  // The server checks "after today" with its own clock; the client uses the date it was given.
  const today = new Date(new Date(`${minDate}T12:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10)

  const validateAll = (v: Record<Key, string>) => validateInquiry({ ...v, guests: v.guests === '' ? NaN : Number(v.guests) }, today)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateAll(values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setSummary(true)
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setSummary(false)
    setBusy(true)
    setServerError(null)
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, guests: Number(values.guests), website: website.current?.value ?? '' }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) setSent(true)
      else {
        if (body?.error?.fields) setErrors(body.error.fields)
        setServerError(body?.error?.message ?? 'Something went wrong. Please call us.')
      }
    } catch {
      setServerError("We couldn't send that. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <p role="status" className="card p-6 text-lg font-semibold">
        Thanks! We&apos;ll get back to you within 2 business days.
      </p>
    )
  }

  const errKeys = FIELDS.map((f) => f.key).filter((k) => errors[k])

  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-6">
      {summary && errKeys.length > 0 && (
        <div ref={summaryRef} role="alert" tabIndex={-1} className="rounded-lg border-2 border-red p-4">
          <h2 className="text-xl font-bold">Please fix the following</h2>
          <ul className="mt-2 list-disc pl-6">
            {errKeys.map((k) => (
              <li key={k}>
                <a
                  href={`#inq-${k}`}
                  className="underline"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(`inq-${k}`)?.focus()
                  }}
                >
                  {FIELDS.find((f) => f.key === k)!.label}: {errors[k]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {serverError && (
        <p role="alert" className="font-semibold text-red-dark">
          {serverError}
        </p>
      )}
      {FIELDS.map((f) => {
        const id = `inq-${f.key}`
        const err = errors[f.key]
        const common = {
          id,
          name: f.key,
          className: 'input',
          value: values[f.key],
          'aria-invalid': err ? (true as const) : undefined,
          'aria-required': f.required ? (true as const) : undefined,
          'aria-describedby': [f.required ? `${id}-hint` : '', err ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [f.key]: e.target.value })),
          onBlur: () => {
            if (values[f.key] !== '' || errors[f.key]) setErrors((cur) => ({ ...cur, [f.key]: validateAll(values)[f.key] }))
          },
        }
        return (
          <div key={f.key}>
            <label htmlFor={id} className="field-label">
              {f.label}
            </label>
            {f.key === 'type' ? (
              <select {...common}>
                <option value="">Choose…</option>
                {INQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : f.key === 'message' ? (
              <textarea {...common} className="input min-h-28" maxLength={2000} />
            ) : (
              <input {...common} type={f.type ?? 'text'} {...(f.key === 'date' ? { min: minDate } : {})} {...(f.key === 'guests' ? { min: 1, max: 200 } : {})} />
            )}
            {f.required && (
              <p id={`${id}-hint`} className="field-hint">
                Required
              </p>
            )}
            {err && (
              <p id={`${id}-err`} className="field-error">
                {err}
              </p>
            )}
          </div>
        )
      })}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="inq-website">Website</label>
        <input ref={website} id="inq-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}
