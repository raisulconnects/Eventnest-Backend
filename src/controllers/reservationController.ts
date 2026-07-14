import { Request, Response, NextFunction } from "express";
import Reservation from "../models/Reservation";
import Event from "../models/Event";

export const createReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { attendees } = req.body;
    const eventId = req.params.eventId as string;

    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (new Date(event.date) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot reserve for past events" });
    }

    const existing = await Reservation.findOne({
      event: eventId,
      user: req.user!.id,
      status: "confirmed",
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a reservation for this event",
      });
    }

    if ((event.attendeeCount || 0) + attendees > event.capacity) {
      return res.status(400).json({
        success: false,
        message: "Not enough capacity available",
      });
    }

    const reservation = await Reservation.create({
      event: eventId,
      user: req.user!.id,
      attendees,
    });

    await Event.findByIdAndUpdate(eventId, {
      $inc: { attendeeCount: attendees },
    });

    res.status(201).json({
      success: true,
      message: "Reservation confirmed",
      data: {
        reservation: {
          _id: reservation._id.toString(),
          event: reservation.event.toString(),
          status: reservation.status,
          attendees: reservation.attendees,
          createdAt: reservation.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;

    const reservation = await Reservation.findOne({
      event: eventId,
      user: req.user!.id,
      status: "confirmed",
    });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "No active reservation found for this event",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    await Event.findByIdAndUpdate(eventId, {
      $inc: { attendeeCount: -reservation.attendees },
    });

    res.json({
      success: true,
      message: "Reservation cancelled",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;

    const reservation = await Reservation.findOne({
      event: eventId,
      user: req.user!.id,
    }).sort({ createdAt: -1 });

    const hasReserved = reservation?.status === "confirmed";

    res.json({
      success: true,
      message: "Reservation status fetched",
      data: {
        hasReserved,
        reservation: reservation
          ? {
              _id: reservation._id.toString(),
              status: reservation.status,
              attendees: reservation.attendees,
              createdAt: reservation.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservations = await Reservation.find({
      user: req.user!.id,
      status: "confirmed",
    })
      .populate("event", "_id title date location images")
      .sort({ createdAt: -1 });

    const items = reservations.map((r) => ({
      _id: r._id.toString(),
      event: {
        _id: (r.event as any)?._id?.toString() || "",
        title: (r.event as any)?.title || "",
        date: (r.event as any)?.date || "",
        location: (r.event as any)?.location || "",
        images: (r.event as any)?.images || [],
      },
      status: r.status,
      attendees: r.attendees,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      message: "Reservations fetched successfully",
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const eventId = req.params.eventId as string;

    const event = await Event.findById(eventId).select("capacity attendeeCount");
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    res.json({
      success: true,
      message: "Attendee count fetched",
      data: {
        attendeeCount: event.attendeeCount || 0,
        capacity: event.capacity,
      },
    });
  } catch (error) {
    next(error);
  }
};
