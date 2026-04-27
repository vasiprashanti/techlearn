import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  username: "",
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, refetchUserData } = useUser();
  const isDarkMode = theme === "dark";

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData")) || {};
    } catch {
      return {};
    }
  }, []);

  const mergedUser = { ...storedUser, ...(user || {}) };

  const [formData, setFormData] = useState({
    ...initialFormState,
    firstName: mergedUser.firstName || "",
    lastName: mergedUser.lastName || "",
    email: mergedUser.email || "",
    dateOfBirth: mergedUser.dateOfBirth || "",
    gender: mergedUser.gender || "",
    username: mergedUser.username || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const inputClass = "dashboard-input-surface mt-2";

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const userId = mergedUser?.id;
      if (!userId) {
        throw new Error("Unable to find user id. Please login again.");
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        username: formData.username.trim(),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile.");
      }

      const apiData = await response.json();
      const updatedUser = {
        ...mergedUser,
        ...payload,
        ...(apiData?.user || apiData || {}),
      };

      localStorage.setItem("userData", JSON.stringify(updatedUser));
      if (typeof refetchUserData === "function") {
        await refetchUserData();
      }

      setStatus({ type: "success", message: "Profile updated successfully." });
      navigate("/dashboard/profile");
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
            : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"
        }`}
      />

      <main className="flex-1 overflow-auto px-6 pb-12 pt-24 transition-all duration-700 ease-in-out z-10 md:px-12 lg:px-16">
        <div className="mx-auto max-w-[1100px] space-y-8">
          <header className="flex flex-col justify-between gap-4 border-b border-black/5 pb-6 dark:border-white/5 md:flex-row md:items-end">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <button
                type="button"
                onClick={() => navigate("/dashboard/profile")}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
              </button>
              <h1 className="mt-8 font-poppins tracking-tight leading-[0.92]">
                <span className="dashboard-page-title block text-4xl sm:text-5xl md:text-6xl">Edit Profile.</span>
              </h1>
              <p className="mt-2 text-xs uppercase tracking-widest text-black/40 dark:text-white/40">
                Update your personal details
              </p>
            </motion.div>
          </header>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="dashboard-surface p-8 md:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">First Name</span>
                  <input type="text" value={formData.firstName} onChange={handleChange("firstName")} className={inputClass} />
                </label>

                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Last Name</span>
                  <input type="text" value={formData.lastName} onChange={handleChange("lastName")} className={inputClass} />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Email Address</span>
                  <input type="email" value={formData.email} onChange={handleChange("email")} className={inputClass} />
                </label>

                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Date of Birth</span>
                  <input type="date" value={formData.dateOfBirth} onChange={handleChange("dateOfBirth")} className={inputClass} />
                </label>

                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Gender</span>
                  <select value={formData.gender} onChange={handleChange("gender")} className={inputClass}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Username</span>
                  <input type="text" value={formData.username} onChange={handleChange("username")} className={inputClass} />
                </label>
              </div>

              {status.message ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    status.type === "success"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300"
                  }`}
                >
                  {status.message}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#86c4ff]/30 pt-6 dark:border-[#6bb8ec]/30">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/profile")}
                  className="dashboard-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="dashboard-primary-btn disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
