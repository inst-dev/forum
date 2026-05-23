'use client';

import { useState, useRef } from 'react';
import { BiImageAdd } from 'react-icons/bi';
import { toast } from 'sonner';

export function ImageUpload({ currentImage, onUpload, type = 'avatar', label = 'Upload Image' }) {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.error?.message || `Upload failed (${res.status})`);
        setPreview(currentImage || null);
        setUploading(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.data?.url) {
        onUpload?.(data.data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Upload failed: no URL returned');
        setPreview(currentImage || null);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please try again.');
      setPreview(currentImage || null);
    }
    setUploading(false);
  };

  const isAvatar = type === 'avatar';

  return (
    <div className="n8k2v8">
      <span className="n8k2v2">{label}</span>
      <div className="n8k2v9" onClick={() => !uploading && fileRef.current?.click()} style={{ opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : undefined }}>
        {preview ? (
          <img
            src={preview}
            alt=""
            className={isAvatar ? 'n8k2va' : 'n8k2vb'}
          />
        ) : (
          <div className={`n8k2vc ${isAvatar ? 'n8k2va' : 'n8k2vb'}`}>
            <BiImageAdd size={24} />
            <span>{uploading ? 'Uploading...' : 'Click to upload'}</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      {uploading && <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Uploading...</span>}
    </div>
  );
}
