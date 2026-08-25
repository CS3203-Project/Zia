import { prisma } from '../utils/database.js';
import { embeddingService } from './embedding.service.js';
import chatClient from './chatClient.service.js';

/**
 * Generates and stores a service's embeddings. Deliberately fire-and-forget at every
 * call site — the caller does NOT await this, so a slow/unavailable embedding API can't
 * add latency to a create/update service request. Errors are swallowed here (logged
 * only) for the same reason: there's no request left to fail by the time this settles.
 */
async function generateAndStoreServiceEmbeddings(
  serviceId: string,
  title: string | null,
  description: string | null,
  tags: string[]
): Promise<void> {
  try {
    const embeddings = await embeddingService.generateServiceEmbeddings({
      title: title ?? '',
      description: description ?? '',
      tags
    });

    await prisma.$executeRaw`
      UPDATE "Service"
      SET
        "titleEmbedding" = ${`[${embeddings.titleEmbedding.join(',')}]`}::vector,
        "descriptionEmbedding" = ${`[${embeddings.descriptionEmbedding.join(',')}]`}::vector,
        "tagsEmbedding" = ${`[${embeddings.tagsEmbedding.join(',')}]`}::vector,
        "combinedEmbedding" = ${`[${embeddings.combinedEmbedding.join(',')}]`}::vector,
        "embeddingUpdatedAt" = NOW()
      WHERE id = ${serviceId}
    `;

    console.log('✅ Embeddings generated and stored for service:', serviceId);
  } catch (embeddingError) {
    console.warn('⚠️ Failed to generate/store embeddings for service:', serviceId, embeddingError);
  }
}

// Type definitions
interface ServiceCreateData {
  providerId: string;
  categoryId: string;
  title?: string;
  description?: string;
  price: number;
  currency?: string;
  tags?: string[];
  images?: string[];
  videoUrl?: string;  // Add videoUrl to interface
  isActive?: boolean;
  workingTime?: string[];
  // Location fields
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  serviceRadiusKm?: number;
  locationLastUpdated?: Date;
}

interface ServiceFilters {
  providerId?: string;
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  skip?: number;
  take?: number;
}

interface LocationSearchOptions {
  latitude: number;
  longitude: number;
  radius: number;
  page: number;
  limit: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Create a new service
 * @param {ServiceCreateData} serviceData - The service data
 * @returns {Promise<Object>} Created service object
 */
export const createService = async (serviceData: ServiceCreateData) => {
  try {
    const {
      providerId,
      categoryId,
      title,
      description,
      price,
      currency = "LKR",
      tags = [],
      images = [],
      isActive = true,
      workingTime = [],
      videoUrl
    } = serviceData;

    // Validate required fields
    if (!providerId) {
      throw new Error('Provider ID is required');
    }
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    if (price === undefined || price === null) {
      throw new Error('Price is required');
    }

    // Validate that provider exists
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId }
    });
    if (!provider) {
      throw new Error('Service provider not found');
    }

    // Validate that category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      throw new Error('Category not found');
    }

    // Prepare data for Prisma create
    const createData = {
      providerId,
      categoryId,
      title: title ?? null,
      description: description ?? null,
      price,
      currency,
      tags,
      images,
      isActive,
      workingTime,
      videoUrl: videoUrl ?? null, // Ensure videoUrl is null if undefined
      // Location fields
      latitude: serviceData.latitude ?? null,
      longitude: serviceData.longitude ?? null,
      address: serviceData.address ?? null,
      city: serviceData.city ?? null,
      state: serviceData.state ?? null,
      country: serviceData.country ?? null,
      postalCode: serviceData.postalCode ?? null,
      serviceRadiusKm: serviceData.serviceRadiusKm ?? null,
      locationLastUpdated: serviceData.locationLastUpdated ?? null
    };

    // Create the service first
    const newService = await prisma.service.create({
      data: createData,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        category: true
      }
    });

    // Generate and store embeddings in the background — deliberately not awaited, so a
    // slow/unavailable Gemini API can't add latency to every service create request.
    // generateAndStoreServiceEmbeddings() already swallows its own errors.
    void generateAndStoreServiceEmbeddings(newService.id, newService.title, newService.description, newService.tags);

    return newService;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to create service: ${errorMessage}`);
  }
};

/**
 * Get all services with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} [filters.providerId] - Filter by provider ID
 * @param {string} [filters.categoryId] - Filter by category ID
 * @param {boolean} [filters.isActive] - Filter by active status
 * @param {number} [filters.skip=0] - Number of records to skip for pagination
 * @param {number} [filters.take=10] - Number of records to take for pagination
 * @returns {Promise<Object[]>} Array of service objects
 */
export const getServices = async (filters: ServiceFilters = {}) => {
  try {
    const {
      providerId,
      categoryId,
      isActive = true, // Default to active services only
      search,
      skip = 0,
      take = 20 // Increased default for better UX
    } = filters;

    const whereClause: any = {};

    if (providerId) whereClause.providerId = providerId;
    if (categoryId) whereClause.categoryId = categoryId;
    if (isActive !== undefined) whereClause.isActive = isActive;
    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { tags: { has: search.trim().toLowerCase() } }
      ];
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                imageUrl: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        serviceReviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            serviceReviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating for each service
    const servicesWithRating = services.map(service => {
      const reviewCount = service._count.serviceReviews;
      let averageRating = 0;
      
      if (reviewCount > 0 && service.serviceReviews.length > 0) {
        const totalRating = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = totalRating / service.serviceReviews.length;
      }
      
      // Debug logging
      console.log(`Service ${service.id} (${service.title}): reviewCount=${reviewCount}, averageRating=${averageRating}, reviews=${JSON.stringify(service.serviceReviews)}`);
      
      // Remove the serviceReviews array from the response to keep it clean
      const { serviceReviews, ...serviceData } = service;
      
      return {
        ...serviceData,
        averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
        reviewCount
      };
    });

    console.log('Returning services with ratings:', servicesWithRating.map(s => ({ id: s.id, title: s.title, averageRating: s.averageRating, reviewCount: s.reviewCount })));
    return servicesWithRating;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to fetch services: ${errorMessage}`);
  }
};

