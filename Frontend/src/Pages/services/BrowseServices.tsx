import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Search, Grid3X3, List, Sparkles, RefreshCw, MapPin } from 'lucide-react';
import { categoryApi, type Category } from '../../api/categoryApi';
import { hybridSearchApi, type HybridSearchResult, type LocationParams } from '../../api/hybridSearchApi';
import { serviceApi } from '../../api/serviceApi';
import LocationPickerAdvanced from '../../components/shared/LocationPickerAdvanced';
import PageHeader from '../../components/shared/PageHeader';
import BrowseServicesLoadingSkeleton from '../../components/services/BrowseServicesLoadingSkeleton';
import SearchResultServiceCard from '../../components/services/SearchResultServiceCard';
import SearchResultCardSkeleton from '../../components/services/SearchResultCardSkeleton';
import CategoryCard from '../../components/services/CategoryCard';
import CategoryCardSkeleton from '../../components/services/CategoryCardSkeleton';

interface BrowseServicesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'services' | 'popular';
  hybridSearchResults: HybridSearchResult[];
  isHybridSearchActive: boolean;
  isSearching: boolean;
  refreshing: boolean;
  locationFilter: LocationParams | null;
  showLocationFilter: boolean;
  searchType: 'hybrid' | 'semantic' | 'location' | 'general';
  hasServicesWithinRadius?: boolean;
  searchMessage?: string;
  aiSearchEnabled: boolean;
}

