import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const midProjects = [
  {
    _id: "1",
    title: "E-commerce Product Listing Page",
    description: "A fully functional e-commerce product listing and checkout page.",
    price: 'XXXX',
    duration: "2 weeks",
    level: "Intermediate",
    rating: 4.7,
    features: [
      "Add to cart functionality",
      "Product filtering",
      "Checkout and payment simulation",
      "Responsive design",
    ],
  },
  {
    _id: "2",
    title: "Data Visulization Dashboard",
    description: "Interactive dashboard for data visualization and analysis.",
    price: 'XXXX',
    duration: "10 days",
    level: "Intermediate",
    rating: 4.5,
    features: [
      "Charts and graphs",
      "CSV upload",
      "Data filtering",
      "Export results",
    ],
  },
  {
    _id: "3",
    title: "Social Media Feed with API",
    description: "A social media feed that fetches posts from an API.",
    price: 'XXXX',
    duration: "3 weeks",
    level: "Intermediate",
    rating: 4.8,
    features: [
      "API integration",
      "Infinite scroll",
      "Post likes and comments",
      "Responsive design",
    ],
  },
  {
    _id: "4",
    title: "Expense Tracker with Analytics",
    description: "Track your expenses and manage budgets effectively.",
    price: 'XXXX',
    duration: "1 week",
    level: "Intermediate",
    rating: 4.3,
    features: [
      "Add and categorize expenses",
      "Monthly budget overview",
      "Export data",
      "Responsive design",
    ],
  },
  {
    _id: "5",
    title: "Recipe Finder App",
    description: "Find recipes based on ingredients you have.",
    price: 'XXXX',
    duration: "2 weeks",
    level: "Intermediate",
    rating: 4.6,
    features: [
      "Ingredient search",
      "Recipe details",
      "Save favorites",
      "Responsive design",
    ],
  },
  {
    _id: "6",
    title: "Machine Learning Predictor",
    description: "A simple machine learning predictor app.",
    price: 'XXXX',
    duration: "4 weeks",
    level: "Advanced",
    rating: 4.9,
    features: [
      "Model training",
      "Prediction interface",
      "Data visualization",
      "Responsive design",
    ],
  }
];

const MidProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const project = midProjects.find(p => p._id === id);

  if (!project) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-xl">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">

      <h1 className="text-3xl font-bold mb-4">{project.title}</h1>

      <div className="mb-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${project.level === 'Advanced' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
        >
          {project.level}
        </span>
      </div>

      {project.features && project.features.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            {project.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Project Details</h2>
        <p><strong>Duration:</strong> {project.duration || 'N/A'}</p>
        <p><strong>Rating:</strong> {project.rating || 'N/A'}</p>
      </div>

      <button
        onClick={() => navigate(`/payment?projectId=${project._id}&type=mid`)}
        className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition"
      >
        {project.price ? `Purchase for ₹${project.price}` : 'Purchase Access'}
      </button>
    </div>
  );
};

export default MidProjectDetail;