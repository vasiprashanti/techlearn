import React from 'react'
import './ProblemSection.css'

export default function ProblemSection() {
  return (
    <section className="tl-problem-section" id="problem">
      <div className="tl-problem-container">
        {/* MAIN HEADLINE */}
        <div className="tl-problem-eyebrow">THE PROBLEM</div>
        <h2 className="tl-problem-title">
          Hundreds of resources.<br /><i>Zero </i>Connection.
        </h2>

        {/* STATS */}
        <div className="tl-problem-stats-grid">
          <div className="tl-problem-stat-item">
            We jump between multiple platforms just to prepare for one course or placement.
          </div>
          <div className="tl-problem-stat-item">
            Resources are everywhere, but there’s no clear path telling you what to do next.
          </div>
          <div className="tl-problem-stat-item">
            Too much time is spent searching, switching, and deciding instead of preparing.
          </div>
        </div>

        {/* YOUTUBE */}
        <div className="tl-problem-app-card tl-problem-card-youtube" aria-hidden="true">
          <span className="tl-problem-pill-tag">Learn</span>
          <svg width="38" height="38" viewBox="0 0 24 24">
            <path
              fill="#FF0000"
              d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            />
            <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>

        {/* WHATSAPP */}
        <div className="tl-problem-app-card tl-problem-card-whatsapp" aria-hidden="true">
          <span className="tl-problem-badge">Updates</span>
          <svg width="42" height="42" viewBox="0 0 24 24">
            <path
              fill="#25D366"
              d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.764.459 3.486 1.332 5.004L2 22l5.148-1.348a9.96 9.96 0 0 0 4.863 1.267h.004c5.504 0 9.988-4.478 9.989-9.984 0-2.668-1.037-5.176-2.924-7.062C17.195 3.037 14.685 2 12.012 2z"
            />
            <path
              fill="#FFFFFF"
              d="M9.68 7.37c-.197-.44-.406-.448-.595-.456l-.506-.008c-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.201 0 1.299.946 2.553 1.078 2.729.132.176 1.84 2.87 4.542 3.998.643.268 1.144.428 1.536.552.646.204 1.234.175 1.7.106.518-.077 1.594-.65 1.815-1.277.22-.627.22-1.166.154-1.277-.066-.11-.242-.176-.506-.308-.264-.132-1.562-.77-1.804-.858-.242-.088-.418-.132-.594.132-.176.264-.682.858-.836 1.034-.154.176-.308.198-.572.066-.264-.132-1.116-.411-2.126-1.312-.786-.702-1.317-1.568-1.47-1.832-.154-.264-.017-.407.115-.538.119-.118.264-.308.396-.462.132-.154.176-.264.264-.44.088-.176.044-.33-.022-.462-.066-.132-.584-1.432-.806-1.956z"
            />
          </svg>
        </div>

        {/* GOOGLE MEET */}
        <div className="tl-problem-app-card tl-problem-card-meet" aria-hidden="true">
          <svg width="38" height="38" viewBox="0 0 87 72" fill="none">
            <path d="M0 50.4V21.6C0 16.3 4.3 12 9.6 12H38.4V60H9.6C4.3 60 0 55.7 0 50.4Z" fill="#00832D" />
            <path d="M38.4 12H67.2C72.5 12 76.8 16.3 76.8 21.6V50.4C76.8 55.7 72.5 60 67.2 60H38.4V12Z" fill="#0066DA" />
            <path d="M76.8 26.4L87 18.6V53.4L76.8 45.6V26.4Z" fill="#FFBA00" />
            <path d="M38.4 12L57.6 0H19.2L38.4 12Z" fill="#00AC47" />
            <path d="M38.4 60L19.2 72H57.6L38.4 60Z" fill="#EA4335" />
          </svg>
          <span className="tl-problem-pill-tag">Classes</span>
        </div>

        {/* LINKEDIN */}
        <div className="tl-problem-app-card tl-problem-card-linkedin" aria-hidden="true">
          <span className="tl-problem-pill-tag">Jobs</span>
          <svg width="36" height="36" viewBox="0 0 24 24">
            <path
              fill="#0A66C2"
              d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"
            />
          </svg>
        </div>

        {/* GOOGLE DRIVE */}
        <div className="tl-problem-app-card tl-problem-card-drive" aria-hidden="true">
          <svg width="38" height="34" viewBox="0 0 87.3 78">
            <path d="M6.6 66.85l13.6-23.55H87.3L73.7 66.85H6.6z" fill="#0066DA" />
            <path d="M43.65 2.65l29.8 51.6H46.35L29.9 26.8 43.65 2.65z" fill="#FFBA00" />
            <path d="M29.9 26.8L6.6 66.85 0 55.45 29.9 3.65 43.65 27.5 29.9 26.8z" fill="#00AC47" />
          </svg>
          <div className="tl-problem-context-tag">Notes</div>
        </div>

        {/* INSTAGRAM */}
        <div className="tl-problem-app-card tl-problem-card-instagram" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24">
            <path
              fill="#E1306C"
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
            />
          </svg>
          <div className="tl-problem-dark-badge">Tips</div>
        </div>

        {/* GOOGLE */}
        <div className="tl-problem-app-card tl-problem-card-google" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <div className="tl-problem-context-tag">Search</div>
        </div>
      </div>
    </section>
  )
}
