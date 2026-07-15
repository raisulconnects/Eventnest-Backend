import { Schema, model, InferSchemaType } from "mongoose";

const contactSubmissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

export type ContactSubmissionDocument = InferSchemaType<typeof contactSubmissionSchema>;

const ContactSubmission = model("ContactSubmission", contactSubmissionSchema);

export default ContactSubmission;
