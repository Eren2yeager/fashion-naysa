import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "@/lib/env";

let configured = false;
function ensure() {
  if (configured) return cloudinary;
  const e = getEnv();
  cloudinary.config({
    cloud_name: e.CLOUDINARY_CLOUD_NAME,
    api_key: e.CLOUDINARY_API_KEY,
    api_secret: e.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  return cloudinary;
}

export function signUpload(params: {
  folder: string;
  eager?: { width: number; height: number; crop: "fill" | "fit" }[];
}) {
  const ts = Math.floor(Date.now() / 1000);
  const e = getEnv();
  const signature = ensure().utils.api_sign_request(
    { ...params, timestamp: ts },
    e.CLOUDINARY_API_SECRET,
  );
  return {
    cloudName: e.CLOUDINARY_CLOUD_NAME,
    apiKey: e.CLOUDINARY_API_KEY,
    timestamp: ts,
    signature,
    folder: params.folder,
    eager: params.eager,
  };
}

export async function destroy(publicId: string) {
  ensure();
  return cloudinary.uploader.destroy(publicId);
}

export function transformUrl(publicId: string, transforms: string) {
  const e = getEnv();
  return `https://res.cloudinary.com/${e.CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}
