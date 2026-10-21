import React from 'react';
import { useNavigate } from 'react-router-dom';
import StateFallback from '../components/common/StateFallback';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <main className="min-h-[70vh] pt-28">
      <StateFallback state="unavailable" title={['Page', ' not found.']} cta="Go home" onAction={() => navigate('/')} />
    </main>
  );
}
