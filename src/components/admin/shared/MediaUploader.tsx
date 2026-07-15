"use client";

import * as React from "react";
import { apiFetch } from "@/lib/admin/apiFetch";
import { validateMediaFile } from "./fileValidation";

interface SignedParams {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string[];
}

type FileStatus =
  | { state: "idle" }
  | { state: "uploading"; progress: number }
  | { state: "done" }
  | { state: "error"; message: string };

interface FileEntry {
  file: File;
  status: FileStatus;
  id: string;
}

interface MediaUploaderProps {
  folder: "products" | "creator" | "banners";
  max?: number;
  onUpload: (result: { publicId: string; url: string }) => void;
}

export function MediaUploader({ folder, max, onUpload }: MediaUploaderProps) {
  const [entries, setEntries] = React.useState<FileEntry[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function updateEntry(id: string, status: FileStatus) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e)),
    );
  }

  async function uploadFile(entry: FileEntry) {
    updateEntry(entry.id, { state: "uploading", progress: 0 });

    let params: SignedParams;
    try {
      params = await apiFetch<SignedParams>("/api/admin/uploads/sign", {
        method: "POST",
        body: JSON.stringify({ folder }),
      });
    } catch (err) {
      updateEntry(entry.id, {
        state: "error",
        message: (err as Error).message,
      });
      return;
    }

    const fd = new FormData();
    fd.append("file", entry.file);
    fd.append("api_key", params.apiKey);
    fd.append("timestamp", String(params.timestamp));
    fd.append("signature", params.signature);
    fd.append("folder", params.folder);
    fd.append("allowed_formats", params.allowedFormats.join(","));

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        updateEntry(entry.id, {
          state: "uploading",
          progress: Math.round((e.loaded / e.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText) as {
          public_id: string;
          secure_url: string;
        };
        updateEntry(entry.id, { state: "done" });
        onUpload({ publicId: data.public_id, url: data.secure_url });
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
          if (body.error?.message) msg = body.error.message;
        } catch {
          // ignore parse error
        }
        updateEntry(entry.id, { state: "error", message: msg });
      }
    };

    xhr.onerror = () => {
      updateEntry(entry.id, {
        state: "error",
        message: "Network error during upload",
      });
    };

    xhr.send(fd);
  }

  function handleFiles(files: FileList) {
    const available = max != null ? max - entries.length : Infinity;
    const toProcess = Array.from(files).slice(0, available);

    const newEntries: FileEntry[] = [];

    for (const file of toProcess) {
      const validation = validateMediaFile(file);
      const id = `${Date.now()}-${Math.random()}`;
      if (!validation.ok) {
        newEntries.push({
          file,
          id,
          status: { state: "error", message: validation.error },
        });
      } else {
        newEntries.push({ file, id, status: { state: "idle" } });
      }
    }

    setEntries((prev) => [...prev, ...newEntries]);

    // kick off uploads for valid files
    for (const entry of newEntries) {
      if (entry.status.state === "idle") {
        uploadFile(entry);
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // reset input so the same file can be re-selected after an error
      e.target.value = "";
    }
  }

  const atMax = max != null && entries.length >= max;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
      <button
        type="button"
        disabled={atMax}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center rounded-md border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
      >
        {atMax ? `Maximum ${max} file(s) reached` : "Click to select images"}
      </button>

      {entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-foreground">
                {entry.file.name}
              </span>
              <FileStatusDisplay
                status={entry.status}
                onRetry={() => uploadFile(entry)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileStatusDisplay({
  status,
  onRetry,
}: {
  status: FileStatus;
  onRetry: () => void;
}) {
  if (status.state === "idle") return null;

  if (status.state === "uploading") {
    return (
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
          <span
            className="block h-full rounded-full bg-primary transition-all"
            style={{ width: `${status.progress}%` }}
          />
        </span>
        <span>{status.progress}%</span>
      </span>
    );
  }

  if (status.state === "done") {
    return (
      <span className="text-[oklch(0.3_0.12_145)]">✓ Uploaded</span>
    );
  }

  // error
  return (
    <span className="flex items-center gap-2">
      <span className="text-destructive">{status.message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
      >
        Retry
      </button>
    </span>
  );
}
