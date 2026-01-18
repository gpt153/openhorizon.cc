export default function OurApproach() {
  const approaches = [
    { icon: '📋', title: 'Needs assessment and participant support planning' },
    { icon: '🛡️', title: 'Risk and safety management for all activities' },
    { icon: '🎓', title: 'Inclusive pedagogy and non-formal learning methods' },
    { icon: '🌱', title: 'Sustainability planning and environmental responsibility' },
    { icon: '📊', title: 'Monitoring and evaluation for continuous improvement' },
    { icon: '🎯', title: 'Participant ownership, learning reflection, and practical outcomes' },
  ];

  return (
    <section className="bg-gray-50 px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-center text-3xl font-bold text-primary sm:text-4xl">
          Our Approach
        </h2>
        <p className="mx-auto mb-12 max-w-3xl text-center text-lg text-gray-700">
          Open Horizon works with a structured process that ensures quality and impact:
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {approaches.map((approach, index) => (
            <div
              key={index}
              className="rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="mb-3 text-3xl">{approach.icon}</div>
              <h3 className="font-semibold text-primary">{approach.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
