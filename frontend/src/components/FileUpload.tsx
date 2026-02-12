import { useState } from 'react';
import { showToast } from '../utils/toast';

interface FileUploadProps {
  type: 'profile' | 'idea';
  ideaId?: number;
  onUploadSuccess: (fileUrl: string | string[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

export default function FileUpload({
  type,
  ideaId,
  onUploadSuccess,
  multiple = false,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  maxSize = 10
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSizeBytes) {
        showToast.error(`File ${files[i].name} exceeds ${maxSize}MB limit`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      if (type === 'profile') {
        formData.append('profile', files[0]);
      } else if (type === 'idea' && ideaId) {
        for (let i = 0; i < files.length; i++) {
          formData.append('attachments', files[i]);
        }
      }

      const url = type === 'profile' 
        ? 'http://localhost:5000/api/upload/profile'
        : `http://localhost:5000/api/upload/idea/${ideaId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        showToast.success(data.message || 'File uploaded successfully');
        
        if (type === 'profile') {
          onUploadSuccess(data.fileUrl);
        } else {
          const urls = data.attachments.map((a: any) => a.file_url);
          onUploadSuccess(urls);
        }
      } else {
        const error = await response.json();
        showToast.error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Error uploading file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        multiple={multiple}
        accept={accept}
        className="hidden"
        id={`file-upload-${type}`}
      />
      <label
        htmlFor={`file-upload-${type}`}
        className={`inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-inter font-semibold cursor-pointer hover:bg-blue-700 transition ${
          isUploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
        ) : (
          <span>📁 {type === 'profile' ? 'Upload Image' : 'Upload Files'}</span>
        )}
      </label>
      {isUploading && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
