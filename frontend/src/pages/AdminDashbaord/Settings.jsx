import { useState } from "react";
import { FiBell, FiSearch } from "react-icons/fi";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative h-8 w-14 rounded-full border transition-colors ${
      checked
        ? "bg-[#3C83F6] border-[#3C83F6]/70"
        : "bg-[#d0dae7] border-[#c5d1de]"
    }`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-0.5 h-6 w-6 rounded-full bg-[#dce8f6] shadow-sm transition-all ${
        checked ? "left-7" : "left-0.5"
      }`}
    />
  </button>
);

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [certificatesEnabled, setCertificatesEnabled] = useState(true);
  const [homeText, setHomeText] = useState(
    "Welcome to our learning platform. Explore courses designed to boost your skills and career."
  );
  const [termsText, setTermsText] = useState(
    "By using our platform, you agree to abide by our terms and conditions..."
  );
  const [privacyText, setPrivacyText] = useState(
    "Your privacy is important to us. We securely handle your personal data and usage information."
  );

  const isDarkMode = theme === "dark";

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-700 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
            : "bg-gradient-to-br from-[#daf0fa] via-[#c7e9ff] to-[#daf0fa]"
        }`}
      />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        className={`flex-1 transition-all duration-500 ease-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-0 pb-10 px-6 md:px-12 lg:px-16 overflow-auto`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 py-3 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">
              Settings
            </h1>

            <div className="flex items-center gap-6">
              <button className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group">
                <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40" />
                <span className="text-sm text-black/40 dark:text-white/40">Search...</span>
                <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </button>

              <button className="relative text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              </button>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg border-2 border-white/20 dark:border-black/20">
                {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "A"}
              </div>
            </div>
          </header>

          <section className="max-w-4xl space-y-6">
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-7">
              <h2 className="text-xl font-light tracking-tight text-[#3C83F6] dark:text-white mb-7">General Settings</h2>

              <div className="space-y-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-base font-medium text-black/80 dark:text-white">Certificates</p>
                    <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                      Enable or disable certificate generation
                    </p>
                  </div>
                  <Toggle
                    checked={certificatesEnabled}
                    onChange={() => setCertificatesEnabled((prev) => !prev)}
                  />
                </div>

                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-base font-medium text-black/80 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <Toggle checked={isDarkMode} onChange={toggleTheme} />
                </div>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-7">
              <h2 className="text-xl font-light tracking-tight text-[#3C83F6] dark:text-white mb-7">Content</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">
                    Homepage Content
                  </label>
                  <textarea
                    rows={3}
                    value={homeText}
                    onChange={(e) => setHomeText(e.target.value)}
                    className="w-full text-sm leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-black/75 dark:text-white/85 p-4 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={3}
                    value={termsText}
                    onChange={(e) => setTermsText(e.target.value)}
                    className="w-full text-sm leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-black/75 dark:text-white/85 p-4 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-2">
                    Privacy Policy
                  </label>
                  <textarea
                    rows={3}
                    value={privacyText}
                    onChange={(e) => setPrivacyText(e.target.value)}
                    className="w-full text-sm leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-black/75 dark:text-white/85 p-4 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
