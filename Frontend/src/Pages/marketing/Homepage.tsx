import ServicesGrid from '../../components/shared/ServicesGrid';
import useServices from '../../hooks/useServices';
import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Sparkles, ArrowRight, Asterisk, Star, ShieldCheck, TrendingUp, Users, Clock } from 'lucide-react';
import { Hammer, Wrench, Zap, SprayCan, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hybridSearchApi, type LocationParams } from '../../api/hybridSearchApi';
import { serviceApi, type ServiceResponse } from '../../api/serviceApi';
import LocationPickerAdvanced from '../../components/shared/LocationPickerAdvanced';
import Button from '../../components/shared/Button';
import Chip from '../../components/shared/Chip';

export default function Homepage() {
  const { services, loading, error, refetch } = useServices({
    isActive: true, // Only show active services
    take: 20 // Limit to 20 services for better performance
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [locationFilter, setLocationFilter] = useState<LocationParams | null>(null);
  const [aiSearchEnabled, setAiSearchEnabled] = useState<boolean>(false);
  const navigate = useNavigate();

  const jobCategories = [
    {
      icon: Hammer,
      title: 'Carpenter',
      image: '/images/categories/carpenter.webp',
      body: 'Custom furniture, repairs, and woodwork crafted by skilled, experienced hands.',
      services: ['Custom furniture', 'Cabinet installation', 'Furniture repair', 'Decks & framing']
    },
    {
      icon: Wrench,
      title: 'Plumber',
      image: '/images/categories/plumber.webp',
      body: 'Leak fixes, pipe installations, and water systems handled with expertise.',
      services: ['Leak repairs', 'Pipe installation', 'Drain cleaning', 'Water heater setup']
    },
    {
      icon: Zap,
      title: 'Electrician',
      image: '/images/categories/electrician.webp',
      body: 'Wiring, solar installs, and electrical repairs done safely and fast.',
      services: ['Wiring & rewiring', 'Solar panel install', 'Fuse box repair', 'Lighting setup']
    },
    {
      icon: SprayCan,
      title: 'Cleaner',
      image: '/images/categories/cleaner.webp',
      body: 'Spotless homes and offices with reliable, thorough cleaning services.',
      services: ['Home deep cleaning', 'Office cleaning', 'Move-in / move-out', 'Window washing']
    }
  ];

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [categoryResults, setCategoryResults] = useState<ServiceResponse[]>([]);
  const [categoryResultsLoading, setCategoryResultsLoading] = useState(false);
  const [categoryResultsError, setCategoryResultsError] = useState<string | null>(null);

  const searchCategory = async (title: string) => {
    setCategoryFilter(title);
    setCategoryResultsLoading(true);
    setCategoryResultsError(null);
    try {
      const response = await serviceApi.getServices({
        search: title,
        isActive: true,
        take: 20
      });
      if (response.success) {
        setCategoryResults(response.data);
      } else {
        setCategoryResultsError(response.message || 'Failed to load services');
      }
    } catch (err) {
      console.error('Category search error:', err);
      setCategoryResultsError('Failed to load services');
    } finally {
      setCategoryResultsLoading(false);
    }
    document.getElementById('featured-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearCategoryFilter = () => {
    setCategoryFilter(null);
    setCategoryResults([]);
    setCategoryResultsError(null);
  };

  const [activeCategory, setActiveCategory] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = setInterval(() => {
      setActiveCategory((prev) => (prev + 1) % jobCategories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isCarouselPaused, jobCategories.length]);

  const goToCategory = (index: number) => {
    setActiveCategory((index + jobCategories.length) % jobCategories.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) goToCategory(activeCategory - 1);
    else if (delta < -50) goToCategory(activeCategory + 1);
    touchStartX.current = null;
  };

  const popularSearches: string[] = [
    'Web Development',
    'Graphic Design', 
    'Content Writing',
    'Digital Marketing',
    'Photography',
    'Video Editing'
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    doSearch();
  };

  const doSearch = async (overrideQuery?: string) => {
    const query = overrideQuery ?? searchQuery;
    const hasQuery = query.trim().length > 0;
    const hasLocation = locationFilter?.latitude !== undefined && locationFilter?.longitude !== undefined;

    // Allow search with just query OR just location OR both
    if (!hasQuery && !hasLocation) {
      clearCategoryFilter();
      document.getElementById('featured-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Plain keyword search is the default; AI Search only runs when explicitly toggled on.
    // Shown in-place in the Featured Services section rather than navigating away.
    if (!aiSearchEnabled && !hasLocation) {
      setIsSearching(true);
      await searchCategory(query.trim());
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Performing AI search for:', query, 'with location:', locationFilter);

      const response = await hybridSearchApi.searchServices({
        query: hasQuery ? query.trim() : undefined,
        location: hasLocation ? locationFilter : undefined,
        threshold: 0.4,
        limit: 20,
        includeWithoutLocation: true
      });

      if (response.success) {
        console.log('✅ Search results:', response.data);

        // Navigate to enhanced search results page
        navigate('/services/search', {
          state: {
            results: response.data.results,
            query: hasQuery ? query.trim() : undefined,
            location: hasLocation ? {
              latitude: locationFilter.latitude,
              longitude: locationFilter.longitude,
              radius: locationFilter.radius || 10
            } : undefined,
            searchType: response.data.searchType
          }
        });
      } else {
        console.error('❌ Search failed:', response.message);
        alert('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Content Overlay */}
      <div className="relative">
        {/* Hero Section - fits one viewport height on desktop (no scroll); flows naturally on mobile */}
        {/* No overflow-hidden here on purpose: the location picker opens a map panel
            taller than the hero, and clipping it here cut the panel off at the section
            edge. The wrapper above still has overflow-hidden, so decorative art can
            not cause horizontal page scroll. */}
        <section className="relative w-full flex flex-col pt-14 lg:pt-16 pb-10 lg:pb-0 px-4 sm:px-6 lg:px-8 text-center lg:h-screen lg:min-h-[560px] bg-gradient-to-b from-orange-50 to-white">
          {/* Decorative asterisk */}
          <Asterisk strokeWidth={1.5} className="hidden sm:block absolute top-20 left-6 lg:left-16 w-8 h-8 text-orange-400 rotate-12" />
          <div className="hidden lg:block absolute top-36 right-10 w-3 h-3 rounded-full bg-orange-300" />

          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-stretch lg:flex-1 lg:min-h-0 gap-6 lg:gap-8">
            {/* Left: Heading, search, CTAs */}
            <div className="w-full lg:w-[56%] flex-shrink-0 flex flex-col items-center lg:items-start justify-center text-center lg:text-left pt-4 lg:pt-0">
              {/* Main Heading */}
              <h1 className="text-balance text-gray-900 text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.5rem] mb-4">
                <span
                  className="block animate-fadeInUp"
                  style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '0ms' }}
                >
                  Connect with Trusted
                </span>
                <span
                  className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent animate-fadeInUp"
                  style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '120ms' }}
                >
                  Service Providers
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="mb-5 text-balance text-sm sm:text-base text-gray-500 max-w-lg leading-relaxed animate-fadeInUp"
                style={{ opacity: 0, animationFillMode: 'forwards', animationDelay: '220ms' }}
              >
                Find verified professionals for any service you need, from home repairs to tutoring.
              </p>

              {/* Enhanced Search Bar with Geolocation */}
              <div className="w-full max-w-xl">
                <div className="bg-white rounded-2xl sm:rounded-full p-1.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 transition-shadow duration-200">
                  {/* Service Search Input */}
                  <div className="flex-1 relative flex items-center min-w-0">
                    <Search className="h-4 w-4 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="What service do you need?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          doSearch();
                        }
                      }}
                      className="w-full pl-3 pr-4 py-2.5 sm:py-3 text-gray-900 placeholder-gray-400 bg-transparent border-none focus:ring-0 text-sm font-medium min-w-0"
                      style={{ outline: 'none' }}
                    />
                  </div>

                  <div className="hidden sm:block w-px h-7 bg-gray-200 flex-shrink-0" />

                  {/* Location Picker Component */}
                  <div className="relative w-full sm:w-60 flex-shrink-0">
                    <LocationPickerAdvanced
                      value={locationFilter || undefined}
                      onChange={setLocationFilter}
                      placeholder="Set location..."
                      showRadius={true}
                      defaultRadius={10}
                      maxRadius={50}
                      autoDetect={false}
                      bordered={false}
                      className="w-full"
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    aria-label={searchQuery.trim() || locationFilter ? 'Search' : 'Browse services'}
                    className="flex items-center justify-center h-11 w-11 mx-auto sm:mx-0 flex-shrink-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* AI Search Toggle */}
                <div className="mt-2.5 flex justify-center lg:justify-start">
                  <button
                    type="button"
                    onClick={() => setAiSearchEnabled((prev) => !prev)}
                    aria-pressed={aiSearchEnabled}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      aiSearchEnabled
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Search
                  </button>
                </div>

                {/* Popular Searches */}
                <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="text-xs text-gray-500 mr-0.5">Popular:</span>
                  {popularSearches.map((search) => (
                    <Chip
                      key={search}
                      onClick={() => {
                        setSearchQuery(search);
                        doSearch(search);
                      }}
                      className="h-7 px-3 text-xs"
                    >
                      {search}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-row justify-center lg:justify-start items-center gap-3 mt-5">
                <Button
                  onClick={() => navigate('/services')}
                  className="px-6 sm:px-8 py-2.5 text-sm sm:text-base font-semibold rounded-full shadow-orange-500/30"
                >
                  Find Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate('/become-provider')}
                  variant="outline"
                  className="px-6 sm:px-8 py-2.5 text-sm sm:text-base font-semibold rounded-full"
                >
                  Start Selling
                </Button>
              </div>
            </div>

            {/* Right: Illustration + decorative cards - always fully visible, no scroll on desktop */}
            <div className="relative w-full lg:w-[44%] lg:flex-shrink-0 flex justify-center lg:justify-end items-center py-2 lg:py-5">
              <div className="relative h-56 sm:h-72 md:h-80 lg:h-full lg:max-h-[34rem] w-fit max-w-full mx-auto lg:mx-0">
                <img
                  src="/hero-character.webp"
                  alt="Illustration of a person celebrating success while using a laptop"
                  className="relative z-10 h-full w-auto max-w-full select-none pointer-events-none"
                  loading="eager"
                />

                {/* Top Rated badge - top left */}
                <div className="flex absolute top-[8%] -left-2 lg:left-2 z-20 h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-500/30 ring-4 ring-white">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="currentColor" />
                </div>

                {/* Verified badge - upper right */}
                <div className="flex absolute top-[28%] right-0 lg:right-4 z-20 h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                </div>

                {/* Verified Providers stat - bottom left */}
                <div className="hidden md:flex absolute left-0 lg:-left-10 bottom-[24%] z-20 items-center gap-2.5 w-40 rounded-2xl bg-white p-3 shadow-xl border border-gray-100">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">500+</p>
                    <p className="text-[11px] text-gray-500 leading-tight">Verified Providers</p>
                  </div>
                </div>

                {/* Jobs completed stat - top right */}
                <div className="hidden md:flex absolute -right-2 lg:right-0 top-[2%] z-20 items-center gap-2.5 rounded-2xl bg-white p-2.5 pr-3.5 shadow-xl border border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-gray-500">Jobs Completed</p>
                    <p className="text-xs font-bold text-gray-900">10,000+</p>
                  </div>
                </div>

                {/* Fast response badge - mid left */}
                <div className="hidden xl:flex absolute -left-14 top-[52%] z-20 items-center gap-2 rounded-2xl bg-white p-2.5 pr-3.5 shadow-xl border border-gray-100">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] text-gray-500 leading-tight">Avg. Response</p>
                    <p className="text-xs font-bold text-gray-900">Under 2 hrs</p>
                  </div>
                </div>

                {/* Avatar group - bottom right */}
                <div className="hidden lg:flex absolute right-0 bottom-[10%] z-20 items-center gap-2.5 max-w-[12rem] rounded-2xl bg-white/90 backdrop-blur p-2.5 shadow-xl border border-gray-100">
                  <div className="flex -space-x-2 flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-orange-400 ring-2 ring-white" />
                    <div className="h-6 w-6 rounded-full bg-amber-500 ring-2 ring-white" />
                    <div className="h-6 w-6 rounded-full bg-orange-600 ring-2 ring-white" />
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug text-left">
                    Trusted by <span className="font-semibold text-gray-900">10,000+</span> customers island-wide
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job Categories Section */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Popular Job Categories
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Browse skilled professionals across our most in-demand trades
              </p>
            </div>

            {/* Job Category Carousel */}
            <div
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
            >
              {/* Slide track */}
              <div
                className="relative overflow-hidden rounded-3xl shadow-xl shadow-orange-500/20"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${activeCategory * 100}%)` }}
                >
                  {jobCategories.map(({ title, image, body, services }) => (
                    <div
                      key={title}
                      className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 items-center gap-8 p-6 sm:p-12 bg-gradient-to-br from-orange-500 to-amber-600"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => searchCategory(title)}
                        onKeyDown={(e) => e.key === 'Enter' && searchCategory(title)}
                        aria-label={`Search for ${title} services`}
                        className="flex items-center justify-center h-80 sm:h-[32rem] order-1 cursor-pointer"
                      >
                        <img
                          src={image}
                          alt={`Illustration of a professional ${title.toLowerCase()}`}
                          className="h-full w-auto max-w-full object-contain select-none pointer-events-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="order-2 text-center md:text-left">
                        <p className="text-orange-50 leading-relaxed mb-7 text-xl sm:text-2xl">
                          {body}
                        </p>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 text-lg text-white max-w-md mx-auto md:mx-0">
                          {services.map((service) => (
                            <li key={service} className="flex items-center gap-2.5">
                              <Check className="h-5 w-5 text-white flex-shrink-0" />
                              {service}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prev/Next arrows */}
                <button
                  onClick={() => goToCategory(activeCategory - 1)}
                  aria-label="Previous category"
                  className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToCategory(activeCategory + 1)}
                  aria-label="Next category"
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {jobCategories.map(({ title }, index) => (
                  <button
                    key={title}
                    onClick={() => goToCategory(index)}
                    aria-label={`Go to ${title} slide`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeCategory ? 'w-6 bg-orange-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Services Section */}
        <section id="featured-services" className="py-14 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {categoryFilter ? `${categoryFilter} Services` : 'Featured Services'}
              </h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                {categoryFilter
                  ? `Showing results for "${categoryFilter}"`
                  : 'Discover professional services from our verified providers. Quality guaranteed, satisfaction assured.'}
              </p>
              {categoryFilter && (
                <button
                  onClick={clearCategoryFilter}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>

            <ServicesGrid
              services={categoryFilter ? categoryResults : services}
              loading={categoryFilter ? categoryResultsLoading : loading}
              error={categoryFilter ? categoryResultsError : error}
            />

            {/* Refresh Button - Show for both errors AND when no services found */}
            {((categoryFilter ? categoryResultsError : error) ||
              (!(categoryFilter ? categoryResultsLoading : loading) &&
                (categoryFilter ? categoryResults : services).length === 0)) && (
              <div className="text-center mt-12">
                <Button
                  onClick={() => (categoryFilter ? searchCategory(categoryFilter) : refetch())}
                  size="lg"
                  className="px-8 py-4 rounded-full text-lg shadow-lg shadow-orange-500/30 hover:scale-105 transition-all duration-300"
                >
                  {(categoryFilter ? categoryResultsError : error) ? 'Try Again' : 'Refresh Services'}
                </Button>
                {(categoryFilter ? categoryResultsError : error) && (
                  <p className="text-red-500 text-lg mt-4 font-medium">
                    Error: {categoryFilter ? categoryResultsError : error}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}



