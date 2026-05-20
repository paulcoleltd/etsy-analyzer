import Link from 'next/link'
import { BarChart2 } from 'lucide-react'

export const metadata = { title: 'Privacy Policy — Etsy Analyzer' }

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f1f4f9]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-500/30">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Etsy Analyzer</span>
          </Link>
          <Link href="/auth/signin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="mb-10 text-sm text-slate-400">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none space-y-8">
          {[
            {
              title: '1. Information We Collect',
              body: 'We collect information you provide directly (name, email, password), information from your Etsy account when you connect it (shop data, listing metrics, transaction history — read-only), and usage data such as searches performed and features used.',
            },
            {
              title: '2. How We Use Your Information',
              body: 'We use your information to provide and improve the service, personalise your experience, send transactional emails (account verification, billing receipts), and send product updates (you can unsubscribe at any time).',
            },
            {
              title: '3. Etsy OAuth & Shop Data',
              body: 'When you connect your Etsy shop, we use OAuth 2.0 with PKCE. We request read-only scopes — we never post, modify, or delete listings on your behalf. Your Etsy access tokens are encrypted at rest using AES-256.',
            },
            {
              title: '4. Data Storage & Security',
              body: 'Your data is stored on servers in the EU. We use industry-standard encryption in transit (TLS 1.3) and at rest. Passwords are hashed with bcrypt. We perform regular security audits.',
            },
            {
              title: '5. Data Sharing',
              body: 'We do not sell your personal data. We may share data with trusted sub-processors (hosting, email delivery, payment processing) under data processing agreements. We will disclose data if required by law.',
            },
            {
              title: '6. Your Rights',
              body: 'Under GDPR and UK GDPR, you have the right to access, correct, delete, or export your personal data. You can delete your account at any time from Settings → Profile. Data is permanently deleted within 30 days of account deletion.',
            },
            {
              title: '7. Cookies',
              body: 'We use essential cookies for session management and authentication. We do not use third-party tracking or advertising cookies.',
            },
            {
              title: '8. Children\'s Privacy',
              body: 'The service is not directed at children under 18. We do not knowingly collect personal information from minors.',
            },
            {
              title: '9. Changes to This Policy',
              body: 'We will notify you of material changes via email at least 14 days before they take effect.',
            },
            {
              title: '10. Contact',
              body: 'For privacy questions or data requests, contact our Data Protection Officer at privacy@etsy-analyzer.com.',
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="mb-2 text-lg font-bold text-slate-800">{title}</h2>
              <p className="text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/terms" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">Terms of Service →</Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">← Back to home</Link>
        </div>
      </div>
    </main>
  )
}
