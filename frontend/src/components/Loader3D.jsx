import React from 'react';
import './Loader3D.css';

const Loader3D = ({ size = 32, duration = 800, className = '' }) => {
  return (
    <div 
      className={`loader-3d-container ${className}`}
      style={{
        '--size': `${size}px`,
        '--duration': `${duration}ms`
      }}
    >
      <div className="boxes">
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="box">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default Loader3D;
