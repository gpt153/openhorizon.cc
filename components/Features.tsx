export default function Features() {
  const features = [
    {
      title: 'AI-Assisted Planning',
      description: 'Intelligent project timelines, resource allocation, and risk assessment powered by advanced AI.',
      icon: '🎯',
    },
    {
      title: 'Compliance Automation',
      description: 'Automatic checks against EU guidelines and regulations. Never miss a compliance requirement.',
      icon: '✓',
    },
    {
      title: 'Multi-Partner Coordination',
      description: 'Seamless collaboration across countries and organizations with real-time updates.',
      icon: '🤝',
    },
    {
      title: 'Budget Management',
      description: 'Track expenses, forecast costs, and ensure budget compliance across all project phases.',
      icon: '💶',
    },
    {
      title: 'Impact Reporting',
      description: 'Generate comprehensive impact reports and KPI dashboards for stakeholders.',
      icon: '📊',
    },
    {
      title: 'Document Generation',
      description: 'Auto-generate proposals, progress reports, and final evaluations with AI assistance.',
      icon: '📝',
    },
  ];

  return (
    <section className="bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Everything you need for successful Erasmus+ projects
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Powerful features designed specifically for EU project coordinators
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
