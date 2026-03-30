import { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import AdminHeaderControls from "../../components/AdminDashbaord/AdminHeaderControls";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const Toggle = ({ checked, onChange, isDarkMode = false }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3C83F6]/40 ${
      checked
        ? "bg-[#3C83F6] border-[#2f73e0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
        : isDarkMode
          ? "bg-white/10 border-white/20"
          : "bg-[#e8eef6] border-[#cdd8e6]"
    }`}
    aria-pressed={checked}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200 ease-out ${
        checked
          ? "translate-x-6 bg-white"
          : isDarkMode
            ? "translate-x-1 bg-white/90"
            : "translate-x-1 bg-white"
      }`}
    />
  </button>
);

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
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
      className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
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
        className={`flex-1 min-h-[100dvh] transition-all duration-500 ease-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-0 pb-10 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <div className="flex-1" />
            <AdminHeaderControls user={user} logout={logout} />
          </header>

          <section className="max-w-4xl space-y-6">
            <div className="bg-white dark:bg-[#0f1f43] border border-black/8 dark:border-white/10 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-light tracking-tight text-black dark:text-white mb-7">General Settings</h2>

              <div className="space-y-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-base font-medium text-black/85 dark:text-white/90">Certificates</p>
                    <p className="text-sm text-black/55 dark:text-white/60 mt-1">
                      Enable or disable certificate generation
                    </p>
                  </div>
                  <Toggle
                    checked={certificatesEnabled}
                    onChange={() => setCertificatesEnabled((prev) => !prev)}
                    isDarkMode={isDarkMode}
                  />
                </div>

                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-base font-medium text-black/85 dark:text-white/90">Dark Mode</p>
                    <p className="text-sm text-black/55 dark:text-white/60 mt-1">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <Toggle checked={isDarkMode} onChange={toggleTheme} isDarkMode={isDarkMode} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1f43] border border-black/8 dark:border-white/10 rounded-2xl p-7 shadow-sm">
              <h2 className="text-xl font-light tracking-tight text-black dark:text-white mb-7">Content</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/75 mb-2">
                    Homepage Content
                  </label>
                  <textarea
                    rows={3}
                    value={homeText}
                    onChange={(e) => setHomeText(e.target.value)}
                    className="w-full text-sm leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#14264d] text-black/75 dark:text-white/85 p-4 focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/75 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={3}
                    value={termsText}
                    onChange={(e) => setTermsText(e.target.value)}
                    className="w-full text-sm leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#14264d] text-black/75 dark:text-white/85 p-4 focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/75 mb-2">
                    Privacy Policy
                  </label>
                  <textarea
                    rows={3}
                    value={privacyText}
                    onChange={(e) => setPrivacyText(e.target.value)}
                    className="w-full text-sm leading-relaxed rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#14264d] text-black/75 dark:text-white/85 p-4 focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/25"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
