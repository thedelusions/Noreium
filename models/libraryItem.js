import { Schema, model, Types } from "mongoose";

const libraryItemSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: String,
    name: String,
    description: String,
    url: String,
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

export default model("LibraryItem", libraryItemSchema);
