import { Schema, model, InferSchemaType } from "mongoose";

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 100,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 150,
    },
    fullDescription: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "DevOps",
        "AI/ML",
        "Web Development",
        "Mobile",
        "Cloud",
        "Security",
        "Other",
      ],
    },
    images: {
      type: [String],
      default: [],
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    capacity: {
      type: Number,
      default: 100,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ createdAt: -1 });

export type EventDocument = InferSchemaType<typeof eventSchema>;

const Event = model("Event", eventSchema);
export default Event;
