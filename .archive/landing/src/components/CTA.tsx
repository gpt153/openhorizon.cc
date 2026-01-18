export default function CTA() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-4xl font-bold text-primary">
          Get Involved
        </h2>
        <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-700">
          Whether you are a young person looking for a life-changing experience, a youth worker seeking
          professional development, or an organisation aiming to deliver high-quality Erasmus+ projects,
          Open Horizon can help you succeed.
        </p>
        <a
          href="https://app.openhorizon.cc/sign-up"
          className="inline-flex items-center justify-center rounded-lg bg-cta px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-cta/90 hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Your Journey Today →
        </a>
      </div>
    </section>
  );
}
