import { Request, Response, NextFunction } from "express";
import Event from "../models/Event";
import Review from "../models/Review";
import ApiFeatures from "../utils/apiFeatures";

export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, category, location, minPrice, maxPrice, sort, order, page, limit } =
      req.query as Record<string, string>;

    const filter = ApiFeatures.buildFilter({ search, category, location, minPrice, maxPrice });
    const sortObj = ApiFeatures.buildSort(sort, order) as Record<string, 1 | -1>;
    const { pageNum, limitNum, skip } = ApiFeatures.buildPagination(page, limit);

    const totalItems = await Event.countDocuments(filter);

    const items = await Event.find(filter)
      .populate("organizer", "_id name")
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const itemsWithOrganizerId = items.map((item: any) => ({
      ...item,
      organizerId: item.organizer?._id?.toString() || item.organizer?.toString(),
    }));

    res.json({
      success: true,
      message: "Events fetched successfully",
      data: {
        items: itemsWithOrganizerId,
        pagination: ApiFeatures.getPaginationInfo(pageNum, limitNum, totalItems),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedEvents = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();
    const events = await Event.find({ date: { $gte: now } })
      .populate("organizer", "_id name")
      .sort({ date: 1 })
      .limit(4)
      .lean();

    const items = events.map((item: any) => ({
      ...item,
      organizerId: item.organizer?._id?.toString() || item.organizer?.toString(),
    }));

    res.json({
      success: true,
      message: "Featured events fetched successfully",
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "_id name email")
      .populate({
        path: "reviews",
        populate: { path: "user", select: "_id name" },
        options: { sort: { createdAt: -1 } },
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const eventObj = event.toJSON();

    const enrichedEvent = {
      ...eventObj,
      organizerId: (eventObj.organizer as any)?._id?.toString() || "",
      organizerName: (eventObj.organizer as any)?.name || "",
      time: "",
      reviews: (eventObj.reviews || []).map((review: any) => ({
        ...review,
        userName: review.user?.name || "",
        date: review.createdAt,
      })),
    };

    res.json({
      success: true,
      message: "Event fetched successfully",
      data: { event: enrichedEvent },
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      shortDescription,
      fullDescription,
      date,
      location,
      price,
      category,
      capacity,
      images,
    } = req.body;

    const event = await Event.create({
      title,
      shortDescription,
      fullDescription,
      date,
      location,
      price,
      category,
      capacity,
      images,
      organizer: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: {
        event: {
          _id: event._id.toString(),
          title: event.title,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      req.user!.role !== "admin" &&
      event.organizer.toString() !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("organizer", "_id name email");

    res.json({
      success: true,
      message: "Event updated successfully",
      data: { event: updatedEvent },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (
      req.user!.role !== "admin" &&
      event.organizer.toString() !== req.user!.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await Review.deleteMany({ event: req.params.id });
    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Event deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const related = await Event.find({
      category: event.category,
      _id: { $ne: event._id },
    })
      .populate("organizer", "_id name")
      .sort({ date: 1 })
      .limit(4)
      .lean();

    const items = related.map((item: any) => ({
      ...item,
      organizerId: item.organizer?._id?.toString() || item.organizer?.toString(),
    }));

    res.json({
      success: true,
      message: "Related events fetched successfully",
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};
