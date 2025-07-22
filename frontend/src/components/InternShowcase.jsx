import React from 'react';
import './InternShowcase.css';

const InternShowcase = () => {
  const interns = [
    {
      name: "Raunak",
      photo: "/intern-photos/raunak.jpg",
      quote: "Building the future, one line of code at a time.",
      background: "rgba(133, 194, 250, 0.5)"
    },
    {
      name: "Rishikesh",
      photo: "/intern-photos/rishikesh.jpg",
      quote: "Innovation happens when passion meets purpose.",
      background: "rgba(98, 178, 254, 0.5)"
    },
    {
      name: "Pavan",
      photo: "/intern-photos/pavan.jpg",
      quote: "Every bug is a step closer to perfection.",
      background: "rgba(55, 155, 248, 0.5)"
    },
    {
      name: "Arjun",
      photo: "/intern-photos/arjun.jpg",
      quote: "Code is poetry written in logic.",
      background: "rgba(21, 142, 255, 0.5)"
    },
    {
      name: "Priya",
      photo: "/intern-photos/priya.jpg",
      quote: "Turning ideas into digital reality.",
      background: "rgba(15, 107, 245, 0.5)"
    },
    {
      name: "Sanjay",
      photo: "/intern-photos/sanjay.jpg",
      quote: "Design is not just what it looks like, but how it works.",
      background: "rgba(59, 130, 246, 0.5)"
    },
    {
      name: "Meera",
      photo: "/intern-photos/meera.jpg",
      quote: "Great software is built by great teams.",
      background: "rgba(37, 99, 235, 0.5)"
    },
    {
      name: "Karthik",
      photo: "/intern-photos/karthik.jpg",
      quote: "Debugging is like being a detective in a crime movie.",
      background: "rgba(29, 78, 216, 0.5)"
    },
    {
      name: "Sneha",
      photo: "/intern-photos/sneha.jpg",
      quote: "Code never lies, comments sometimes do.",
      background: "rgba(30, 64, 175, 0.5)"
    },
    {
      name: "Rohit",
      photo: "/intern-photos/rohit.jpg",
      quote: "The best error message is the one that never shows up.",
      background: "rgba(30, 58, 138, 0.5)"
    },
    {
      name: "Ananya",
      photo: "/intern-photos/ananya.jpg",
      quote: "Technology is best when it brings people together.",
      background: "rgba(23, 37, 84, 0.5)"
    },
    {
      name: "Vikram",
      photo: "/intern-photos/vikram.jpg",
      quote: "First, solve the problem. Then, write the code.",
      background: "rgba(15, 23, 42, 0.5)"
    }
  ];

  return (
    <section className="intern-showcase-section">
      <div className="intern-showcase-header">
        <h2 className="section-title">Meet the Summer Interns 25'</h2>
        <p className="section-subtitle">The team that built Techlearn from scratch</p>
      </div>
      
      <div className="intern-container">
        <div className="intern-palette">
          {interns.map((intern, index) => (
            <div 
              key={index}
              className="intern-card"
              style={{ backgroundColor: intern.background }}
            >
              <span className="intern-name">{intern.name}</span>
              <div className="intern-details">
                <img 
                  src={intern.photo} 
                  alt={intern.name} 
                  className="intern-photo"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png'; // Fallback image
                  }}
                />
                <p className="intern-quote">"{intern.quote}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InternShowcase;
