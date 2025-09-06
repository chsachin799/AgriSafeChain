import uploadToCloudinary from '../utils/cloudinaryUpload';

const handleUpload = async (file) => {
  const imageUrl = await uploadToCloudinary(file);
  if (imageUrl) {
    // Use imageUrl in your QR code or viewer route
    console.log('Uploaded image URL:', imageUrl);
  }
};
