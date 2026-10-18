import { PHONE_DISPLAY, PHONE_TEL } from '@/lib/money'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/accessibility', 'Accessibility', 'Our commitment to an accessible website and venue, and how to tell us about any barrier you run into.')

// A11Y-012
export default function AccessibilityPage() {
  return (
    <div className="max-w-3xl space-y-4 text-lg">
      <h1 className="text-4xl font-bold uppercase">Accessibility statement</h1>
      <p>We want everyone to be able to browse our menu, order pickup and plan a visit. This site aims to meet WCAG 2.2 level AA.</p>
      <h2 className="text-2xl font-bold uppercase">What we do</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>The menu is real text, not a PDF or a picture.</li>
        <li>Everything works with a keyboard and a screen reader, and pages reflow on small screens.</li>
        <li>Every release is checked with automated accessibility tests.</li>
      </ul>
      <h2 className="text-2xl font-bold uppercase">Tell us about a problem</h2>
      <p>
        If something doesn&apos;t work for you, call us at{' '}
        <a href={PHONE_TEL} className="underline">
          {PHONE_DISPLAY}
        </a>{' '}
        and we&apos;ll take your order by phone and fix the issue.
      </p>
    </div>
  )
}