/**
 * Get a single service by ID
 * @param {string} serviceId - The service ID
 * @returns {Promise<Object|null>} Service object or null if not found
 */
export const getServiceById = async (serviceId: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                imageUrl: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        serviceReviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            serviceReviews: true,
            schedules: true
          }
        }
      }
    });

    console.log('=== GET SERVICE BY ID DEBUG ===');
    console.log('Service found:', service?.id);
    console.log('Service videoUrl:', (service as any)?.videoUrl);

    if (!service) {
      return null;
    }

    // Calculate average rating
    const reviewCount = service._count.serviceReviews;
    let averageRating = 0;
    
    if (reviewCount > 0 && service.serviceReviews.length > 0) {
      const totalRating = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / service.serviceReviews.length;
    }
    
    // Remove the serviceReviews array from the response to keep it clean
    const { serviceReviews, ...serviceData } = service;
    
    return {
      ...serviceData,
      averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
      reviewCount
    };
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to fetch service: ${errorMessage}`);
  }
};

/**
 * Update a service
 * @param {string} serviceId - The service ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated service object
 */
export const updateService = async (serviceId: string, updateData: Partial<ServiceCreateData>) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Check if content that affects embeddings has changed
    const contentChanged = (
      (updateData.title !== undefined && updateData.title !== service.title) ||
      (updateData.description !== undefined && updateData.description !== service.description) ||
      (updateData.tags !== undefined && JSON.stringify(updateData.tags) !== JSON.stringify(service.tags))
    );

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        category: true
      }
    });

    // Regenerate embeddings if content changed — background, not awaited (see the
    // matching comment in createService).
    if (contentChanged) {
      void generateAndStoreServiceEmbeddings(serviceId, updatedService.title, updatedService.description, updatedService.tags);
    }

    return updatedService;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to update service: ${errorMessage}`);
  }
};

/**
 * Delete a service
 * @param {string} serviceId - The service ID
 * @returns {Promise<Object>} Deleted service object
 */
export const deleteService = async (serviceId: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    const deletedService = await prisma.service.delete({
      where: { id: serviceId }
    });

    return deletedService;
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to delete service: ${errorMessage}`);
  }
};

/**
 * Get a service by conversation ID
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} Service object or null if not found
 */
export const getServiceByConversationId = async (conversationId: string) => {
  try {
    // Conversations now live in the Chat service, so look up its serviceId over HTTP first
    const conversation = await chatClient.getConversation(conversationId);

    if (!conversation || !conversation.serviceId) {
      return null;
    }

    const service = await prisma.service.findUnique({
      where: { id: conversation.serviceId },
      include: {
        provider: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                imageUrl: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true
          }
        },
        serviceReviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            serviceReviews: true,
            schedules: true
          }
        }
      }
    });

    if (!service) {
      return null;
    }

    // Calculate average rating
    const reviewCount = service._count.serviceReviews;
    let averageRating = 0;
    
    if (reviewCount > 0 && service.serviceReviews.length > 0) {
      const totalRating = service.serviceReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / service.serviceReviews.length;
    }
    
    // Remove the serviceReviews array from the response to keep it clean
    const { serviceReviews, ...serviceData } = service;
    
    return {
      ...serviceData,
      averageRating: averageRating > 0 ? parseFloat(averageRating.toFixed(1)) : 0,
      reviewCount
    };
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to fetch service by conversation ID: ${errorMessage}`);
  }
};

