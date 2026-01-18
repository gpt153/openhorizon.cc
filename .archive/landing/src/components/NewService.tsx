export default function NewService() {
  const services = [
    {
      icon: '📌',
      title: 'Identify the right Erasmus+ opportunities',
      description: 'We assess your goals and match them to the most suitable Erasmus+ actions (youth exchanges, training, partnerships, capacity-building, etc.).',
    },
    {
      icon: '📌',
      title: 'Develop competitive project applications',
      description: 'We assist in writing and preparing complete Erasmus+ applications that meet eligibility, quality, and impact criteria.',
    },
    {
      icon: '📌',
      title: 'Plan and manage project implementation',
      description: 'From workplans and budgets to schedules and risk management, we support the operational delivery of your project.',
    },
    {
      icon: '📌',
      title: 'Reporting and follow-up',
      description: 'We prepare the required project reports, documentation, evaluation summaries, and dissemination measures — ensuring compliance with Erasmus+ requirements.',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-accent to-blue-700 px-6 py-16 text-white lg:py-24">
      <div className="absolute inset-0 -z-10 overflow-hidden opacity-10">
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-white blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
          NEW SERVICE: Project Support & Implementation for Organisations
        </h2>
        <p className="mx-auto mb-12 max-w-4xl text-center text-lg">
          In addition to running our own programmes, Open Horizon now offers professional support services
          to other organisations who want to engage in Erasmus+ but need expertise in project design and delivery.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {services.map((service, index) => (
            <div
              key={index}
              className="rounded-lg bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <h3 className="mb-3 text-xl font-semibold">
                {service.icon} {service.title}
              </h3>
              <p className="text-blue-100">{service.description}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-blue-100">
          Open Horizon's support services are ideal for nonprofits, schools, youth organisations, public bodies,
          and informal groups who want to maximise the impact of their Erasmus+ actions without the administrative burden.
        </p>
      </div>
    </section>
  );
}
