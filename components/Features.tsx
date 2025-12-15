export default function Features() {
  const features = [
    {
      title: 'Youth Exchanges & Activities',
      description: 'International mobility activities for ages 13-30. Structured learning experiences with workshops, cultural activities, and teamwork across different countries.',
      icon: '🌍',
    },
    {
      title: 'Youth Participation Projects',
      description: 'Opportunities for young people to engage in civic, social, and political life through active programs and dialogues that amplify youth voices.',
      icon: '🗣️',
    },
    {
      title: 'Youth Worker Mobility & Training',
      description: 'Professional development for youth workers through training courses, study visits, job-shadowing, and networking initiatives.',
      icon: '📚',
    },
    {
      title: 'Inclusive Support & Accessibility',
      description: 'Tailored support for participants with social, economic, geographic, or accessibility barriers. Individual support plans ensure full participation.',
      icon: '♿',
    },
    {
      title: 'Project Development Support',
      description: 'Professional assistance in identifying opportunities, developing competitive applications, and planning implementation for your Erasmus+ projects.',
      icon: '📋',
    },
    {
      title: 'Reporting & Compliance',
      description: 'Complete project reports, documentation, evaluation summaries, and dissemination measures aligned with Erasmus+ requirements.',
      icon: '✓',
    },
  ];

  return (
    <section className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            What We Do
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Creating meaningful international opportunities through Erasmus+ programs
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
