import { useState, useEffect } from 'react';
import { Menu, ChevronDown, LogOut, User, Bell, X } from 'lucide-react';
import { cn } from '../../utils/utils';
import { useAuth } from '../../contexts/AuthContext';
import { clearMessages } from '../../utils/messageDB';
import { Link, useLocation } from 'react-router-dom';
import { categoriesData } from '../../data/servicesData';
import { useNotifications } from '../../hooks/useNotifications';
import { getBookingAttentionCount } from '../../api/bookingApi';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesTimeout, setServicesTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Use AuthContext and location hook
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();

  // Use notifications hook for unread count
  const { stats } = useNotifications();

  // Bookings waiting on this user. Counted alongside unread notifications so the
  // bell reflects booking actions the other party has taken — the notification
  // table alone stays empty for booking activity.
  const [awaitingAction, setAwaitingAction] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setAwaitingAction(0);
      return;
    }
    let alive = true;
    getBookingAttentionCount()
      .then((count) => alive && setAwaitingAction(count))
      .catch(() => alive && setAwaitingAction(0));
    return () => {
      alive = false;
    };
  }, [isLoggedIn, location.pathname]);

  const alertCount = (stats?.unread ?? 0) + awaitingAction;

  // Helper function to check if a route is active
  const isActiveRoute = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  // Helper function to check if services-related routes are active
  const isServicesRouteActive = () => {
    return location.pathname.startsWith('/services');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('RedirectAfterLogin');
      await clearMessages(); // Clear IndexedDB messages on logout
      await logout(); // Use AuthContext logout
      setUserMenuOpen(false);
      window.location.href = '/';

    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleServicesEnter = () => {
    if (servicesTimeout) clearTimeout(servicesTimeout);
    setServicesOpen(true);
  };

  const handleServicesLeave = () => {
    const timeout = setTimeout(() => setServicesOpen(false), 150);
    setServicesTimeout(timeout);
  };

  const navLinks = [
    ...(user?.role !== 'PROVIDER' ? [{ name: 'Become a Provider', href: "/become-provider" }] : []),
    ...(isLoggedIn
      ? [
          { name: 'Messages', href: '/conversation-hub' },
          { name: 'Bookings', href: '/bookings' },
        ]
      : [])
  ];

  return (
    <nav className={cn(
      "fixed top-0 w-full z-40 transition-all duration-300",
      scrolled
        ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200"
        : "bg-white/80 backdrop-blur-md border-b border-transparent"
    )}>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 group cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 shadow-sm shadow-orange-500/30">
                <img
                  src="/logo_svg_only_light.svg"
                  alt="Zia Logo"
                  className="h-4 w-4 relative z-10"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    if (img.nextSibling && img.nextSibling instanceof HTMLElement) {
                      (img.nextSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden h-4 w-4 items-center justify-center text-white font-bold text-xs relative z-10">
                  Z
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300 whitespace-nowrap">
                Zia
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8 flex-nowrap">
            {/* Services Dropdown */}
            <div className="relative">
              <div
                className={cn(
                  "flex items-center space-x-1 font-medium text-sm transition-colors duration-200 cursor-pointer",
                  isServicesRouteActive()
                    ? "text-orange-600"
                    : "text-gray-700 hover:text-orange-600"
                )}
                onMouseEnter={handleServicesEnter}
                onMouseLeave={handleServicesLeave}
              >
                <Link
                  to="/services"
                  className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  <span>Browse Services</span>
                </Link>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-all duration-300",
                  servicesOpen && "rotate-180"
                )} />
              </div>

              {/* Services Mega Menu */}
              <div
                className={cn(
                  "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-[700px] bg-white rounded-2xl shadow-xl border border-gray-100 p-6 transition-all duration-200 origin-top",
                  servicesOpen
                    ? "opacity-100 visible scale-100"
                    : "opacity-0 invisible scale-95 pointer-events-none"
                )}
                onMouseEnter={handleServicesEnter}
                onMouseLeave={handleServicesLeave}
              >
                <div className="grid grid-cols-2 gap-3">
                  {categoriesData.map((service, index) => {
                    const IconComponent = service.icon;
                    return (
                      <Link
                        key={index}
                        to={`/services/${service.slug}`}
                        className="group/item p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100"
                        onClick={() => setServicesOpen(false)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-all duration-200",
                            service.gradient
                          )}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {service.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {navLinks.map((link, index) => {
              const isActive = isActiveRoute(link.href);
              return (
                <Link
                  key={index}
                  to={link.href}
                  className={cn(
                    "font-medium text-sm transition-colors duration-200 whitespace-nowrap rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
                    isActive
                      ? "text-orange-600"
                      : "text-gray-700 hover:text-orange-600"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoggedIn && user ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="flex items-center justify-center p-2 rounded-full hover:bg-orange-50 transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  <Bell className="h-4 w-4 text-gray-600" />
                  {alertCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                </Link>

                <div className="relative user-menu">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 py-1 pl-1 pr-2.5 rounded-full hover:bg-orange-50 transition-all duration-200 border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-medium text-xs">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                    )}
                    <span className="text-gray-900 font-medium text-sm">{user.firstName}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-gray-500 transition-all duration-300",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* User Dropdown Menu */}
                  <div className={cn(
                    "absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 transition-all duration-200 origin-top-right",
                    userMenuOpen
                      ? "opacity-100 visible scale-100"
                      : "opacity-0 invisible scale-95 pointer-events-none"
                  )}>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </a>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <a
                  href="/signin"
                  className="font-medium text-sm text-gray-700 hover:text-orange-600 transition-colors duration-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Log In
                </a>
                <a
                  href="/signup"
                  className="font-medium text-sm text-white bg-orange-500 hover:bg-orange-600 py-2.5 px-5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-full text-gray-700 hover:bg-orange-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-gray-100",
          mobileMenuOpen ? "max-h-[calc(100vh-3.5rem)] opacity-100 pb-6 overflow-y-auto" : "max-h-0 opacity-0"
        )}>
          <div className="px-4 py-6 space-y-6">
            {/* Mobile Services */}
            <div>
              <div
                className={cn(
                  "flex items-center justify-between w-full text-left font-medium py-2 px-3 rounded-lg transition-all duration-200",
                  isServicesRouteActive()
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-900 hover:bg-gray-50"
                )}
              >
                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Browse Services</span>
                </Link>
                <ChevronDown
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={cn(
                    "h-4 w-4 transition-all duration-300 text-gray-500",
                    servicesOpen && "rotate-180"
                  )} />
              </div>
              <div className={cn(
                "mt-2 overflow-hidden transition-all duration-300",
                servicesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="space-y-1 pl-4">
                  {categoriesData.map((service, index) => {
                    const IconComponent = service.icon;
                    return (
                      <Link
                        key={index}
                        to={`/services/${service.slug}`}
                        className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center flex-shrink-0",
                          service.gradient
                        )}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{service.title}</div>
                          <div className="text-xs text-gray-500">{service.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              {navLinks.map((link, index) => {
                const isActive = isActiveRoute(link.href);
                return (
                  <Link
                    key={index}
                    to={link.href}
                    className={cn(
                      "block py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-900 hover:bg-gray-50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Mobile CTA */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {isLoggedIn && user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-medium">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <a
                    href="/profile"
                    className="w-full justify-center inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-full bg-white text-gray-900 font-medium hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-red-50 text-red-600 rounded-full font-medium hover:bg-red-100 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <a
                    href="/signin"
                    className="w-full justify-center inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-full bg-white text-gray-900 font-medium hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all duration-200"
                  >
                    Log In
                  </a>
                  <a href="/signup" className="w-full block">
                    <span className="w-full flex justify-center items-center px-4 py-2.5 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-all duration-200">
                      Sign Up
                    </span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
