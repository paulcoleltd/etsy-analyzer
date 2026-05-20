import Link from 'next/link'
import { BarChart2 } from 'lucide-react'

export const metadata = { title: 'Terms of Service — Etsy Analyzer' }

export default function TermsPage() {
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
        <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Terms of Service</h1>
        <p className="mb-10 text-sm text-slate-400">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-slate max-w-none space-y-8">
          {[
            {
              title: '1. Acceptance of Terms',
              body: 'By accessing or using Etsy Analyzer, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.',
            },
            {
              title: '2. Description of Service',
              body: 'Etsy Analyzer provides market research, keyword analysis, listing grading, and competitor tracking tools for Etsy sellers. The service is provided "as is" and may be updated or modified at any time.',
            },
            {
              title: '3. User Accounts',
              body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. You must be at least 18 years of age to use this service.',
            },
            {
              title: '4. Acceptable Use',
              body: 'You agree not to use the service for any unlawful purpose, to scrape or bulk-download data beyond your plan limits, to attempt to circumvent rate limits or access controls, or to resell or redistribute data obtained from the service without written permission.',
            },
            {
              title: '5. Subscription & Billing',
              body: 'Paid plans are billed monthly or annually as selected. Subscriptions automatically renew unless cancelled before the renewal date. Refunds are handled on a case-by-case basis — contact support within 14 days of a charge if you believe it was made in error.',
            },
            {
              title: '6. Intellectual Property',
              body: 'All content, trademarks, and data provided by Etsy Analyzer remain the property of Etsy Analyzer or its licensors. Your own shop data remains yours.',
            },
            {
              title: '7. Limitation of Liability',
              body: 'To the maximum extent permitted by law, Etsy Analyzer shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.',
            },
            {
              title: '8. Changes to Terms',
              body: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of material changes via email.',
            },
            {
              title: '9. Contact',
              body: 'For questions about these terms, please contact us at support@etsy-analyzer.com.',
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="mb-2 text-lg font-bold text-slate-800">{title}</h2>
              <p className="text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/privacy" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">Privacy Policy →</Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">← Back to home</Link>
        </div>
      </div>
    </main>
  )
}
