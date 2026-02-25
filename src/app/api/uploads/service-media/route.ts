import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getBearerTokenFromRequest, getJwtPayload } from "@/lib/auth";
import { requirePermission } from "@/lib/server-auth";

export const runtime = "nodejs";

type AuthPayload = { id: string; role: string };

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 60 * 1024 * 1024; // 60 MB

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Upload media error";

function getExtension(fileName: string, mimeType: string) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext) return ext;
  if (mimeType.startsWith("image/")) return ".jpg";
  if (mimeType.startsWith("video/")) return ".mp4";
  return "";
}

export async function POST(req: Request) {
  try {
    const token = getBearerTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = getJwtPayload(token) as AuthPayload | null;
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    await requirePermission(payload, "mechanic_notes_create");

    const form = await req.formData();
    const fileValue = form.get("file");
    if (!(fileValue instanceof File)) {
      return new Response(JSON.stringify({ error: "File wajib diisi" }), { status: 400 });
    }
    if (fileValue.size <= 0) {
      return new Response(JSON.stringify({ error: "File kosong" }), { status: 400 });
    }

    const mimeType = fileValue.type || "";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");
    if (!isImage && !isVideo) {
      return new Response(
        JSON.stringify({ error: "Tipe file tidak didukung. Gunakan gambar atau video." }),
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (fileValue.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: isImage
            ? "Ukuran gambar maksimal 10 MB"
            : "Ukuran video maksimal 60 MB",
        }),
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "service-live");
    await mkdir(uploadsDir, { recursive: true });

    const ext = getExtension(fileValue.name, mimeType);
    const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    const arrayBuffer = await fileValue.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const url = `/uploads/service-live/${fileName}`;
    return new Response(
      JSON.stringify({
        ok: true,
        url,
        mediaType: isImage ? "IMAGE" : "VIDEO",
        size: fileValue.size,
      }),
      { status: 201 }
    );
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), { status: 500 });
  }
}
