import type { Request, Response, NextFunction } from 'express';
import {
  createReview,
  getUserGivenReviews,
  getReviewsByProvider,
  getUserReviewStatus,
  getReviewById,
  updateReview,
  deleteReview,
  getCustomerStats
} from '../services/review.service.js';
import { queueService } from '../services/queue.service.js';
import { prisma } from '../utils/database.js';
import bookingService from '../services/booking.service.js';

export const createReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { revieweeId, rating, comment } = req.body;
    // Trust the token, not the caller-supplied reviewerId.
    const reviewerId = (req as any).user?.id as string;

    // A provider may only rate a customer they've actually completed work for.
    const allowed = await bookingService.hasCompletedBookingWithCustomer(reviewerId, revieweeId);
    if (!allowed) {
      return res.status(403).json({
        error: 'You can only review a customer after marking their booking complete.',
      });
    }

    // Check if review already exists
    const existingReview = await prisma.customerReview.findFirst({
      where: {
        reviewerId: reviewerId,
        revieweeId: revieweeId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });

    let review;
    let isUpdate = false;

    if (existingReview) {
      // Update existing review (upsert behavior)
      review = await prisma.customerReview.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment,
          updatedAt: new Date(),
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });
      isUpdate = true;
    } else {
      // Create new review
      review = await createReview({ reviewerId, revieweeId, rating, comment });
    }

    // Send email notification only for NEW reviews (not updates)
    if (!isUpdate) {
      try {
        const [reviewer, reviewee] = await Promise.all([
          prisma.user.findUnique({
            where: { id: reviewerId },
            select: { email: true, firstName: true, lastName: true }
          }),
          prisma.user.findUnique({
            where: { id: revieweeId },
            select: { email: true, firstName: true, lastName: true }
          })
        ]);

        if (reviewer && reviewee) {
          await queueService.sendMessageOrReviewNotification({
            customerEmail: reviewer.email,
            providerEmail: reviewee.email,
            customerName: `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.email,
            providerName: `${reviewee.firstName} ${reviewee.lastName}`.trim() || reviewee.email,
            reviewData: {
              rating,
              comment,
              reviewerName: `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.email
            },
            notificationType: 'REVIEW',
            metadata: {
              reviewId: review.id,
              rating: rating
            }
          });
          console.log('📧 Review notification email queued successfully');
        }
      } catch (emailError) {
        console.error('❌ Failed to queue review notification email:', emailError);
        // Don't fail the review creation if email fails
      }
    }

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? 'Review updated' : 'Review created',
      review,
      isUpdate
    });
  } catch (err) {
    next(err);
  }
};

export const getUserGivenReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.userId);
    const { page = 1, limit = 10 } = req.query;
    const reviews = await getUserGivenReviews(userId!, Number(page), Number(limit));
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const getUserReceivedReviewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.userId);
    const { page = 1, limit = 10 } = req.query;
    const reviews = await getReviewsByProvider(userId!, Number(page), Number(limit));
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const getReviewByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = String(req.params.reviewId);
    const review = await getReviewById(reviewId!);
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
};

export const updateReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = String(req.params.reviewId);
    const reviewerId = req.body.reviewerId;
    const updateData = req.body;
    const review = await updateReview(reviewId!, updateData, reviewerId);
    res.status(200).json({ message: 'Review updated', review });
  } catch (err) {
    next(err);
  }
};

export const deleteReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = String(req.params.reviewId);
    const reviewerId = req.body.reviewerId;
    const result = await deleteReview(reviewId!, reviewerId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getUserReviewStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.userId);
    const stats = await getCustomerStats(userId!);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
};

export const getUserReviewStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.params.userId);
    const revieweeId = String(req.params.revieweeId);
    const reviewStatus = await getUserReviewStatus(userId!, revieweeId!);
    res.status(200).json(reviewStatus);
  } catch (err) {
    next(err);
  }
};
