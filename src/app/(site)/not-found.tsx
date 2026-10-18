import Link from 'next/link'

export const metadata = { title: 'Page not found' }

// SHELL-020
export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <p className="font-display text-7xl font-bold text-red">404</p>
      <h1 className="mt-2 text-4xl font-bold uppercase">This page went to the bar and never came back</h1>
      <p className="mt-3 text-lg">The page you&apos;re looking for doesn&apos;t exist.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/menu" className="btn btn-primary">
          See the menu
        </Link>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  )
}
