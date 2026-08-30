export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      {/* left branding (hidden on mobile) */}
      <div className="hidden w-[42%] flex-col justify-between bg-primary-dark p-8 text-white md:flex">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-primary-dark">360</span>
            Properti360
          </p>
          <h1 className="mt-10 text-3xl font-bold leading-tight">Kelola virtual tour & listing SEO dalam satu dashboard.</h1>
          <p className="mt-3 text-sm leading-6 text-white/70">Login untuk akses dashboard admin/customer • Listing publik tetap SEO-friendly & ringan.</p>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} Properti360 • Next.js 15 • Auth.js</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
