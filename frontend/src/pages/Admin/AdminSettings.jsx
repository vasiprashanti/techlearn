import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: false,
    autoArchive: true,
    batchReminders: true,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/admin/batches')} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6 pb-10">

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-1">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Notifications</h2>

          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">Email Notifications</p>
              <p className="text-xs text-slate-500">Receive batch updates via email</p>
            </div>
            <button
              onClick={() => toggleSetting('emailNotifications')}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailNotifications ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Batch Reminders</p>
              <p className="text-xs text-slate-500">Get notified before batch starts</p>
            </div>
            <button
              onClick={() => toggleSetting('batchReminders')}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.batchReminders ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.batchReminders ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-1">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">General</h2>

          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-800">Dark Mode</p>
              <p className="text-xs text-slate-500">Use dark theme across admin</p>
            </div>
            <button
              onClick={() => toggleSetting('darkMode')}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Auto Archive</p>
              <p className="text-xs text-slate-500">Archive expired batches automatically</p>
            </div>
            <button
              onClick={() => toggleSetting('autoArchive')}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.autoArchive ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoArchive ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
          <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-4">Danger Zone</h2>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                navigate('/login');
              }
            }}
            className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
