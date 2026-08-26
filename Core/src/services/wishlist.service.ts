import { prisma } from '../utils/database.js';

/**
 * Save-for-later list, customer side only.
 *
 * Saving is idempotent: the unique (userId, serviceId) pair means a double tap
 * is a no-op rather than a duplicate row or an error the UI has to explain.
 */
export const addToWishlist = async (userId: string, serviceId: string) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!service) {
    const err = new Error('Service not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  return prisma.wishlist.upsert({
    where: { userId_serviceId: { userId, serviceId } },
    create: { userId, serviceId },
    update: {},
  });
};

export const removeFromWishlist = async (userId: string, serviceId: string) => {
  // deleteMany rather than delete: removing something already gone should be a
  // success, not a 500, so the button stays honest if it is tapped twice.
  await prisma.wishlist.deleteMany({ where: { userId, serviceId } });
};

export const listWishlist = async (userId: string) => {
  const rows = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      service: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          provider: {
            select: {
              id: true,
              averageRating: true,
              user: { select: { firstName: true, lastName: true, imageUrl: true } },
            },
          },
        },
      },
    },
  });

  // A saved service can be delisted by its provider. Keep the row (so it comes
  // back if they relist) but don't offer a dead listing in the saved list.
  return rows.filter((r) => r.service && r.service.isActive).map((r) => ({
    savedAt: r.createdAt,
    service: r.service,
  }));
};

/** Which of these services the user has saved - one query for a whole list. */
export const getSavedServiceIds = async (userId: string, serviceIds: string[]) => {
  if (serviceIds.length === 0) return [];
  const rows = await prisma.wishlist.findMany({
    where: { userId, serviceId: { in: serviceIds } },
    select: { serviceId: true },
  });
  return rows.map((r) => r.serviceId);
};
