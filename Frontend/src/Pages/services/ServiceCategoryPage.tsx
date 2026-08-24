import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ServiceCard from '../../components/services/ServiceCard';
import Breadcrumb from '../../components/services/Breadcrumb';
import SubCategorySidebar from '../../components/services/SubCategorySidebar';
import CategoryPageSkeleton from '../../components/services/CategoryPageSkeleton';
import CategoryNotFoundState from '../../components/services/CategoryNotFoundState';
import CategoryResultsHeader from '../../components/services/CategoryResultsHeader';
import ServiceResultsSkeleton from '../../components/services/ServiceResultsSkeleton';
import EmptyServicesState from '../../components/services/EmptyServicesState';
import { serviceApi } from '../../api/serviceApi';
import { categoryApi } from '../../api/categoryApi';
import type { ServiceResponse } from '../../api/serviceApi';
import type { Category } from '../../api/categoryApi';

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
    return <CategoryPageSkeleton />;
  }

  if (error || !category) {
    return <CategoryNotFoundState error={error} categorySlug={categorySlug} />;
  }

  const breadcrumbItems = [
    { label: 'Services', href: '/services' },
    { label: category.name || category.slug }
  ];

  const currentCategoryName = selectedSubCategory
    ? category.children?.find(c => c.id === selectedSubCategory)?.name
    : category.name;

  const hasSubcategories = !!(category.children && category.children.length > 0);

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
          {hasSubcategories && (
            <SubCategorySidebar
              category={category}
              selectedSubCategory={selectedSubCategory}
              onSelectSubCategory={setSelectedSubCategory}
              allServices={allServices}
              isLoading={servicesLoading}
            />
          )}

          {/* Main Content */}
          <div ref={resultsRef} className={`w-full p-4 ${hasSubcategories ? 'md:w-3/4 lg:w-4/5' : ''}`}>
            <CategoryResultsHeader
              currentCategoryName={currentCategoryName}
              showSubcategoriesHint={!selectedSubCategory && hasSubcategories}
              isLoading={servicesLoading}
              selectedSubCategory={selectedSubCategory}
              resultCount={sortedServices.length}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Services Grid */}
            {servicesLoading ? (
              <ServiceResultsSkeleton />
            ) : sortedServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <EmptyServicesState
                selectedSubCategory={selectedSubCategory}
                categoryName={category.name}
                hasSubcategories={hasSubcategories}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryPage;
