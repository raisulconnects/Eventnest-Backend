import { Request, Response, NextFunction } from "express";
import ContactSubmission from "../models/ContactSubmission";

export const createContactSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, subject, message } = req.body;

    const submission = await ContactSubmission.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllContactSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const items = await ContactSubmission.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      message: "Contact submissions fetched successfully",
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContactSubmission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const submission = await ContactSubmission.findByIdAndDelete(id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    res.json({
      success: true,
      message: "Contact submission deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
