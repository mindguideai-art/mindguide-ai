"use client";
import { createClient } from "@/lib/supabase/client";

export const MAX_IMAGE_MB = 15;

/**
 * Shrinks a photo in the browser before upload (longest side 2000px, JPEG 85%),
 * so the website stays fast and phone photos (often 5–10 MB) upload quickly on mobile data.
 */
export async function prepareImage(file: File, maxSide = 2000): Promise<{ blob: Blob; width: number; height: number; ext: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`“${file.name}” is larger than ${MAX_IMAGE_MB} MB.`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`“${file.name}” couldn't be read. HEIC photos from iPhone: please export as JPG first.`);
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
  // Small PNGs (logos, flyers with text) keep their quality.
  if (scale === 1 && file.size < 1.5 * 1024 * 1024 && /png|webp|jpeg/.test(file.type)) {
    return { blob: file, width, height, ext: file.type.split("/")[1].replace("jpeg", "jpg") };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new Error(`“${file.name}” couldn't be processed.`);
  return { blob, width, height, ext: "jpg" };
}

export async function uploadImage(bucket: "event-images" | "gallery", folder: string, file: File, maxSide?: number) {
  const img = await prepareImage(file, maxSide);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${img.ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, img.blob, { contentType: img.blob.type || "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("Upload failed. Check your connection and try again.");
  return { path, url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl, width: img.width, height: img.height };
}
