export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Create Your Project',
      description: 'Set up your Erasmus+ project with AI-guided templates and best practices.',
    },
    {
      number: '2',
      title: 'Collaborate & Track',
      description: 'Invite partners, assign tasks, and monitor progress with automated compliance checks.',
    },
    {
      number: '3',
      title: 'Report & Succeed',
      description: 'Generate impact reports, financial statements, and final evaluations effortlessly.',
    },
  ];

  return (
    <section className="bg-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Simple, powerful workflow
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Get started in minutes, not weeks
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {/* Connector line (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-accent to-accent/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <a
            href="#hero"
            className="inline-block rounded-lg bg-cta px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-cta/90 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            Join the Waitlist
          </a>
          <p className="mt-4 text-sm text-gray-500">
            Limited spots available for early access
          </p>
        </div>
      </div>
    </section>
  );
}
