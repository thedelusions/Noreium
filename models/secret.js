import { Schema, model, Types } from "mongoose";
const secretSchema = new Schema(
  {
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    encryptedValue: String,
  },
  {
    timestamps: true,
  },
);

export default model("Secret", secretSchema);
