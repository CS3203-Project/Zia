import ServicesGrid from '../../components/shared/ServicesGrid';
import useServices from '../../hooks/useServices';
import { useState } from 'react';
import { Search, Loader2, Sparkles, ArrowRight, Asterisk, Star, ShieldCheck, TrendingUp, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hybridSearchApi, type LocationParams } from '../../api/hybridSearchApi';
import LocationPickerAdvanced from '../../components/shared/LocationPickerAdvanced';
import Button from '../../components/shared/Button';

export default function Homepage() {
  const { services, loading, error, refetch } = useServices({
    isActive: true, // Only show active services
    take: 20 // Limit to 20 services for better performance
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [locationFilter, setLocationFilter] = useState<LocationParams | null>(null);
  const navigate = useNavigate();

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

  const doSearch = async () => {
    const hasQuery = searchQuery.trim().length > 0;
    const hasLocation = locationFilter?.latitude !== undefined && locationFilter?.longitude !== undefined;

    // Allow search with just query OR just location OR both
    if (!hasQuery && !hasLocation) {
      console.log('No search query or location provided - redirecting to browse');
      navigate('/services');
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Performing hybrid search for:', searchQuery, 'with location:', locationFilter);
      
      const response = await hybridSearchApi.searchServices({
        query: hasQuery ? searchQuery.trim() : undefined,
        location: hasLocation ? locationFilter : undefined,
        threshold: 0.4,
        limit: 20,
        includeWithoutLocation: true
      });

      if (response.success) {
        console.log('✅ Search results:', response.data);
        
        // Navigate to enhanced search results page
        navigate('/search-results-enhanced', { 
          state: { 
            results: response.data.results, 
            query: hasQuery ? searchQuery.trim() : undefined,
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
    <div className="min-h-screen bg-dark-primary relative overflow-hidden">
      {/* Content Overlay */}
      <div className="relative">
        {/* Hero Section - fits one viewport height on desktop (no scroll); flows naturally on mobile */}
        <section className="relative w-full flex flex-col pt-14 lg:pt-16 pb-10 lg:pb-0 px-4 sm:px-6 lg:px-8 text-center overflow-hidden lg:h-screen lg:min-h-[560px] bg-gradient-to-b from-orange-50 to-white">
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

                {/* Popular Searches */}
                <div className="mt-2.5 flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-xs">
                  <span className="text-gray-500">Popular:</span>
                  {popularSearches.map((search, index) => (
                    <span key={index} className="flex items-center gap-x-2">
                      <button
                        onClick={() => {
                          setSearchQuery(search);
                          // Auto-search after a short delay to allow state to update
                          setTimeout(() => {
                            const hasQuery = search.trim().length > 0;
                            const hasLocation = locationFilter?.latitude !== undefined && locationFilter?.longitude !== undefined;

                            if (hasQuery || hasLocation) {
                              doSearch();
                            }
                          }, 100);
                        }}
                        className="font-medium text-gray-700 hover:text-orange-600 transition-colors duration-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        {search}
                      </button>
                      {index < popularSearches.length - 1 && (
                        <span className="text-gray-300">&middot;</span>
                      )}
                    </span>
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

        {/* Interactive Feature Cards Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-card relative">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-dark-primary mb-4">
                Why Choose Our Platform
              </h2>
              <p className="text-lg text-dark-secondary max-w-2xl mx-auto">
                Experience a seamless way to connect with professionals and grow your business
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 - Smart Search */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative h-full backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-2 flex flex-col">
                  <div className="mb-6 inline-block p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 w-fit">
                    <Sparkles className="w-8 h-8 text-dark-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-dark-primary mb-4">
                    AI-Powered Search
                  </h3>
                  <p className="text-dark-secondary leading-relaxed flex-grow">
                    Find exactly what you need with our intelligent search algorithm that understands your requirements and delivers relevant results instantly.
                  </p>
                </div>
              </div>

              {/* Card 2 - Location Based */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative h-full backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-2 flex flex-col">
                  <div className="mb-6 inline-block p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 w-fit">
                    <Search className="w-8 h-8 text-dark-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-dark-primary mb-4">
                    Location-Based Discovery
                  </h3>
                  <p className="text-dark-secondary leading-relaxed flex-grow">
                    Connect with service providers near you. Our advanced geolocation features help you find local professionals within your preferred radius.
                  </p>
                </div>
              </div>

              {/* Card 3 - Verified Professionals */}
              <div className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative h-full backdrop-blur-md bg-white/70 border border-white/20 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-2 flex flex-col">
                  <div className="mb-6 inline-block p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 w-fit">
                    <ArrowRight className="w-8 h-8 text-dark-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-dark-primary mb-4">
                    Verified Professionals
                  </h3>
                  <p className="text-dark-secondary leading-relaxed flex-grow">
                    Every service provider is thoroughly vetted and verified. Work with confidence knowing you're hiring trusted and qualified professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Services Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-card">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-dark-primary mb-6">
                Featured Services
              </h2>
              <p className="text-xl text-dark-secondary max-w-3xl mx-auto leading-relaxed">
                Discover professional services from our verified providers. 
                Quality guaranteed, satisfaction assured.
              </p>
            </div>

            <ServicesGrid 
              services={services} 
              loading={loading} 
              error={error} 
            />
            
            {/* Refresh Button - Show for both errors AND when no services found */}
            {(error || (!loading && services.length === 0)) && (
              <div className="text-center mt-12">
                <Button
                  onClick={refetch}
                  size="lg"
                  className="px-8 py-4 rounded-full text-lg shadow-lg shadow-orange-500/30 hover:scale-105 transition-all duration-300"
                >
                  {error ? 'Try Again' : 'Refresh Services'}
                </Button>
                {error && (
                  <p className="text-red-500 text-lg mt-4 font-medium">
                    Error: {error}
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



