import { Schema, model, models, type InferSchemaType } from "mongoose";

// We don't own the auth record (Google does). Mirror just enough to attach a
// role and any app-specific fields. `accountId` is the Google `sub`.
const UserSchema = new Schema(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    name: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof UserSchema> & { _id: Schema.Types.ObjectId };
export const UserModel = models.User || model("User", UserSchema);