const BrowseServices: React.FC = () => {
  const [state, setState] = useState<BrowseServicesState>({
    categories: [],
    loading: true,
    error: null,
    searchTerm: '',
    viewMode: 'grid',
    sortBy: 'name',
    hybridSearchResults: [],
    isHybridSearchActive: false,
    isSearching: false,
    refreshing: false,
    locationFilter: null,
    showLocationFilter: false,
    searchType: 'general',
    aiSearchEnabled: false
  });
  const navigate = useNavigate();

  // Calculate total service count including subcategories
  const getTotalServiceCount = (category: Category): number => {
    // Start with direct services count from this category
    let total = category._count?.services || 0;
    
    // Add services from all subcategories recursively
    if (category.children && Array.isArray(category.children) && category.children.length > 0) {
      category.children.forEach(child => {
        // Recursively count services from subcategories
        total += getTotalServiceCount(child);
      });
    }
    
    return total;
  };

  // Fetch categories function that can be reused
  const fetchCategories = async (isRefresh = false) => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: !isRefresh, 
        refreshing: isRefresh,
        error: null 
      }));
      
      const response = await categoryApi.getRootCategories({
        includeChildren: true
      });
      
      console.log('Categories API response:', response);
      
      if (response.success) {
        console.log('Categories data:', response.data);
        setState(prev => ({ 
          ...prev, 
          categories: response.data,
          loading: false,
          refreshing: false
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load categories',
          loading: false,
          refreshing: false
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load categories',
        loading: false,
        refreshing: false
      }));
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Add window focus event listener to refresh data when user returns to page
  useEffect(() => {
    const handleWindowFocus = () => {
      // Only refresh if we have categories already (not on initial load)
      if (state.categories.length > 0 && !state.loading && !state.refreshing) {
        console.log('Window focused, refreshing category data...');
        fetchCategories(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [state.categories.length, state.loading, state.refreshing]);

  // Perform hybrid search when search term or location changes
  useEffect(() => {
    const performSearch = async () => {
      const hasQuery = state.searchTerm.trim().length >= 3;
      const hasLocation = state.locationFilter?.latitude !== undefined && state.locationFilter?.longitude !== undefined;

      if (hasQuery || hasLocation) {
        if (state.aiSearchEnabled) {
          await performHybridSearch();
        } else {
          await performKeywordSearch();
        }
      } else {
        // Clear search results for short queries and no location
        setState(prev => ({ 
          ...prev, 
          hybridSearchResults: [],
          isHybridSearchActive: false,
          searchType: 'general'
        }));
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [state.searchTerm, state.locationFilter, state.aiSearchEnabled]);

  // Filter and sort categories
  const filteredAndSortedCategories = React.useMemo(() => {
    let filtered = state.categories;

    // Apply search filter only when not in hybrid search mode
    if (state.searchTerm && !state.isHybridSearchActive) {
      filtered = filtered.filter(category => 
        category.name?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'services':
          return getTotalServiceCount(b) - getTotalServiceCount(a);
        case 'popular':
          return getTotalServiceCount(b) - getTotalServiceCount(a);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [state.categories, state.searchTerm, state.sortBy, state.isHybridSearchActive]);

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchTerm: value }));
    // Search will be triggered by useEffect
  };

  const performHybridSearch = async () => {
    const query = state.searchTerm.trim();
    const location = state.locationFilter;

    if (!query && !location) return;

    try {
      setState(prev => ({ ...prev, isSearching: true }));
      
      const response = await hybridSearchApi.searchServices({
        query: query || undefined,
        location: location || undefined,
        threshold: 0.4,
        limit: 20,
        includeWithoutLocation: true
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          hybridSearchResults: response.data.results,
          isHybridSearchActive: true,
          isSearching: false,
          searchType: response.data.searchType,
          hasServicesWithinRadius: response.data.hasServicesWithinRadius,
          searchMessage: response.data.message
        }));
      }
    } catch (error) {
      console.error('Hybrid search failed:', error);
      setState(prev => ({ ...prev, isSearching: false }));
    }
  };

  const performKeywordSearch = async () => {
    const query = state.searchTerm.trim();
    if (!query) return;

    try {
      setState(prev => ({ ...prev, isSearching: true }));

      const response = await serviceApi.getServices({
        search: query,
        isActive: true,
        take: 20
      });

      if (response.success) {
        const results: HybridSearchResult[] = response.data.map((service) => ({
          id: service.id,
          title: service.title || '',
          description: service.description || '',
          price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
          currency: service.currency,
          tags: service.tags,
          images: service.images,
          similarity: 1,
          provider: {
            id: service.provider?.id || '',
            user: {
              firstName: service.provider?.user?.firstName || '',
              lastName: service.provider?.user?.lastName || ''
            }
          },
          category: {
            id: service.category?.id || '',
            name: service.category?.name || ''
          },
          latitude: service.latitude,
          longitude: service.longitude,
          address: service.address,
          city: service.city,
          state: service.state,
          country: service.country,
          postalCode: service.postalCode,
          serviceRadiusKm: service.serviceRadiusKm,
          distance_km: null
        }));

        setState(prev => ({
          ...prev,
          hybridSearchResults: results,
          isHybridSearchActive: true,
          isSearching: false,
          searchType: 'general',
          hasServicesWithinRadius: undefined,
          searchMessage: undefined
        }));
      }
    } catch (error) {
      console.error('Keyword search failed:', error);
      setState(prev => ({ ...prev, isSearching: false }));
    }
  };

  const clearSearch = () => {
    setState(prev => ({ 
      ...prev, 
      hybridSearchResults: [],
      isHybridSearchActive: false,
      searchTerm: '',
      locationFilter: null,
      searchType: 'general'
    }));
  };

  const handleLocationChange = (location: LocationParams | null) => {
    setState(prev => ({ ...prev, locationFilter: location }));
    // Search will be triggered by useEffect
  };

  const handleViewSearchResults = () => {
    if (state.hybridSearchResults.length > 0) {
      navigate('/services/search', {
        state: {
          results: state.hybridSearchResults,
          query: state.searchTerm || undefined,
          location: state.locationFilter ? {
            latitude: state.locationFilter.latitude,
            longitude: state.locationFilter.longitude,
            radius: state.locationFilter.radius
          } : undefined,
          searchType: state.searchType,
          hasServicesWithinRadius: state.hasServicesWithinRadius,
          message: state.searchMessage
        }
      });
    }
  };

  const handleSortChange = (sortBy: 'name' | 'services' | 'popular') => {
    setState(prev => ({ ...prev, sortBy }));
  };

  const handleViewModeChange = (viewMode: 'grid' | 'list') => {
    setState(prev => ({ ...prev, viewMode }));
  };

  const getSearchTypeLabel = () => {
    switch (state.searchType) {
      case 'hybrid': return 'AI Search + Location';
      case 'semantic': return 'AI Search';
      case 'location': return 'Location-based Search';
      case 'general': return 'General Browse';
      default: return 'Browse Services';
    }
  };

  if (state.loading) {
    return <BrowseServicesLoadingSkeleton />;
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
        {/* Square Grid Background */}
        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e5e7eb_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e5e7eb_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-30" />

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center pt-20">
            <h1 className="text-4xl font-extrabold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-4">
              Something went wrong
            </h1>
            <p className="text-lg text-gray-500 mb-6">
              {state.error}
            </p>
            <button
              onClick={() => fetchCategories()}
              className="inline-flex items-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] hover:scale-105 border border-orange-500"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Square Grid Background - Subtle with Smooth Fade */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e5e7eb_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e5e7eb_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-30 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]" />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-12 pt-20">
            <PageHeader
              className="mb-0"
              title={getSearchTypeLabel()}
              subtitle={
                state.isHybridSearchActive
                  ? `Found ${state.hybridSearchResults.length} matching services`
                  : 'Discover amazing services from verified providers'
              }
            />
            {/* Add search message notification */}
            {state.searchMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-400">
                  {state.searchMessage}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Search Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] border border-gray-100 p-6">
              {/* Main Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for services (e.g., 'web development', 'plumbing', 'graphic design')"
                  value={state.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg transition-all duration-200"
                />
                {state.isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Location and Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                {/* Location Filter */}
                <div className="flex-1">
                  <button
                    onClick={() => setState(prev => ({ ...prev, showLocationFilter: !prev.showLocationFilter }))}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-105 ${
                      state.showLocationFilter || state.locationFilter
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-2 inline" />
                    {state.locationFilter ? 'Location Set' : 'Add Location'}
                  </button>

                  {state.showLocationFilter && (
                    <div className="mt-4">
          <LocationPickerAdvanced
            value={state.locationFilter || undefined}
            onChange={handleLocationChange}
            placeholder="Search by location (radius optional)..."
            showRadius={true}
            defaultRadius={10}
            maxRadius={50}
            autoDetect={false}
            allowManualRadius={true}
          />
                    </div>
                  )}
                </div>

                {/* AI Search Toggle */}
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, aiSearchEnabled: !prev.aiSearchEnabled }))}
                  aria-pressed={state.aiSearchEnabled}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-105 flex items-center gap-1.5 ${
                    state.aiSearchEnabled
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Search
                </button>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {(state.searchTerm || state.locationFilter) && (
                    <button
                      onClick={clearSearch}
                      className="px-4 py-2 bg-white hover:bg-orange-50 text-gray-700 rounded-xl transition-all duration-300 text-sm border border-gray-200 hover:border-orange-300 hover:scale-105 font-medium"
                    >
                      Clear
                    </button>
                  )}

                  {state.isHybridSearchActive && state.hybridSearchResults.length > 0 && (
                    <button
                      onClick={handleViewSearchResults}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-300 text-sm font-medium border border-orange-500 shadow-[0_4px_16px_0_rgba(0,0,0,0.12)] hover:scale-105"
                    >
                      View All Results
                      <ArrowRight className="w-4 h-4 ml-1 inline" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Preview */}
          {state.isHybridSearchActive && state.hybridSearchResults.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Search Results
                </h2>
                <span className="text-gray-500 text-sm md:text-base">
                  Showing {Math.min(6, state.hybridSearchResults.length)} of {state.hybridSearchResults.length} results
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {state.isSearching ? (
                  [...Array(6)].map((_, index) => (
                    <SearchResultCardSkeleton key={index} />
                  ))
                ) : (
                  state.hybridSearchResults.slice(0, 6).map((service) => (
                    <SearchResultServiceCard
                      key={service.id}
                      service={service}
                      viewMode="grid"
                      showDistance={state.locationFilter !== null}
                    />
                  ))
                )}
              </div>

              {state.hybridSearchResults.length > 6 && (
                <div className="text-center">
                  <button
                    onClick={handleViewSearchResults}
                    className="inline-flex items-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] hover:scale-105 border border-orange-500"
                  >
                    View All {state.hybridSearchResults.length} Results
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Categories Section - Show when not in active search mode */}
          {!state.isHybridSearchActive && (
            <>
              {/* Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500">Sort by:</span>
                  <select
                    value={state.sortBy}
                    onChange={(e) => handleSortChange(e.target.value as 'name' | 'services' | 'popular')}
                    title="Sort categories"
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="name">Name</option>
                    <option value="services">Most Services</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">View:</span>
                  <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      title="Grid view"
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        state.viewMode === 'grid'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      title="List view"
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        state.viewMode === 'list'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories Grid */}
              {(state.isSearching || state.refreshing) ? (
                <div className={state.viewMode === 'grid' 
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' 
                  : 'space-y-4'
                }>
                  {[...Array(state.viewMode === 'grid' ? 6 : 4)].map((_, index) => (
                    <CategoryCardSkeleton key={index} viewMode={state.viewMode} />
                  ))}
                </div>
              ) : filteredAndSortedCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search terms or clear the search to see all categories
                  </p>
                  <button
                    onClick={clearSearch}
                    className="inline-flex items-center px-6 py-3 bg-white hover:bg-orange-50 text-gray-700 rounded-full border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 font-medium"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className={state.viewMode === 'grid' 
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' 
                  : 'space-y-4'
                }>
                  {filteredAndSortedCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      viewMode={state.viewMode}
                      getTotalServiceCount={getTotalServiceCount}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default BrowseServices;





