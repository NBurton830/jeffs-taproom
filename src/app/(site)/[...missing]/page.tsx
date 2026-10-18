import { notFound } from 'next/navigation'

// Unknown URLs render the branded 404 inside the site layout (SHELL-020).
export default function Missing() {
  notFound()
}
