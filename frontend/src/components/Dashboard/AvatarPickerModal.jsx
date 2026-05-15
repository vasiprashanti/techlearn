import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

const AVATAR_COUNT = 8;
const AVATAR_PATH = '/profile_avatars';

export default function AvatarPickerModal({
  isOpen,
  currentAvatar,
  onClose,
  onSave,
}) {
  const [pendingAvatar, setPendingAvatar] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setPendingAvatar(null);
    }
  }, [isOpen]);

  const resolvedCurrentAvatar = currentAvatar || `${AVATAR_PATH}/avatar1.png`;

  const avatars = useMemo(
    () => Array.from({ length: AVATAR_COUNT }, (_, index) => `${AVATAR_PATH}/avatar${index + 1}.png`),
    []
  );

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white/95 dark:bg-[#0a1128]/95 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl w-full max-w-2xl mx-4 relative z-10"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-black/50 dark:text-white/50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-8 mt-2">
              <h3 className="text-2xl font-medium text-black dark:text-white tracking-tight mb-2">
                Choose Your Avatar
              </h3>
              <p className="text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">
                Select a profile identity
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {avatars.map((avatarUrl, index) => {
                const isSelected = avatarUrl === (pendingAvatar || resolvedCurrentAvatar);

                return (
                  <button
                    type="button"
                    key={avatarUrl}
                    onClick={() => setPendingAvatar(avatarUrl)}
                    className={`relative rounded-full focus:outline-none transition-all duration-300 ${
                      isSelected
                        ? 'scale-110 shadow-xl'
                        : 'hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`Select avatar ${index + 1}`}
                  >
                    <div
                      className={`p-1 rounded-full ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-400'
                          : 'bg-transparent'
                      }`}
                    >
                      <img
                        src={avatarUrl}
                        alt={`Avatar ${index + 1}`}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover bg-white dark:bg-black/50"
                        draggable={false}
                      />
                    </div>

                    {isSelected ? (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#3C83F6] dark:bg-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a1128] shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-white dark:text-black" />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 border-t border-black/5 dark:border-white/5 pt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave(pendingAvatar || resolvedCurrentAvatar)}
                disabled={!pendingAvatar || pendingAvatar === resolvedCurrentAvatar}
                className="px-8 py-3.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
