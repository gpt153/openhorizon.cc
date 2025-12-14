export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* EU Funding Notice */}
        <div className="border-b border-white/10 pb-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <div className="flex items-center gap-4">
              {/* EU Flag placeholder - replace with actual SVG/image */}
              <div className="flex h-12 w-16 items-center justify-center rounded bg-blue-800 text-yellow-400 font-bold text-xs">
                EU
              </div>
              <div>
                <p className="text-sm font-medium">Co-funded by the European Union</p>
                <p className="text-xs text-gray-300 mt-1">Erasmus+ Programme</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center max-w-3xl mx-auto">
            Funded by the European Union. Views and opinions expressed are however those of the author(s) only 
            and do not necessarily reflect those of the European Union or the European Education and Culture 
            Executive Agency (EACEA). Neither the European Union nor EACEA can be held responsible for them.
          </p>
        </div>

        {/* Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">OpenHorizon</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              AI-powered project management platform designed specifically for Erasmus+ 
              and EU-funded projects.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="mailto:info@openhorizon.cc" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/gdpr" className="hover:text-white transition-colors">
                  GDPR Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-center text-xs text-gray-400">
            © {currentYear} OpenHorizon.cc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
