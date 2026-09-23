/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

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
 * Reads a File object and optimizes large images via canvas for instantaneous upload
 */
async function readFileAsOptimizedData(file: File, fileType: "image" | "document"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read selected file"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (fileType !== "image") {
        return resolve(dataUrl);
      }

      // If it's an image, optimize dimensions so it uploads instantaneously
      const img = new Image();
      img.onerror = () => resolve(dataUrl); // Fallback to raw dataUrl on any decode error
      img.onload = () => {
        try {
          const maxDim = 1200;
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
          resolve(canvas.toDataURL("image/jpeg", 0.88));
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
  maxSizeMB = 8,
  fileType,
  valueUrl,
  valueName,
  required = false,
  onChange,
  onClear,
  error
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`File is too large. Maximum allowed size is ${maxSizeMB}MB.`);
      return;
    }

    // Validate basic mime type
    if (fileType === "image" && !file.type.startsWith("image/")) {
      setUploadError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      // 1. Read & optimize file data
      setUploadProgress(40);
      const fileData = await readFileAsOptimizedData(file, fileType);
      setUploadProgress(70);

      // 2. Upload directly to /api/upload endpoint with 6s timeout
      let uploadedUrl = fileData;
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
            uploadedUrl = resJson.url;
          }
        }
      } catch (uploadErr) {
        console.warn("Server upload endpoint fallback used:", uploadErr);
        // uploadedUrl remains fileData (base64 data URL)
      }

      setUploadProgress(100);
      onChange(uploadedUrl, file.name);
    } catch (err: any) {
      console.error("Error processing file upload:", err);
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
    // Reset file input value so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between">
        <label className="font-sans text-xs uppercase tracking-wider text-[#C9A86A] font-medium flex items-center gap-1.5">
          {fileType === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>
        {sublabel && (
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
            {fileType === "image" ? (
              <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden border border-[#C9A86A]/40 bg-[#1A1F1A]">
                <img
                  src={valueUrl}
                  alt={valueName || "Uploaded Photo"}
                  className="h-full w-full object-cover"
                />
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
                  {valueName || (fileType === "image" ? "Photograph Uploaded" : "Document Attached")}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#8A9A7E] block mt-0.5">
                Ready for submission • Click remove to replace
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
                Uploading & Encoding File... {uploadProgress}%
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
                  Click to browse or drag & drop {fileType === "image" ? "photo" : "CV"} here
                </span>
                <span className="font-sans text-[11px] text-[#8A9A7E] block">
                  {fileType === "image"
                    ? "Supports JPG, PNG, WEBP (Max 8MB)"
                    : "Supports PDF, DOC, DOCX (Max 8MB)"}
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
    </div>
  );
}
