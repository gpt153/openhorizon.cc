export default function Footer() {
  return (
    <footer className="bg-primary text-gray-300">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-bold text-white">Open Horizon</h3>
            <p className="text-sm">
              Empowering youth and organisations through Erasmus+ projects.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://app.openhorizon.cc" className="transition-colors hover:text-white">
                  Application
                </a>
              </li>
              <li>
                <a href="https://app.openhorizon.cc/sign-up" className="transition-colors hover:text-white">
                  Sign Up
                </a>
              </li>
              <li>
                <a href="https://app.openhorizon.cc/sign-in" className="transition-colors hover:text-white">
                  Sign In
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Contact</h3>
            <p className="text-sm">
              Email: info@openhorizon.cc
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="mb-2 text-center text-sm">
            <strong className="text-white">Co-funded by the European Union</strong>
          </p>
          <p className="mb-4 text-center text-sm">
            Views and opinions expressed are those of the author(s) only and do not
            necessarily reflect those of the European Union or EACEA. Neither the
            European Union nor the granting authority can be held responsible for them.
          </p>
          <p className="text-center text-xs text-gray-500">
            Erasmus+ is the European Union's programme for education, training, youth, and sport.
            It funds learning mobility for young people, youth workers, and organisations across
            Europe and associated countries.
          </p>
        </div>
      </div>
    </footer>
  );
}
