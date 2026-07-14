import { Request, Response, NextFunction } from "express";

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    next();
  };
};

export const requireOwnerOrAdmin = (
  getOwnerId: (req: Request) => string | Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (req.user.role === "admin") {
      return next();
    }

    try {
      const ownerId = await getOwnerId(req);
      if (req.user.id === ownerId) {
        return next();
      }
    } catch {
      // Owner lookup failed
    }

    res.status(403).json({
      success: false,
      message: "Not authorized",
    });
  };
};
