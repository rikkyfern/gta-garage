import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fbfc] text-[#1c2430]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(130deg,#f8fbfc_0%,#ffffff_48%,#eef8f5_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-[linear-gradient(155deg,rgba(104,211,196,0.34)_0%,rgba(255,255,255,0.34)_46%,transparent_47%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(335deg,rgba(138,221,172,0.24)_0%,rgba(255,255,255,0.28)_44%,transparent_45%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6">
        <div className="grid w-full overflow-hidden rounded-lg border border-white bg-white/94 shadow-[0_24px_80px_rgba(37,55,72,0.12)] backdrop-blur-xl lg:min-h-[620px] lg:grid-cols-[1.12fr_0.88fr]">
          <section className="hidden p-10 lg:flex lg:flex-col">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200"
                priority
                unoptimized
              />
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#248bd6]">GTA GARAGE</span>
            </Link>

            <div className="flex flex-1 items-center">
              <div className="w-full">
                <div className="relative mx-auto aspect-[54/35] max-w-[540px] overflow-hidden rounded-lg bg-[#e8f5f3] shadow-[0_18px_48px_rgba(37,55,72,0.16)] ring-1 ring-white/80">
                  <Image
                    src="/vice-city-auth.png"
                    alt="Vice City inspired garage artwork"
                    fill
                    sizes="540px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(20,24,36,0.10))]" />
                </div>

                <div className="mx-auto mt-7 max-w-lg text-center">
                  <h1 className="text-3xl font-semibold tracking-tight text-[#1d2434]">Vice-inspired garage control.</h1>
                  <p className="mt-3 text-sm leading-6 text-[#6d7a8a]">
                    Cars, garages, photos, and crew activity in one clean place.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[560px] items-center justify-center bg-[#fbfdfe] px-5 py-8 sm:px-8 lg:px-10">
            <div className="w-full max-w-[390px]">
              <div className="mb-7 text-center lg:hidden">
                <Link href="/" className="inline-flex flex-col items-center gap-3">
                  <Image src="/logo.png" alt="" width={58} height={58} className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200" priority unoptimized />
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#248bd6]">GTA GARAGE</span>
                </Link>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
