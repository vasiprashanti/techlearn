import React, { useState, useEffect } from 'react';
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiLock,
  FiCamera,
} from 'react-icons/fi';
import { useUser } from '../../context/UserContext';

const AVATAR_COUNT = 8;
const AVATAR_PATH = '/profile_avatars';

const Profile = () => {
  const { user, isLoading, updateUser } = useUser();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoUrl || `${AVATAR_PATH}/avatar1.png`);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);

  useEffect(() => {
    if (user?.photoUrl) {
      setSelectedAvatar(user.photoUrl);
    }
  }, [user?.photoUrl]);

  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    updateUser({ photoUrl: avatarUrl });
    setIsSelectingAvatar(false);
  };

  const renderAvatarChoices = () => (
    <div className="flex flex-wrap justify-center gap-6 mt-4">
      {Array.from({ length: AVATAR_COUNT }, (_, i) => {
        const avatarUrl = `${AVATAR_PATH}/avatar${i + 1}.png`;
        const isSelected = avatarUrl === selectedAvatar;

        return (
          <button
            type="button"
            key={i}
            onClick={() => handleAvatarSelect(avatarUrl)}
            className={`rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ${
              isSelected ? "ring-4 ring-blue-500 shadow-lg scale-110" : "hover:ring-2 hover:ring-blue-300 hover:scale-105"
            }`}
            style={{ padding: 0, background: "none" }}
            aria-label={`Select avatar ${i + 1}`}
          >
            <img
              src={avatarUrl}
              alt={`Avatar ${i + 1}`}
              className="w-24 h-24 rounded-full object-cover select-none"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-32 pb-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Profile Info */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
            Profile Information
          </h1>

          {/* Basic Info */}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </p>
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

          {/* Account Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              Account Info
            </h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <FiUser className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Username
                  </p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    {user?.username || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <FiLock className="text-gray-500 dark:text-gray-400 mr-4 text-xl" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Password
                  </p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    ••••••••
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Picture and Avatar Picker */}
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 flex flex-col items-center">
          <div className="relative mb-6 flex flex-col items-center">
            <img
              src={selectedAvatar}
              alt="Avatar"
              className="w-48 h-48 rounded-full object-cover ring-4 ring-blue-500 shadow-xl mb-2"
            />
            <button
              onClick={() => setIsSelectingAvatar(!isSelectingAvatar)}
              className="absolute bottom-6 right-6 md:right-3 bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
              title="Change Avatar"
            >
              <FiCamera className="text-2xl" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
            {user?.firstName || "User"} {user?.lastName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {user?.email || "No email provided"}
          </p>

          {/* Avatar Selection Overlay */}
          {isSelectingAvatar && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-xl flex flex-col items-center relative">
                <button
                  onClick={() => setIsSelectingAvatar(false)}
                  className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-2xl"
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">Select an Avatar</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Choose the image that best represents you:</p>
                {renderAvatarChoices()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;