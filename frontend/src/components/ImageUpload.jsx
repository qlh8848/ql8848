import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { useIPFS } from '../hooks/useIPFS';

export default function ImageUpload({ onUploadComplete, label = '上传图片' }) {
  const [preview, setPreview] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const { uploadToIPFS, uploading, uploadProgress } = useIPFS();

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to IPFS
    try {
      const hash = await uploadToIPFS(file);
      setIpfsHash(hash);
      onUploadComplete?.(hash);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上传失败: ' + err.message);
    }
  }, [uploadToIPFS, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: uploading,
  });

  const clearUpload = () => {
    setPreview(null);
    setIpfsHash('');
    onUploadComplete?.('');
  };

  if (preview && ipfsHash) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle size={12} /> 已上传
            </span>
            <button
              onClick={clearUpload}
              className="bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-1.5 truncate">
            IPFS: {ipfsHash}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
        } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-primary-500 animate-spin" />
            <p className="text-sm text-gray-600">上传中... {uploadProgress}%</p>
            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={32} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? '释放以上传' : '拖拽图片到此处'}
              </p>
              <p className="text-xs text-gray-400 mt-1">或点击选择文件 (PNG, JPG, GIF, 最大10MB)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
