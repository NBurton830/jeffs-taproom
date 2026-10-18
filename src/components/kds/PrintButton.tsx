'use client'

export function PrintButton() {
  return (
    <button type="button" className="no-print btn btn-secondary mt-4 w-full" onClick={() => window.print()}>
      Print
    </button>
  )
}
