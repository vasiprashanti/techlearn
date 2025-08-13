import React, { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { MdQuiz } from "react-icons/md";

const Quizzesupload = () => {
  // Form state
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctOption: "",
    tags: [],
    difficulty: "medium",
  });

  // For adding tags
  const [currentTag, setCurrentTag] = useState("");
  // For form validation errors
  const [errors, setErrors] = useState({});

  // Backend API base URL (from .env file) — will be replaced later
  const BASE_URL = import.meta.env.VITE_API_URL;

  // Difficulty dropdown options
  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  // Update options array
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });

    // Clear error if value entered
    if (value && errors[`option${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`option${index}`];
      setErrors(newErrors);
    }
  };

  // Add new option (max 6 options)
  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({ ...formData, options: [...formData.options, ""] });
    }
  };

  // Remove option (minimum 2 options)
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });

      // Reset correct option if deleted
      if (formData.correctOption === formData.options[index]) {
        setFormData({ ...formData, options: newOptions, correctOption: "" });
      }
    }
  };

  // Add a tag
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      });
      setCurrentTag("");
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    if (!formData.question.trim()) newErrors.question = "Question is required";

    formData.options.forEach((option, index) => {
      if (!option.trim()) newErrors[`option${index}`] = `Option ${index + 1} is required`;
    });

    if (!formData.correctOption.trim()) newErrors.correctOption = "Please select the correct option";
    if (formData.tags.length === 0) newErrors.tags = "At least one tag is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Mock API request — Replace URL later with real backend
   * Currently sends data to jsonplaceholder for testing
   */
  const uploadQuiz = async (quizData) => {
    try {
      const response = await fetch(
        `${BASE_URL || "https://jsonplaceholder.typicode.com/posts"}`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(quizData),
        }
      );

      if (!response.ok) throw new Error("Failed to upload quiz");

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Error uploading quiz:", error);
      return { success: false, error: error.message };
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const result = await uploadQuiz(formData);

      if (result.success) {
        alert("Quiz uploaded successfully!");
        // Reset form after success
        setFormData({
          question: "",
          options: ["", "", "", ""],
          correctOption: "",
          tags: [],
          difficulty: "medium",
        });
        setErrors({});
      } else {
        alert(`Failed to upload quiz: ${result.error}`);
      }
    }
  };

  // Handle pressing Enter for adding tags
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <Sidebar />
      <div className="flex-1 flex justify-center items-start lg:items-center min-h-screen px-4 sm:px-6 lg:px-8 py-4 pt-28 lg:pt-0 lg:mt-24">
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-3xl">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MdQuiz /> Upload Quiz
          </h1>

          {/* FORM START */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Question Input */}
            <div>
              <label>Question *</label>
              <textarea
                rows={3}
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter quiz question..."
              />
              {errors.question && <p className="text-red-500 text-sm">{errors.question}</p>}
            </div>

            {/* Options Input */}
            <div>
              <label>Options *</label>
              <div className="space-y-2">
                {formData.options.map((opt, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    {formData.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(index)} className="text-red-500">✕</button>
                    )}
                  </div>
                ))}
                {formData.options.length < 6 && (
                  <button type="button" onClick={addOption} className="text-blue-500">+ Add Option</button>
                )}
              </div>
            </div>

            {/* Correct Option Dropdown */}
            <div>
              <label>Correct Answer *</label>
              <select
                value={formData.correctOption}
                onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select correct option</option>
                {formData.options.map((opt, index) => (
                  <option key={index} value={opt}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div>
              <label>Tags *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type tag and press Enter"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <button type="button" onClick={addTag} className="bg-blue-500 text-white px-4 rounded">Add</button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className="bg-blue-100 px-2 py-1 rounded flex items-center gap-1">
                    {tag} <button type="button" onClick={() => removeTag(tag)}>✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Difficulty Dropdown */}
            <div>
              <label>Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                {difficultyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
    
            {/* Submit Button */}
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Quizzesupload;
