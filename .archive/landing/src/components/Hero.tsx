export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"></div>
        <div className="absolute top-1/2 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-cta/10 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-block rounded-full bg-accent/10 px-4 py-2">
          <span className="text-sm font-semibold text-accent">🌍 Swedish Nonprofit Association</span>
        </div>

        <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Empowering Youth & Organisations
          <br />
          <span className="text-accent">Through Erasmus+</span>
        </h1>

        <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-700 sm:text-xl">
          Open Horizon is a Swedish nonprofit association dedicated to creating meaningful international
          opportunities for young people and organisations through Erasmus+ projects. We specialise in
          inclusive youth exchanges, capacity building, and youth participation initiatives that build
          confidence, skills, and global understanding.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://app.openhorizon.cc/sign-up"
            className="inline-flex items-center justify-center rounded-lg bg-cta px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-cta/90 hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started →
          </a>
          <a
            href="https://app.openhorizon.cc/sign-in"
            className="inline-flex items-center justify-center rounded-lg border-2 border-accent bg-white px-8 py-4 text-base font-semibold text-accent transition-all hover:bg-accent hover:text-white"
          >
            Sign In
          </a>
        </div>
      </div>
    </section>
  );
}
