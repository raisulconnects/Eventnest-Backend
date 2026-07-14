import { Request, Response, NextFunction } from "express";
import Review from "../models/Review";
import Event from "../models/Event";

async function recalculateEventRating(eventId: string) {
  const result = await Review.aggregate([
    { $match: { event: eventId } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);

  const avg = result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
  await Event.findByIdAndUpdate(eventId, { ratingAverage: avg });
}

export const getReviewsByEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate("user", "_id name")
      .sort({ createdAt: -1 });

    const items = reviews.map((review) => ({
      _id: review._id.toString(),
      userName: (review.user as any)?.name || "",
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt,
      createdAt: review.createdAt,
      user: {
        _id: (review.user as any)?._id?.toString() || "",
        name: (review.user as any)?.name || "",
      },
    }));

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) *
              10
          ) / 10
        : 0;

    res.json({
      success: true,
      message: "Reviews fetched successfully",
      data: { items, averageRating, totalReviews },
    });
  } catch (error) {
    next(error);
  }
};

export const createReviewForEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rating, comment } = req.body;
    const eventId = req.params.eventId as string;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const existingReview = await Review.findOne({
      event: eventId,
      user: req.user!.id,
    });

    let review: any;
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      review = await existingReview.save();
    } else {
      review = await Review.create({
        event: eventId,
        user: req.user!.id,
        rating,
        comment,
      });

      event.reviews.push(review._id);
      await event.save();
    }

    await recalculateEventRating(eventId);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: {
        review: {
          _id: review._id.toString(),
          rating: review.rating,
          comment: review.comment,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reviewId = req.params.id as string;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      req.user!.role !== "admin" &&
      review.user.toString() !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await Event.findByIdAndUpdate(review.event, {
      $pull: { reviews: review._id },
    });

    await Review.findByIdAndDelete(reviewId);

    await recalculateEventRating(review.event.toString());

    res.json({
      success: true,
      message: "Review deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
