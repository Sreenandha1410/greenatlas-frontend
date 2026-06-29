import { useState } from 'react';
import { uploadImage } from '../api';

export default function ImageUpload({ onUploaded, label = 'Upload Image' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadImage(formData);
      console.log('Upload response:', res.data);
      onUploaded(res.data.url);
    } catch (err) {
      console.log('Upload error:', err);
      alert('Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label className="cursor-pointer inline-flex items-center gap-2 btn-primary text-sm"
        style={{ marginBottom: '0.5rem' }}>
        {uploading ? '⏳ Uploading…' : `📁 ${label}`}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      {preview && !uploading && (
        <div style={{ marginTop: '0.5rem' }}>
          <img src={preview} alt="preview"
            style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />
        </div>
      )}
    </div>
  );
}