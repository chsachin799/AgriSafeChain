import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { app } from "../firebase"; // adjust path if needed

// Use environment variables (create .env with these keys in project root)
// REACT_APP_APP_ID (optional) and REACT_APP_FIREBASE_CONFIG (JSON string)
const appId = process.env.REACT_APP_APP_ID || 'default-app-id';
const firebaseConfig = (() => {
  try {
    return process.env.REACT_APP_FIREBASE_CONFIG
      ? JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG)
      : {};
  } catch (err) {
    console.error('Invalid REACT_APP_FIREBASE_CONFIG JSON:', err);
    return {};
  }
})();

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: '',
    address: '',
    bio: '',
    profilePhotoUrl: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [db, setDb] = useState(null);
  const [storage, setStorage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null); // Reference for the hidden file input

  // Initialize Firebase
  useEffect(() => {
    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
      console.warn('Firebase config not provided. Profile will run in offline mode.');
      setLoading(false);
      return;
    }

    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const auth = getAuth(app);
      const firebaseStorage = getStorage(app);
      setDb(firestoreDb);
      setStorage(firebaseStorage);

      const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
          setUserId(authUser.uid);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            setUserId(credential.user.uid);
          } catch (err) {
            console.error('Firebase anonymous auth failed:', err);
            setLoading(false);
          }
        }
      });

      return () => {
        unsubscribeAuth();
      };
    } catch (err) {
      console.error('Firebase initialization failed:', err);
      setLoading(false);
    }
  }, []);

  // Listen for profile document changes
  useEffect(() => {
    if (!db || !userId) return;

    const userProfileDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');

    const unsubscribe = onSnapshot(
      userProfileDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData((prev) => ({ ...prev, ...data }));
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, userId]);

  const handleSave = async () => {
    if (!db || !userId) return;
    setLoading(true);

    try {
      let photoUrl = profileData.profilePhotoUrl;

      // Handle file upload if a new file is selected
      if (selectedFile) {
        const storageRef = ref(storage, `users/${userId}/profilePhoto.jpg`);
        await uploadBytes(storageRef, selectedFile);
        photoUrl = await getDownloadURL(storageRef);
      }

      const userProfileDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
      await setDoc(userProfileDocRef, { ...profileData, profilePhotoUrl: photoUrl }, { merge: true });
      setIsEditing(false);
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (error) {
      console.error('Failed to save profile data or upload photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploadClick = () => {
    // Trigger the hidden file input's click event
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a local URL for instant preview
      setProfileData({ ...profileData, profilePhotoUrl: URL.createObjectURL(file) });
    }
  };

  // Canvas background animation (unchanged)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    const particles = [];
    const particleCount = 50;
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = '#B2F5EA';
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const createParticles = () => {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    createParticles();
    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-teal-800 dark:text-emerald-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        <span className="ml-4">Loading profile...</span>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ').filter((p) => p.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800"
      />
      <div className="relative z-10 flex flex-col items-center justify-center p-8 min-h-screen">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-transform duration-500 hover:scale-105">
          <h1 className="text-4xl font-extrabold mb-8 text-center text-teal-800 dark:text-emerald-300">
            My Profile
          </h1>

          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-teal-500 dark:border-emerald-400 shadow-lg mb-4">
              <img
                src={
                  profileData.profilePhotoUrl ||
                  `https://placehold.co/128x128/D1FAE5/065F46?text=${getInitials(profileData.name)}`
                }
                alt="Profile"
                className="w-full h-full object-cover transition-transform duration-300 transform hover:scale-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/128x128/D1FAE5/065F46?text=${getInitials(profileData.name)}`;
                }}
              />
            </div>
            
            {isEditing && (
              <>
                <button
                  onClick={handlePhotoUploadClick}
                  className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform duration-300 transform hover:scale-105"
                >
                  Upload Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>

          <div className="space-y-4">
            {Object.entries(profileData).map(([key, value]) => {
              if (key === 'profilePhotoUrl') return null;
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} className="flex flex-col md:flex-row md:items-center">
                  <span className="font-semibold w-32 text-gray-700 dark:text-gray-300 mb-2 md:mb-0">
                    {label}:
                  </span>
                  {isEditing ? (
                    <input
                      type={key === 'mobile' ? 'tel' : 'text'}
                      value={value}
                      onChange={(e) => setProfileData({ ...profileData, [key]: e.target.value })}
                      className="flex-1 p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder={`Enter your ${key}`}
                    />
                  ) : (
                    <span className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                      {value || 'Not provided'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8 space-x-4">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;