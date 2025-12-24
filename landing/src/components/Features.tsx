export default function Features() {
  const features = [
    {
      icon: '🌍',
      title: 'Youth Exchanges & Activities (Erasmus+ KA1)',
      description: 'Open Horizon designs and implements international youth exchanges and mobility activities for groups of participants aged 13–30. These are structured learning experiences involving workshops, cultural activities, discussions, and shared tasks across different countries. Erasmus+ youth exchanges typically last between 5–21 days (excluding travel) and support non-formal learning, teamwork, language skills, and intercultural understanding.',
    },
    {
      icon: '🤝',
      title: 'Youth Participation Projects',
      description: 'We organise opportunities for young people to engage in civic, social, and political life through active programmes, workshops, and dialogues that amplify youth voices and encourage meaningful influence in local and international contexts.',
    },
    {
      icon: '📚',
      title: 'Youth Worker Mobility & Training',
      description: 'Open Horizon supports the professional development of youth workers and leaders through training courses, study visits, job-shadowing, and networking initiatives. These activities promote best practices and strengthen the capacity of organisations and practitioners.',
    },
    {
      icon: '♿',
      title: 'Inclusive Support & Accessibility',
      description: 'We prioritise inclusion by offering tailored support to participants with social, economic, geographic, or accessibility barriers. We adapt activities and provide individual support plans to ensure everyone can participate fully.',
    },
  ];

  return (
    <section className="bg-gray-50 px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary sm:text-4xl">
          What We Do
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="mb-4 text-5xl">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-primary">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
