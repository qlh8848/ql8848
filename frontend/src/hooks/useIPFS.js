import { useState } from 'react';
import axios from 'axios';
import { PINATA_CONFIG, IPFS_GATEWAY, IPFS_GATEWAY_FALLBACK } from '../config/contracts';

export function useIPFS() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadToIPFS = async (file) => {
    if (!file) throw new Error('No file provided');

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          app: 'MathBounty',
          type: file.type,
          timestamp: Date.now().toString(),
        },
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({ cidVersion: 1 });
      formData.append('pinataOptions', options);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            Authorization: `Bearer ${PINATA_CONFIG.jwt}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      const ipfsHash = response.data.IpfsHash;
      return ipfsHash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload to IPFS: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getIPFSUrl = (hash) => {
    if (!hash) return '';
    if (hash.startsWith('http')) return hash;
    return `${IPFS_GATEWAY}${hash}`;
  };

  const getIPFSUrlFallback = (hash) => {
    if (!hash) return '';
    return `${IPFS_GATEWAY_FALLBACK}${hash}`;
  };

  return {
    uploadToIPFS,
    getIPFSUrl,
    getIPFSUrlFallback,
    uploading,
    uploadProgress,
  };
}
