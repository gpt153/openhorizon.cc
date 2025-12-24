export default function WhyChooseUs() {
  const reasons = [
    {
      icon: '✨',
      title: 'Inclusive by design',
      description: 'We build programmes that accommodate diverse backgrounds, abilities, and access needs.',
    },
    {
      icon: '🎯',
      title: 'Quality and compliance',
      description: 'All our projects and services align with the Erasmus+ Programme\'s standards and priorities for youth learning mobility and organisational capacity building.',
    },
    {
      icon: '🌐',
      title: 'Experience with international cooperation',
      description: 'We leverage our partnerships and experience to create safe, enriching, and impactful international exchanges and projects.',
    },
    {
      icon: '🤝',
      title: 'Full support from start to finish',
      description: 'Whether you are a participant, a group leader, or an organisation, we guide you through every step of your Erasmus+ journey — from preparation to implementation and reporting.',
    },
  ];

  return (
    <section className="bg-white px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary sm:text-4xl">
          Why Choose Open Horizon?
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <div key={index} className="text-center">
              <div className="mb-4 text-5xl">{reason.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-primary">
                {reason.title}
              </h3>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
