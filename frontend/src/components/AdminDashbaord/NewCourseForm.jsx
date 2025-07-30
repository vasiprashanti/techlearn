import React, { useState } from "react";

export default function NewCourseForm({ onAdd }) {
  const [form, setForm] = useState({ title: "", description: "", topics: "" });

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.title && form.description && form.topics) {
      onAdd({
        title: form.title,
        description: form.description,
        topics: parseInt(form.topics, 10),
      });
      setForm({ title: "", description: "", topics: "" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/50 dark:bg-gray-800/70 p-6 rounded-xl shadow flex flex-col gap-4 mb-8 max-w-2xl"
    >
      <h2 className="text-xl font-semibold mb-2 text-light-text/90 dark:text-dark-text/70">Create New Course</h2>
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Enter course title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Enter course description"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-light-text/80 dark:text-dark-text/70">Number of Topics</label>
        <input
          name="topics"
          type="number"
          min={1}
          value={form.topics}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Enter number of topics"
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
      >
        Create Course
      </button>
    </form>
  );
}