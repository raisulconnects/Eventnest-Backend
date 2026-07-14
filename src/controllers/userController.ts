import { Request, Response, NextFunction } from "express";
import Event from "../models/Event";
import User from "../models/User";

export const getCurrentUserEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter: any = {};

    if (req.user!.role !== "admin") {
      filter.organizer = req.user!.id;
    }

    const events = await Event.find(filter)
      .populate("organizer", "_id name")
      .sort({ createdAt: -1 })
      .lean();

    const items = events.map((item: any) => ({
      ...item,
      organizerId:
        item.organizer?._id?.toString() || item.organizer?.toString(),
    }));

    res.json({
      success: true,
      message: "User events fetched successfully",
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      success: true,
      message: "Users fetched successfully",
      data: {
        items: users.map((user) => ({
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
