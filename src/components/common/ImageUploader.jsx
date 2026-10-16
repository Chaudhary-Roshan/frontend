import { MediaImage } from './AuthenticatedMedia';
import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle, FileText, Loader2, Camera } from 'lucide-react';
import { uploadFileToServer, uploadFilesToServer } from '../../utils/fileUpload';
import { getMediaUrl, handleImageError } from '../../utils/media';

/**
 * Universal Image & Document Uploader for DSMS
 * Allows direct selection from PC Local Storage, Mobile Photo Gallery, or Camera.
 * 
 * Props:
 * - value: Current single image/document URL string (for single mode)
 * - onChange: (url: string) => void (for single mode)
 * - onBulkUpload: (urls: string[]) => void (for bulk mode)
 * - isBulk: boolean (true for selecting multiple files at once)
 * - acceptDocs: boolean (true if PDFs are accepted in addition to images)
 * - label: string
 * - hint: string
 * - heightClass: string (e.g. 'h-40', 'h-28')
 * - roundedClass: string (e.g. 'rounded-2xl')
 * - shape: 'banner' | 'avatar' | 'card' | 'document'
 */
const ImageUploader = ({
  value,
  onChange,
  onBulkUpload,
  isBulk = false,
  acceptDocs = false,
  folder = '',
  label = "Upload Image",
  hint = "Click to browse device gallery, PC storage, or take a photo",
  shape = 'banner' // 'banner', 'avatar', 'document'
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [bulkFiles, setBulkFiles] = useState([]); // Array of { file, previewUrl, name, size }

  const acceptTypes = acceptDocs 
    ? "image/*,application/pdf" 
    : "image/*";

  // Handle single file selection with instant local blob preview
  const handleSingleFile = async (file) => {
    if (!file) return;
    if (file.type && file.type.startsWith('image/')) {
      const blobUrl = URL.createObjectURL(file);
      setLocalPreview(blobUrl);
    }
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadFileToServer(file, folder);
      if (onChange) onChange(uploadedUrl);
    } catch (err) {
      console.error("Single file upload error:", err);
      alert("Failed to process image file. Please try again.");
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle bulk file selection
  const handleBulkFiles = async (fileList) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    // Create temporary object URLs for instant thumbnail previews
    const newItems = filesArray.map(f => ({
      file: f,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2)
    }));

    const combined = [...bulkFiles, ...newItems];
    setBulkFiles(combined);

    // Upload files to server
    setIsUploading(true);
    try {
      const urls = await uploadFilesToServer(filesArray, folder);
      if (onBulkUpload) onBulkUpload(urls);
    } catch (err) {
      console.error("Bulk upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isBulk) {
      handleBulkFiles(e.target.files);
    } else {
      handleSingleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isBulk) {
        handleBulkFiles(e.dataTransfer.files);
      } else {
        handleSingleFile(e.dataTransfer.files[0]);
      }
    }
  };

  const removeBulkItem = (index) => {
    const updated = bulkFiles.filter((_, i) => i !== index);
    setBulkFiles(updated);
  };

  /* ------------------- BULK UPLOAD VIEW ------------------- */
  if (isBulk) {
    return (
      <div className="space-y-3">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/60 shadow-inner' 
              : 'border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptTypes}
            onChange={onFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
              {isUploading ? (
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              ) : (
                <UploadCloud size={24} />
              )}
            </div>

            <div>
              <p className="text-xs font-black text-slate-800">
                {isUploading ? "Uploading photos from device..." : "Choose multiple photos from PC or Mobile Gallery"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Drag and drop files here, or tap to browse your local photo library
              </p>
            </div>

            <button
              type="button"
              className="mt-1 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 shadow-sm"
            >
              Select Images From Storage
            </button>
          </div>
        </div>

        {/* Selected Photos Thumbnails Grid */}
        {bulkFiles.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold px-1">
              <span>Selected Images ({bulkFiles.length}):</span>
              <button
                type="button"
                onClick={() => setBulkFiles([])}
                className="text-rose-600 hover:underline text-[10px]"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-100/50 rounded-2xl border border-slate-200">
              {bulkFiles.map((item, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-slate-200 border border-slate-300 shadow-xs">
                  {item.previewUrl ? (
                    <MediaImage src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-[9px] text-slate-600">
                      <FileText size={16} className="text-slate-400" />
                      <span className="truncate w-full text-center">{item.name}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBulkItem(idx);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] transition cursor-pointer"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate text-center">
                    {item.size} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleRemoveSingle = () => {
    setLocalPreview(null);
    if (onChange) onChange('');
  };

  /* ------------------- AVATAR / CIRCLE UPLOAD VIEW ------------------- */
  if (shape === 'avatar') {
    const avatarSrc = localPreview || value;
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
          </label>
        )}

        <div className="flex items-center gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-200 bg-slate-100 flex items-center justify-center cursor-pointer group shadow-sm shrink-0"
          >
            {avatarSrc ? (
              <img
                src={localPreview || getMediaUrl(value)}
                onError={handleImageError}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="text-slate-400" size={28} />
            )}

            <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} />
              <span className="text-[9px] font-bold mt-0.5">Change</span>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-indigo-900/80 text-white flex items-center justify-center">
                <Loader2 className="animate-spin" size={20} />
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              onChange={onFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <UploadCloud size={14} />
                {isUploading ? "Uploading..." : (avatarSrc ? "Change Photo" : "Upload from Gallery / PC")}
              </button>
              {avatarSrc && (
                <button
                  type="button"
                  onClick={handleRemoveSingle}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Remove photo"
                >
                  <X size={13} /> Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {hint}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------- BANNER / DOCUMENT / CARD UPLOAD VIEW ------------------- */
  const activeDisplaySrc = localPreview || value;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
          </label>
          {activeDisplaySrc && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle size={10} /> Selected
            </span>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={onFileChange}
        className="hidden"
      />

      {activeDisplaySrc ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group shadow-sm">
          {shape === 'document' && (value && (value.endsWith('.pdf') || !value.match(/\.(jpeg|jpg|gif|png|webp)/i))) ? (
            <div className="p-4 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <FileText className="text-indigo-600 shrink-0" size={20} />
                <span className="truncate max-w-xs">{value.split('/').pop()}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveSingle}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Remove"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative h-36 w-full bg-slate-900">
              <img
                src={localPreview || getMediaUrl(value)}
                onError={handleImageError}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Camera size={13} /> Change Image
                </button>
                <button
                  type="button"
                  onClick={handleRemoveSingle}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <X size={13} /> Remove
                </button>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-indigo-950/70 text-white flex flex-col items-center justify-center gap-1 z-10">
              <Loader2 className="animate-spin text-white" size={24} />
              <span className="text-xs font-bold">Processing image...</span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/70 shadow-inner' 
              : 'border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              {isUploading ? (
                <Loader2 className="animate-spin text-indigo-600" size={20} />
              ) : (
                <UploadCloud size={20} />
              )}
            </div>

            <div>
              <p className="text-xs font-black text-slate-800">
                {isUploading ? "Uploading file..." : "Click or Drag to Upload from PC / Mobile Gallery"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hint}
              </p>
            </div>

            <button
              type="button"
              className="mt-1 px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 shadow-xs"
            >
              Browse Local Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
