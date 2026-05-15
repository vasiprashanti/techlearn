import React from "react";
import { HiOutlineUpload } from "react-icons/hi";

export default function MarkdownFileUploadField({
  label,
  file,
  onChange,
  accept = ".md",
}) {
  return (
    <div>
      <h2 className="text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">{label}</h2>
      <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
        <HiOutlineUpload className="inline text-lg" />
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange?.(e.target.files?.[0] || null)}
        />
        Upload {label} ({accept})
      </label>
      {file && (
        <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">{file.name}</p>
      )}
    </div>
  );
}
