import React, { useState } from "react";

export default function NewCourseForm({ onAdd }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    numTopics: "", // Changed from 'topics' to 'numTopics'
    level: "",
  });

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (form.title && form.description && form.numTopics && form.level) {
      const numTopicsValue = parseInt(form.numTopics, 10);
      
      // Validate numTopics is a positive number
      if (isNaN(numTopicsValue) || numTopicsValue <= 0) {
        alert("Please enter a valid number of topics (greater than 0)");
        return;
      }
      
      // Send data with numTopics (matching backend expectation)
      onAdd({
        title: form.title.trim(),
        description: form.description.trim(),
        numTopics: numTopicsValue,
        level: form.level,
      });
      
      // Reset form
      setForm({ title: "", description: "", numTopics: "", level: "" });
    } else {
      alert("Please fill in all required fields");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/50 dark:bg-gray-800/70 p-6 rounded-xl shadow flex flex-col gap-4 mb-8 max-w-2xl"
    >
      <h2 className="text-xl font-semibold mb-2 text-light-text/90 dark:text-dark-text/70">
        Create New Course
      </h2>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">
          Title *
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter course title"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">
          Description *
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter course description"
          rows="3"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">
          Number of Topics *
        </label>
        <input
          name="numTopics"
          type="number"
          min="1"
          max="100"
          value={form.numTopics}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter number of topics (e.g., 8)"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">
          Level *
        </label>
        <select
          name="level"
          value={form.level}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-light-text/80 dark:text-dark-text/70 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600"
          required
        >
          <option value="">Select level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>
      
      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={!form.title || !form.description || !form.numTopics || !form.level}
      >
        Create Course
      </button>
    </form>
  );
}