export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-blue-900 mb-6">
          🌍 Open Horizon – Empowering Youth & Organisations Through Erasmus+
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-4xl mx-auto">
          Open Horizon is a Swedish nonprofit association dedicated to creating meaningful international
          opportunities for young people and organisations through Erasmus+ projects. We specialise in
          inclusive youth exchanges, capacity building, and youth participation initiatives that build
          confidence, skills, and global understanding.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="https://app.openhorizon.cc/sign-up"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started →
          </a>
          <a
            href="https://app.openhorizon.cc/sign-in"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            Sign In
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">About Us</h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto text-center mb-6">
            The association focuses on ensuring participation for those with fewer opportunities and diverse needs.
            Our work is grounded in values of <strong>inclusion, safety, quality, sustainability, and active participation</strong>.
            We believe that cross-cultural experiences empower young people to grow, connect, and contribute
            meaningfully to their communities.
          </p>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          What We Do
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <ServiceCard
            title="Youth Exchanges & Activities (Erasmus+ KA1)"
            description="Open Horizon designs and implements international youth exchanges and mobility activities for groups of participants aged 13–30. These are structured learning experiences involving workshops, cultural activities, discussions, and shared tasks across different countries. Erasmus+ youth exchanges typically last between 5–21 days (excluding travel) and support non-formal learning, teamwork, language skills, and intercultural understanding."
            icon="🌍"
          />
          <ServiceCard
            title="Youth Participation Projects"
            description="We organise opportunities for young people to engage in civic, social, and political life through active programmes, workshops, and dialogues that amplify youth voices and encourage meaningful influence in local and international contexts."
            icon="🤝"
          />
          <ServiceCard
            title="Youth Worker Mobility & Training"
            description="Open Horizon supports the professional development of youth workers and leaders through training courses, study visits, job-shadowing, and networking initiatives. These activities promote best practices and strengthen the capacity of organisations and practitioners."
            icon="📚"
          />
          <ServiceCard
            title="Inclusive Support & Accessibility"
            description="We prioritise inclusion by offering tailored support to participants with social, economic, geographic, or accessibility barriers. We adapt activities and provide individual support plans to ensure everyone can participate fully."
            icon="♿"
          />
        </div>
      </section>

      {/* NEW SERVICE Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            NEW SERVICE: Project Support & Implementation for Organisations
          </h2>
          <p className="text-lg text-center max-w-4xl mx-auto mb-12">
            In addition to running our own programmes, Open Horizon now offers professional support services
            to other organisations who want to engage in Erasmus+ but need expertise in project design and delivery.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">📌 Identify the right Erasmus+ opportunities</h3>
              <p className="text-blue-100">
                We assess your goals and match them to the most suitable Erasmus+ actions (youth exchanges,
                training, partnerships, capacity-building, etc.).
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">📌 Develop competitive project applications</h3>
              <p className="text-blue-100">
                We assist in writing and preparing complete Erasmus+ applications that meet eligibility,
                quality, and impact criteria.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">📌 Plan and manage project implementation</h3>
              <p className="text-blue-100">
                From workplans and budgets to schedules and risk management, we support the operational
                delivery of your project.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">📌 Reporting and follow-up</h3>
              <p className="text-blue-100">
                We prepare the required project reports, documentation, evaluation summaries, and dissemination
                measures — ensuring compliance with Erasmus+ requirements.
              </p>
            </div>
          </div>
          <p className="text-center text-blue-100 mt-8 max-w-3xl mx-auto">
            Open Horizon's support services are ideal for nonprofits, schools, youth organisations, public bodies,
            and informal groups who want to maximise the impact of their Erasmus+ actions without the administrative burden.
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose Open Horizon?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Inclusive by design</h3>
            <p className="text-gray-600">
              We build programmes that accommodate diverse backgrounds, abilities, and access needs.
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality and compliance</h3>
            <p className="text-gray-600">
              All our projects and services align with the Erasmus+ Programme's standards and priorities
              for youth learning mobility and organisational capacity building.
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Experience with international cooperation</h3>
            <p className="text-gray-600">
              We leverage our partnerships and experience to create safe, enriching, and impactful
              international exchanges and projects.
            </p>
          </div>
          <div className="text-center md:col-span-2 lg:col-span-3">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Full support from start to finish</h3>
            <p className="text-gray-600">
              Whether you are a participant, a group leader, or an organisation, we guide you through
              every step of your Erasmus+ journey — from preparation to implementation and reporting.
            </p>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Approach
          </h2>
          <p className="text-center text-gray-700 max-w-3xl mx-auto mb-8">
            Open Horizon works with a structured process that ensures quality and impact:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-2">Needs assessment and participant support planning</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk and safety management for all activities</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="font-semibold text-gray-900 mb-2">Inclusive pedagogy and non-formal learning methods</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-semibold text-gray-900 mb-2">Sustainability planning and environmental responsibility</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Monitoring and evaluation for continuous improvement</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-2">Participant ownership, learning reflection, and practical outcomes</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Get Involved
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Whether you are a young person looking for a life-changing experience, a youth worker seeking
          professional development, or an organisation aiming to deliver high-quality Erasmus+ projects,
          Open Horizon can help you succeed.
        </p>
        <a
          href="https://app.openhorizon.cc/sign-up"
          className="inline-block bg-blue-600 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
        >
          Start Your Journey Today →
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Open Horizon</h3>
              <p className="text-sm">
                Empowering youth and organisations through Erasmus+ projects.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://app.openhorizon.cc" className="hover:text-white">Application</a></li>
                <li><a href="https://app.openhorizon.cc/sign-up" className="hover:text-white">Sign Up</a></li>
                <li><a href="https://app.openhorizon.cc/sign-in" className="hover:text-white">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <p className="text-sm">
                Email: info@openhorizon.cc
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-sm text-center">
            <p className="mb-2">
              <strong>Co-funded by the European Union</strong>
            </p>
            <p className="mb-4">
              Views and opinions expressed are those of the author(s) only and do not
              necessarily reflect those of the European Union or EACEA. Neither the
              European Union nor the granting authority can be held responsible for them.
            </p>
            <p className="text-xs text-gray-500">
              Erasmus+ is the European Union's programme for education, training, youth, and sport.
              It funds learning mobility for young people, youth workers, and organisations across
              Europe and associated countries.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