/**
 * Search services by location using PostGIS spatial queries
 * @param {LocationSearchOptions} options - Search options
 * @returns {Promise<Object>} Services and pagination info
 */
export const searchServicesByLocation = async (options: LocationSearchOptions) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      page,
      limit,
      categoryId,
      minPrice,
      maxPrice
    } = options;

    const offset = (page - 1) * limit;

    // Build WHERE clause for additional filters
    let whereConditions = ['s."isActive" = true'];
    const queryParams: any[] = [longitude, latitude, radius * 1000, limit, offset]; // radius in meters
    let paramIndex = 6;

    if (categoryId) {
      whereConditions.push(`s."categoryId" = $${paramIndex}`);
      queryParams.push(categoryId);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      whereConditions.push(`s.price >= $${paramIndex}`);
      queryParams.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      whereConditions.push(`s.price <= $${paramIndex}`);
      queryParams.push(maxPrice);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Finds the matching services (radius filter + pagination) first, in one pass, using
    // the GiST expression index on the location point (see the
    // Service_location_gist_idx migration) so ST_DWithin is an index scan, not a
    // sequential one. COUNT(*) OVER() rides along on the same scan instead of a second,
    // separate full-table COUNT query. Review aggregation and the provider/category
    // joins only run against the already-limited page of rows (a LATERAL join per row)
    // instead of every matching service before the LIMIT was applied.
    const servicesQuery = `
      WITH matched_services AS (
        SELECT
          s.*,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) / 1000 as distance_km,
          COUNT(*) OVER() as total_count
        FROM "Service" s
        ${whereClause}
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        ORDER BY distance_km ASC
        LIMIT $4 OFFSET $5
      )
      SELECT
        ms.*,
        sp.id as provider_id,
        sp."averageRating" as provider_average_rating,
        sp."totalReviews" as provider_total_reviews,
        u."firstName" as provider_first_name,
        u."lastName" as provider_last_name,
        u."imageUrl" as provider_image_url,
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(review_agg.avg_rating, 0) as average_rating,
        COALESCE(review_agg.review_count, 0) as review_count
      FROM matched_services ms
      INNER JOIN "ServiceProvider" sp ON ms."providerId" = sp.id
      INNER JOIN "User" u ON sp."userId" = u.id
      INNER JOIN "Category" c ON ms."categoryId" = c.id
      LEFT JOIN LATERAL (
        SELECT AVG(sr.rating) as avg_rating, COUNT(sr.id) as review_count
        FROM "ServiceReview" sr
        WHERE sr."serviceId" = ms.id
      ) review_agg ON true
      ORDER BY ms.distance_km ASC
    `;

    const services = (await prisma.$queryRawUnsafe(servicesQuery, ...queryParams)) as any[];
    const total = services.length > 0 ? parseInt(services[0].total_count) : 0;

    // Format the results
    const formattedServices = services.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      price: parseFloat(service.price),
      currency: service.currency,
      tags: service.tags,
      images: service.images,
      videoUrl: service.videoUrl,
      isActive: service.isActive,
      workingTime: service.workingTime,
      latitude: parseFloat(service.latitude),
      longitude: parseFloat(service.longitude),
      address: service.address,
      city: service.city,
      state: service.state,
      country: service.country,
      postalCode: service.postalCode,
      serviceRadiusKm: service.serviceRadiusKm ? parseFloat(service.serviceRadiusKm) : null,
      distance_km: parseFloat(service.distance_km),
      averageRating: service.average_rating ? parseFloat(parseFloat(service.average_rating).toFixed(1)) : 0,
      reviewCount: parseInt(service.review_count) || 0,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      provider: {
        id: service.provider_id,
        averageRating: service.provider_average_rating ? parseFloat(service.provider_average_rating) : null,
        totalReviews: service.provider_total_reviews,
        user: {
          firstName: service.provider_first_name,
          lastName: service.provider_last_name,
          imageUrl: service.provider_image_url
        }
      },
      category: {
        name: service.category_name,
        slug: service.category_slug
      }
    }));

    return {
      services: formattedServices,
      total
    };
  } catch (error) {
    console.error('Location search error:', error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message: string }).message
      : String(error);
    throw new Error(`Failed to search services by location: ${errorMessage}`);
  }
};
