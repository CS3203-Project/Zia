import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ServiceCard from '../../components/services/ServiceCard';
import Breadcrumb from '../../components/services/Breadcrumb';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import type { ServiceResponse } from '../../api/serviceApi';
import type { Category } from '../../api/categoryApi';
import { ChevronDown, Loader2 } from 'lucide-react';
import Button from '../../components/shared/Button';

const SubCategorySidebar: React.FC<{
  category: Category;
  selectedSubCategory: string | null;
  onSelectSubCategory: (categoryId: string | null) => void;
  allServices: ServiceResponse[];
  isLoading?: boolean;
}> = ({ category, selectedSubCategory, onSelectSubCategory, allServices, isLoading }) => {
  
  // Calculate service counts for each subcategory using allServices to maintain accurate counts
  const getSubcategoryServiceCount = (subcategoryId: string) => {
    return allServices.filter(service => service.category?.id === subcategoryId).length;
  };
  
  const getAllCategoryServiceCount = () => {
    return allServices.length;
  };
  
  return (
    <div className="w-full md:w-1/4 lg:w-1/5 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-500">Subcategories</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onSelectSubCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                selectedSubCategory === null
                  ? 'bg-orange-500 text-white font-semibold'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All {category.name}</span>
                {isLoading && allServices.length === 0 ? (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedSubCategory === null
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  </span>
                ) : (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedSubCategory === null
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getAllCategoryServiceCount()}
                  </span>
                )}
              </div>
            </button>
          </li>
          {category.children && category.children.map((sub) => {
            const serviceCount = getSubcategoryServiceCount(sub.id);
            return (
              <li key={sub.id}>
                <button
                  onClick={() => onSelectSubCategory(sub.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    selectedSubCategory === sub.id
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{sub.name}</span>
                    {isLoading && allServices.length === 0 ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedSubCategory === sub.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedSubCategory === sub.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {serviceCount}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const ServiceCategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [allServices, setAllServices] = useState<ServiceResponse[]>([]); // Store all services for count calculation
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const isFirstSubCategoryRender = useRef(true);

  // On mobile the subcategory sidebar sits above the results, so picking a
  // subcategory can leave the list scrolled out of view — bring it into view.
  // Desktop shows them side by side, so skip there to avoid a pointless jump.
  useEffect(() => {
    if (isFirstSubCategoryRender.current) {
      isFirstSubCategoryRender.current = false;
      return;
    }
    if (window.innerWidth < 768) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSubCategory]);

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      if (!categorySlug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching category with slug:', categorySlug);
        
        const response = await categoryApi.getCategoryBySlug(categorySlug, {
          includeChildren: true,
          includeServices: false
        });
        
        if (response.success) {
          setCategory(response.data);
          console.log('Category found:', response.data);
        } else {
          setError('Category not found');
        }
      } catch (err: unknown) {
        console.error('Failed to fetch category:', err);
        
        // If category not found, let's fetch all categories to see what's available
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            try {
              console.log('Category not found, fetching all available categories...');
              const allCategoriesResponse = await categoryApi.getCategories();
              if (allCategoriesResponse.success) {
                console.log('Available categories:', allCategoriesResponse.data.map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  slug: cat.slug,
                  parentId: cat.parentId
                })));
              }
            } catch (fetchAllError) {
              console.error('Failed to fetch all categories:', fetchAllError);
            }
            
            setError(`Category "${categorySlug}" not found. Please check if this category exists in your database.`);
          } else {
            setError('Failed to load category');
          }
        } else {
          setError('Failed to load category');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categorySlug]);

  // Fetch all services initially for accurate counts
  useEffect(() => {
    const fetchAllServices = async () => {
      if (!category) return;
      
      try {
        // Fetch services for main category and all its subcategories
        const categoryIdsToFetch = [category.id];
        
        // Add all subcategory IDs
        if (category.children && category.children.length > 0) {
          categoryIdsToFetch.push(...category.children.map(child => child.id));
        }
        
        // Fetch services for all categories in parallel
        const servicePromises = categoryIdsToFetch.map(categoryId =>
          serviceApi.getServices({
            categoryId,
            isActive: true,
            take: 50
          })
        );
        
        const responses = await Promise.all(servicePromises);
        
        // Combine all services from different categories
        const fetchedServices: ServiceResponse[] = [];
        responses.forEach(response => {
          if (response.success) {
            fetchedServices.push(...response.data);
          }
        });
        
        // Remove duplicates if any
        const uniqueServices = fetchedServices.filter((service, index, self) =>
          index === self.findIndex(s => s.id === service.id)
        );
        
        setAllServices(uniqueServices);
        setServices(uniqueServices);
        
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setAllServices([]);
        setServices([]);
      }
    };

    fetchAllServices();
  }, [category]);

  // Filter services when subcategory changes
  useEffect(() => {
    if (!category || allServices.length === 0) return;
    
    setServicesLoading(true);
    
    // Use setTimeout to simulate smooth transition and prevent flickering
    const timeoutId = setTimeout(() => {
      if (selectedSubCategory) {
        // Filter to show only selected subcategory services
        const filtered = allServices.filter(service => service.category?.id === selectedSubCategory);
        setServices(filtered);
      } else {
        // Show all services
        setServices(allServices);
      }
      setServicesLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [selectedSubCategory, allServices, category]);

  // Sort services based on selected option
  const sortedServices = React.useMemo(() => {
    const servicesCopy = [...services];
    
    switch (sortBy) {
      case 'price-low':
        return servicesCopy.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price-high':
        return servicesCopy.sort((a, b) => Number(b.price) - Number(a.price));
      case 'newest':
        return servicesCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return servicesCopy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      default:
        return servicesCopy;
    }
  }, [services, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
        {/* Square Grid Background with fade */}
        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e5e7eb_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e5e7eb_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-30 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]" />
        
        <div className="container mx-auto px-4 pt-20 pb-8 relative z-10">
          {/* Header Skeleton */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 mb-10">
            <div className="animate-pulse">
              {/* Breadcrumb skeleton */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              {/* Title skeleton */}
              <div className="h-12 bg-gray-200 rounded w-2/3 mb-4"></div>
              {/* Description skeleton */}
              <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:-mx-4">
            {/* Sidebar Skeleton */}
            <div className="w-full md:w-1/4 lg:w-1/5 p-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="w-full md:w-3/4 lg:w-4/5 p-4">
              {/* Controls Skeleton */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="animate-pulse flex justify-between items-center">
                  <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-48"></div>
                </div>
              </div>

              {/* Services Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                      <div className="w-full h-64 bg-gray-200"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                        <div className="h-6 bg-gray-200 rounded w-full mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
        {/* Enhanced Square Grid Background with fade effect */}
        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e5e7eb_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e5e7eb_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-30 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]" />
        
        <div className="container mx-auto px-4 pt-20 pb-8 relative z-10">
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Category Not Found
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  {error || 'The category you\'re looking for doesn\'t exist or couldn\'t be loaded.'}
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-3">Troubleshooting:</h3>
                  <ul className="text-sm text-yellow-700 text-left space-y-2">
                    <li>• Check if the category "{categorySlug}" exists in your database</li>
                    <li>• Verify the category slug is correct</li>
                    <li>• Check the browser console for available categories</li>
                    <li>• Ensure your backend is running and accessible</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => window.location.href = '/services'}
                    className="w-full"
                    size="lg"
                  >
                    Browse All Services
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Retry Loading
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Services', href: '/services' },
    { label: category.name || category.slug }
  ];

  const currentCategoryName = selectedSubCategory 
    ? category.children?.find(c => c.id === selectedSubCategory)?.name 
    : category.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Enhanced Square Grid Background with fade effect */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e5e7eb_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e5e7eb_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-30 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]" />
      
      <div className="container mx-auto px-4 pt-20 pb-4 relative z-10">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {category.name || category.slug}
            </h1>
          </div>
          {category.description && (
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">{category.description}</p>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:-mx-4">
          {/* Sidebar for Subcategories */}
          {category.children && category.children.length > 0 && (
            <SubCategorySidebar
              category={category}
              selectedSubCategory={selectedSubCategory}
              onSelectSubCategory={setSelectedSubCategory}
              allServices={allServices}
              isLoading={servicesLoading}
            />
          )}

          {/* Main Content */}
          <div ref={resultsRef} className={`w-full p-4 ${category.children && category.children.length > 0 ? 'md:w-3/4 lg:w-4/5' : ''}`}>
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {currentCategoryName}
                  </h2>
                  {!selectedSubCategory && category.children && category.children.length > 0 && (
                    <span className="text-xs text-gray-500">
                      Including all subcategories
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {servicesLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      <span className="text-xs text-gray-500">
                        {selectedSubCategory ? 'Loading services...' : 'Loading all services...'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">{sortedServices.length} services</span>
                  )}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      title="Sort services"
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-3 pr-9 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:bg-gray-100 transition-all duration-300"
                    >
                      <option value="relevance" className="bg-white text-gray-900">Sort by: Relevance</option>
                      <option value="price-low" className="bg-white text-gray-900">Sort by: Price (Low to High)</option>
                      <option value="price-high" className="bg-white text-gray-900">Sort by: Price (High to Low)</option>
                      <option value="newest" className="bg-white text-gray-900">Sort by: Newest First</option>
                      <option value="oldest" className="bg-white text-gray-900">Sort by: Oldest First</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            {servicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                      <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Services Found</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">
                    {selectedSubCategory
                      ? `There are currently no active services available in this subcategory.`
                      : `There are currently no active services available in "${category.name}" or its subcategories.`
                    }
                  </p>
                  {!selectedSubCategory && category.children && category.children.length > 0 && (
                    <p className="text-gray-400 text-sm">
                      Try selecting a specific subcategory from the sidebar.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryPage;





