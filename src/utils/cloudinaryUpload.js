import axios from 'axios';

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'certificates_unsigned'); // your preset name

  const cloudName = 'your-cloud-name'; // replace with yours

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return res.data.secure_url;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
};

export default uploadToCloudinary;
