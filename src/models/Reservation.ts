import { Schema, model, InferSchemaType } from "mongoose";

const reservationSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    attendees: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1,
    },
  },
  { timestamps: true }
);

reservationSchema.index({ event: 1, user: 1 }, { unique: true });
reservationSchema.index({ event: 1, status: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;

const Reservation = model("Reservation", reservationSchema);
export default Reservation;
