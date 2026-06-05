import { Schema, model, Types } from "mongoose";

const collectionSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    description: String,
    itemIds: [
      {
        type: Types.ObjectId,
        ref: "LibraryItem",
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default model("Collection", collectionSchema);
