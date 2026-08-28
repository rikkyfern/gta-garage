import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen text-garage-text">
      <nav className="border-b border-garage-border/70 bg-white/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="GTA Garage home">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-garage-border"
              priority
              unoptimized
            />
            <span className="text-sm font-semibold tracking-[0.18em] text-garage-text sm:text-base">
              GTA GARAGE
            </span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-12 text-center">
        <section className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-tight text-garage-text sm:text-6xl lg:text-7xl">
            Welcome TFIC
          </h1>

          <div className="mt-10 flex flex-col items-center justify-center gap-4">
            <Link href="/login" className="btn-primary px-7 py-3">
              Open Secure Login
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="text-sm text-garage-subtle">
              New player?{' '}
              <Link href="/register" className="font-medium text-garage-neon-blue hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
