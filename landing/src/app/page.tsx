export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-blue-900 mb-6">
          Empowering Youth Through Erasmus+
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
          Swedish nonprofit association creating meaningful international opportunities
          for young people and organisations through Erasmus+ projects.
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

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          What We Do
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="Youth Exchanges & Activities"
            description="International mobility activities for ages 13-30"
            icon="🌍"
          />
          <FeatureCard
            title="Youth Participation Projects"
            description="Civic, social, and political engagement opportunities"
            icon="🤝"
          />
          <FeatureCard
            title="Youth Worker Mobility"
            description="Professional development and networking"
            icon="📚"
          />
          <FeatureCard
            title="Inclusive Support"
            description="Tailored support for diverse needs"
            icon="♿"
          />
          <FeatureCard
            title="Project Development"
            description="Expert assistance for Erasmus+ applications"
            icon="💡"
          />
          <FeatureCard
            title="Reporting & Compliance"
            description="Complete documentation aligned with EU standards"
            icon="📋"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              number="1"
              title="Create Account"
              description="Sign up and tell us about your organisation"
            />
            <StepCard
              number="2"
              title="Plan Your Project"
              description="Use our tools to develop your Erasmus+ application"
            />
            <StepCard
              number="3"
              title="Launch & Report"
              description="Execute your project and track all requirements"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Create Impact?
        </h2>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Join organisations across Europe empowering young people through international opportunities.
        </p>
        <a
          href="https://app.openhorizon.cc/sign-up"
          className="inline-block bg-blue-600 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
        >
          Start Your Project Today →
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
            <p>
              Views and opinions expressed are those of the author(s) only and do not
              necessarily reflect those of the European Union or EACEA. Neither the
              European Union nor the granting authority can be held responsible for them.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="bg-blue-700 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-blue-100">{description}</p>
    </div>
  );
}
