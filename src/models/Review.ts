import { Schema, model, InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ event: 1, user: 1 }, { unique: true });

export type ReviewDocument = InferSchemaType<typeof reviewSchema>;

const Review = model("Review", reviewSchema);
export default Review;
