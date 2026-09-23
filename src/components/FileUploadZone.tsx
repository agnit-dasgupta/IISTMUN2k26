/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Link2,
  ExternalLink
} from "lucide-react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface FileUploadZoneProps {
  label: string;
  sublabel?: string;
  accept?: string;
  maxSizeMB?: number;
  fileType: "image" | "document";
  valueUrl?: string;
  valueName?: string;
  required?: boolean;
  onChange: (url: string, name: string) => void;
  onClear: () => void;
  error?: string;
}

/**
 * Reads a File object and optimizes images via canvas for instantaneous upload & compact storage.
 * - Passport photos are resized to max 450x450 at 0.65 JPEG quality (~15-25 KB).
 * - Scanned document images are resized to max 900x900 at 0.70 JPEG quality (~50-80 KB).
 * - PDFs and Word documents are read directly.
 */
async function readFileAsOptimizedData(file: File, fileType: "image" | "document"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read selected file"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const isImg = file.type.startsWith("image/");
      if (!isImg) {
        return resolve(dataUrl);
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          const maxDim = fileType === "image" ? 450 : 900;
          const quality = fileType === "image" ? 0.65 : 0.70;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function FileUploadZone({
  label,
  sublabel,
  accept,
  maxSizeMB = 10,
  fileType,
  valueUrl,
  valueName,
  required = false,
  onChange,
  onClear,
  error
}: FileUploadZoneProps) {
  const [activeMode, setActiveMode] = useState<"file" | "link">("file");
  const [cloudLinkInput, setCloudLinkInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    setUploadWarning(null);

    // Validate file size (maxSizeMB)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is ${maxSizeMB}MB.`);
      return;
    }

    // Validate image format
    if (fileType === "image" && !file.type.startsWith("image/")) {
      setUploadError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // 1. Read & optimize file data
      setUploadProgress(45);
      const fileData = await readFileAsOptimizedData(file, fileType);
      let finalUrl = fileData;
      setUploadProgress(70);

      let uploadedToServer = false;

      // 2. Try POST /api/upload
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileData: fileData
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resJson = await response.json();
          if (resJson.url) {
            finalUrl = resJson.url;
            uploadedToServer = true;
          }
        }
      } catch (uploadErr) {
        // Server endpoint not reachable or running on static hosting; fallback to fileData
      }

      // 3. Try Firebase Cloud Storage if /api/upload was not reachable
      if (!uploadedToServer && storage && storage.app?.options?.storageBucket) {
        try {
          const uniqueName = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const storageRef = ref(storage, uniqueName);
          const uploadPromise = uploadBytes(storageRef, file);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 3000)
          );
          const snap = await Promise.race([uploadPromise, timeoutPromise]);
          const dlUrl = await getDownloadURL((snap as any).ref);
          if (dlUrl) {
            finalUrl = dlUrl;
            uploadedToServer = true;
          }
        } catch {
          // Cloud storage not enabled or offline; fallback to fileData
        }
      }

      // 4. ALWAYS accept the file and call onChange!
      setUploadProgress(100);
      onChange(finalUrl, file.name);

      // 5. Informational warning only if a large PDF (> 800KB) is using in-memory Base64
      if (!uploadedToServer && file.size > 800 * 1024) {
        setUploadWarning(
          `Notice: File is ${(file.size / 1024 / 1024).toFixed(1)}MB. If form submission reports a size limit, please compress your PDF (<750KB) or provide a Google Drive link.`
        );
      }
    } catch (err: any) {
      console.error("Error processing file:", err);
      setUploadError(err.message || "Failed to process file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplyCloudLink = (e: React.FormEvent) => {
    e.preventDefault();
    const link = cloudLinkInput.trim();
    if (!link) {
      setUploadError("Please enter a valid URL.");
      return;
    }
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      setUploadError("Please include http:// or https:// in the link.");
      return;
    }

    setUploadError(null);
    let displayName = "Cloud Attachment";
    try {
      const urlObj = new URL(link);
      displayName = `${urlObj.hostname.replace("www.", "")} link`;
    } catch {
      // ignore
    }

    onChange(link, displayName);
    setCloudLinkInput("");
  };

  const isCloudLink = valueUrl && (valueUrl.startsWith("http://") || valueUrl.startsWith("https://")) && !valueUrl.startsWith("data:");

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium flex items-center gap-1.5">
          {fileType === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>

        {/* Optional Mode Selector for Documents */}
        {!valueUrl && fileType === "document" && (
          <div className="flex items-center gap-1 border border-[#8A9A7E]/30 bg-[#1A1F1A] p-0.5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => { setActiveMode("file"); setUploadError(null); }}
              className={`px-2 py-0.5 transition-colors cursor-pointer ${
                activeMode === "file"
                  ? "bg-[#C9A86A] text-[#1A1F1A] font-bold"
                  : "text-[#8A9A7E] hover:text-[#EDE6D3]"
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode("link"); setUploadError(null); }}
              className={`px-2 py-0.5 transition-colors cursor-pointer flex items-center gap-1 ${
                activeMode === "link"
                  ? "bg-[#C9A86A] text-[#1A1F1A] font-bold"
                  : "text-[#8A9A7E] hover:text-[#EDE6D3]"
              }`}
            >
              <Link2 className="h-2.5 w-2.5" />
              <span>Or Drive Link</span>
            </button>
          </div>
        )}

        {sublabel && !valueUrl && activeMode === "file" && (
          <span className="font-mono text-[10px] text-[#8A9A7E]">
            {sublabel}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept || (fileType === "image" ? "image/*" : ".pdf,.doc,.docx")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploaded state preview */}
      {valueUrl ? (
        <div className="relative border border-[#C9A86A]/60 bg-[#2E3B2F]/40 p-3.5 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            {fileType === "image" && !isCloudLink ? (
              <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden border border-[#C9A86A]/40 bg-[#1A1F1A]">
                <img
                  src={valueUrl}
                  alt={valueName || "Uploaded Photo"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : isCloudLink ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#C9A86A]">
                <ExternalLink className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-[#C9A86A]/40 bg-[#1A1F1A] text-[#C9A86A]">
                <FileText className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-sans text-xs text-[#EDE6D3] font-medium truncate block">
                  {valueName || (fileType === "image" ? "Photograph Attached" : "Document Attached")}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#8A9A7E] block mt-0.5 truncate">
                {isCloudLink ? valueUrl : "Ready for submission • Click remove to replace"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-[#8A9A7E] hover:text-rose-400 hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-500/30 cursor-pointer"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : activeMode === "link" ? (
        /* Cloud Link Input Field */
        <div className="border border-[#C9A86A]/40 bg-[#1A1F1A] p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#EDE6D3]">
            <Link2 className="h-4 w-4 text-[#C9A86A] shrink-0" />
            <span>Paste Google Drive, OneDrive, or Dropbox Public Link:</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={cloudLinkInput}
              onChange={(e) => setCloudLinkInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="flex-1 bg-[#2E3B2F]/60 border border-[#8A9A7E]/30 px-3 py-2 text-xs text-[#EDE6D3] focus:border-[#C9A86A] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCloudLink}
              className="px-3.5 py-2 bg-[#C9A86A] hover:bg-[#dfbe7e] text-[#1A1F1A] font-sans font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Attach Link
            </button>
          </div>
          <span className="text-[10px] font-mono text-[#8A9A7E] block">
            Note: Ensure link sharing permission is set to "Anyone with the link can view".
          </span>
        </div>
      ) : (
        /* Drag & Drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? "border-[#C9A86A] bg-[#C9A86A]/10 scale-[1.01]"
              : error || uploadError
              ? "border-rose-500/60 bg-rose-950/10 hover:border-rose-400"
              : "border-[#C9A86A]/30 hover:border-[#C9A86A]/80 bg-[#1A1F1A]/70 hover:bg-[#2E3B2F]/30"
          }`}
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-7 w-7 text-[#C9A86A] animate-spin" />
              <span className="font-sans text-xs text-[#EDE6D3] font-medium">
                Uploading & Processing File... {uploadProgress}%
              </span>
              <div className="w-48 h-1 bg-[#1A1F1A] rounded-full overflow-hidden border border-[#C9A86A]/30">
                <div
                  className="h-full bg-[#C9A86A] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2E3B2F]/60 border border-[#C9A86A]/40 text-[#C9A86A]">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <span className="font-sans text-xs text-[#EDE6D3] font-medium block">
                  Click to browse or drag & drop {fileType === "image" ? "photo" : "file"} here
                </span>
                <span className="font-sans text-[11px] text-[#8A9A7E] block">
                  {fileType === "image"
                    ? "Supports JPG, PNG, WEBP (Auto-optimized)"
                    : "Supports PDF, DOC, DOCX, Images (Max 10MB)"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {(uploadError || error) && (
        <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {uploadWarning && !uploadError && (
        <div className="flex items-center gap-1.5 text-amber-300 text-xs mt-1 bg-amber-950/20 p-2 border border-amber-500/30">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span>{uploadWarning}</span>
        </div>
      )}
    </div>
  );
}
