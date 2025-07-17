import React, { useState } from 'react';
import { FiUser, FiMail, FiCalendar, FiLock, FiCamera } from 'react-icons/fi';
import { useUser } from '../../context/UserContext';

const Profile = () => {
  const { user, isLoading, updateUser } = useUser();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.photoUrl || null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
        // Here you would typically upload to your backend and update user context
        updateUser({ photoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
    setIsEditingPhoto(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-20 pb-12"> {/* Added pt-16 for top padding */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Profile Details (Read-only) */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Profile Information</h1>
          
          {/* Basic Info Section */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              Basic Info
            </h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <FiUser className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {user?.firstName || 'First'} {user?.lastName || 'Last'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FiCalendar className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {user?.dateOfBirth || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FiUser className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {user?.gender || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FiMail className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {user?.email || 'No email provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              Account Info
            </h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <FiUser className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {user?.username || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FiLock className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Password</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    ••••••••
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Photo */}
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 flex flex-col items-center">
          <div className="relative group mb-6">
            <div className="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-400">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsEditingPhoto(true)}
              className="absolute bottom-2 right-2 bg-blue-600 dark:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
            >
              <FiCamera className="text-xl" />
            </button>
            
            {isEditingPhoto && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl">
                  <label className="block text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <button 
                    onClick={() => setIsEditingPhoto(false)}
                    className="mt-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {user?.firstName || 'User'} {user?.lastName}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{user?.email || 'No email provided'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;