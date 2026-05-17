import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold text-orange-500">Etsy Analyzer</span>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Start free
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Market intelligence for<br />
          <span className="text-orange-500">Etsy sellers</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Revenue estimates, keyword research, competitor tracking, and listing
          optimisation — everything EverBee and eRank offer, in one clean dashboard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="rounded-xl bg-orange-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100"
          >
            Start for free
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-gray-200 px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Revenue Estimates', desc: 'See monthly revenue for any Etsy listing without connecting your shop.' },
          { title: 'Keyword Research', desc: 'Find high-volume, low-competition keywords with trend forecasting.' },
          { title: 'Listing Grader', desc: 'Get an A–F grade with AI-powered suggestions to improve any listing.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border bg-gray-50 p-6">
            <h3 className="font-bold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
