import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import JoinWaitlistModal from '../../components/Learn/JoinWaitlistModal';
import StateFallback from '../../components/common/StateFallback';
import { programLearningAPI } from '../../services/programLearningApi';

/*
 * Direct link to the Join Waitlist page: /waitlist/:programId opens it for that program;
 * /waitlist alone uses the first public program.
 */
export default function WaitlistPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(programId ? { _id: programId } : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (programId) {
      setProgram({ _id: programId });
      return undefined;
    }
    let cancelled = false;
    programLearningAPI.getPublicPrograms()
      .then((res) => {
        const first = Array.isArray(res?.programs) ? res.programs[0] : null;
        if (cancelled) return;
        if (first) setProgram(first); else setFailed(true);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [programId]);

  const close = () => navigate('/learn');

  if (failed) {
    return (
      <main className="min-h-screen pt-28">
        <StateFallback state="unavailable" onAction={() => window.location.reload()} />
      </main>
    );
  }

  return <JoinWaitlistModal isOpen={Boolean(program)} onClose={close} program={program} />;
}
