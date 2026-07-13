import { Schema, model, models, type InferSchemaType } from "mongoose";

// Mirror of Clerk — we don't own the auth record, only enough to attach a role.
const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    name: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof UserSchema> & { _id: Schema.Types.ObjectId };
export const UserModel = models.User || model("User", UserSchema);
