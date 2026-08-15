import { FacebookIcon, InstagramIcon, LinkedinIcon } from 'lucide-react';

export function MinimalFooter() {
  const year = new Date().getFullYear();

  const navLinks = [
    { title: 'Browse Services', href: '/services' },
    { title: 'Become a Provider', href: '/become-provider' },
    { title: 'Messages', href: '/conversation-hub' },
  ];

  const socialLinks = [
    { icon: <FacebookIcon className="size-4" />, link: 'https://www.facebook.com/profile.php?id=61578604951668' },
    { icon: <InstagramIcon className="size-4" />, link: 'https://www.instagram.com/zia.contact' },
    { icon: <LinkedinIcon className="size-4" />, link: 'https://www.linkedin.com/in/zia2025' },
  ];

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + copyright */}
        <a href="/" className="flex items-center gap-2.5 group flex-shrink-0" title="Zia - Service Marketplace">
          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/30">
            <img src="/logo_svg_only_light.svg" alt="Zia Logo" className="h-4 w-4" />
          </div>
          <span className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">Zia</span>
          <span className="text-sm text-gray-400">&copy; {year}</span>
        </a>

        {/* Nav links */}
        <nav className="flex items-center gap-6">
          {navLinks.map(({ href, title }, i) => (
            <a
              key={i}
              href={href}
              className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors duration-200"
            >
              {title}
            </a>
          ))}
        </nav>

        {/* Social icons */}
        <div className="flex gap-2 flex-shrink-0">
          {socialLinks.map((item, i) => (
            <a
              key={i}
              className="rounded-full border border-gray-200 p-2 text-gray-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
              target="_blank"
              rel="noopener noreferrer"
              href={item.link}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default MinimalFooter;
