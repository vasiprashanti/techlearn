import React, { useEffect } from "react";

// Dummy Card Component (future ready)
const DummyCard = () => (
  <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm mx-auto mb-8">
    <div className="font-bold text-lg mb-2 text-gray-900">Dummy Card Title</div>
    <div className="text-gray-600 mb-4">
      Placeholder card component. Can be used for future UI components.
    </div>
    <button className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
      Action
    </button>
  </div>
);

const UILibrary = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{
        // This matches your index.html background
        background: "linear-gradient(135deg, #daf0fa 0%, #bceaff 50%, #bceaff 100%)",
        fontFamily: "'Inter', sans-serif"
      }}>
      <h1 className="text-3xl font-bold mb-4">
        We're Building Something Awesome!
      </h1>
      <p className="text-lg mb-8">
        This section is under construction. Check back soon for amazing reusable components!
      </p>
      <DummyCard />
    </div>
  );
};

export default UILibrary;
