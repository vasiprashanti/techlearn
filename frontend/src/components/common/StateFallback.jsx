import React from 'react';
import './stateFallback.css';

/*
 * Empty / error states that render inside a page or tab area (never full screen).
 * Avatar, caption, title and CTA label for each state live in STATE_CONFIG so Tanvika's final
 * content can be dropped in here without touching the component. Pages can also override any
 * field per use via props.
 *
 * title: [italic part, rest]
 */
export const STATE_CONFIG = {
  'no-courses': {
    avatar: '/state_avatars/green.png',
    caption: '',
    title: ['Course', ' went offline.'],
    cta: 'Explore Programs',
  },
  'no-programs': {
    avatar: '/state_avatars/green.png',
    caption: '',
    title: ['Program', ' went offline.'],
    cta: 'Explore Courses',
  },
  'login-required': {
    avatar: '/state_avatars/laptop.png',
    caption: '',
    title: ['Your', ' courses are behind the login wall.'],
    cta: 'Login',
  },
  unavailable: {
    avatar: '/state_avatars/red.png',
    caption: '',
    title: ['Page', ' unavailable.'],
    cta: 'Try again',
  },
  'no-matches': {
    avatar: '/state_avatars/sunglasses.png',
    caption: '',
    title: ['Nothing', ' made the cut.'],
    cta: 'Clear filters',
  },
  // temporary placeholder until Tanvika supplies the message for a logged-in learner with no enrollments
  'not-enrolled': {
    avatar: '/state_avatars/green.png',
    caption: '',
    title: ['Nothing', ' here yet.'],
    cta: 'Explore',
  },
};

export default function StateFallback({ state, onAction, avatar, caption, title, cta, className = '' }) {
  const config = { ...(STATE_CONFIG[state] || STATE_CONFIG.unavailable) };
  if (avatar) config.avatar = avatar;
  if (caption !== undefined) config.caption = caption;
  if (title) config.title = title;
  if (cta !== undefined) config.cta = cta;
  const [italic, rest] = config.title;

  return (
    <div className={`tl-state ${className}`} role="status">
      <img src={config.avatar} alt="" className="tl-state-avatar" />
      {config.caption && <div className="tl-state-caption">{config.caption}</div>}
      <h2 className="tl-state-title"><i>{italic}</i>{rest}</h2>
      {config.cta && onAction && (
        <button type="button" className="tl-state-cta" onClick={onAction}>
          {config.cta} <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
