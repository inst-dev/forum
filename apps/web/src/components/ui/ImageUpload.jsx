'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { BiImageAdd } from 'react-icons/bi';
import { clientApi } from '@/lib/api';

export function ImageUpload({ currentImage, onUpload, type = 'avatar', label = 'Upload Image' }) {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const data = await res.json();
      if (data.success) {
        onUpload?.(data.data.url);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const isAvatar = type === 'avatar';

  return (
    <div className="n8k2v8">
      <span className="n8k2v2">{label}</span>
      <div className="n8k2v9" onClick={() => fileRef.current?.click()}>
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
    </div>
  );
}
