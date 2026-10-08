import { useEffect, useState } from 'react';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import { homepagePricingAPI } from '../../services/homepagePricingApi';

export default function Pricing() {
  const [tab, setTab] = useState('Homepage');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    homepagePricingAPI.get(controller.signal).then(setCards)
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  function edit(index, field, value) {
    setMessage('');
    setCards(current => current.map((card, i) => i === index ? { ...card, [field]: value } : card));
  }
  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setError(''); setMessage(''); setSaving(true);
    try {
      if (cards.some(card => !card.title.trim() || card.price === '' || !Number.isFinite(Number(card.price)) || Number(card.price) < 0)) throw new Error('Each card needs a title and a valid, non-negative price.');
      setCards(await homepagePricingAPI.save(cards.map(card => ({ ...card, price: Number(card.price) }))));
      setMessage('Homepage pricing saved. The homepage now uses these values.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  const inputClass = 'w-full rounded-xl border border-white/20 bg-[#101c36] px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#b2e96a]';
  return <div className="admin-dashboard-typography min-h-screen text-white pt-24 pb-12 px-4 lg:pl-[18rem] lg:pr-8">
    <Sidebar />
    <h1 className="text-3xl font-semibold mb-2">Pricing</h1>
    <p className="text-slate-300 mb-6">Homepage display cards only. Program plans and checkout prices are managed separately.</p>
    <div role="tablist" aria-label="Pricing sections" className="flex gap-3 mb-6">
      {['Homepage', 'Learn'].map(name => <button key={name} id={`pricing-tab-${name}`} role="tab" aria-selected={tab === name} aria-controls={`pricing-panel-${name}`} type="button" className={`px-5 py-3 rounded-xl ${tab === name ? 'bg-[#b2e96a] text-[#01071e]' : 'bg-white/10'}`} onClick={() => setTab(name)}>{name}</button>)}
    </div>
    <section role="tabpanel" id={`pricing-panel-${tab}`} aria-labelledby={`pricing-tab-${tab}`}>
      {tab === 'Learn' ? <p className="rounded-2xl bg-white/5 p-8 text-slate-300">Learn pricing management is not part of this release.</p>
        : loading ? <p role="status">Loading homepage pricing…</p>
        : <form onSubmit={save}>
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-400/40 bg-red-950/50 p-4">{error} {cards.length === 0 && <button type="button" className="underline ml-3" onClick={() => setRetry(n => n + 1)}>Retry</button>}</div>}
          {message && <p role="status" className="mb-5 text-[#b2e96a]">{message}</p>}
          {!error && cards.length === 0 && <p>No homepage pricing cards are configured.</p>}
          <fieldset disabled={saving} className="grid md:grid-cols-2 gap-6 disabled:opacity-70">
            {cards.map((card, index) => <article key={card.key} className="rounded-2xl border border-white/15 bg-[#09152e] p-5 space-y-4 min-w-0">
              <h2 className="font-semibold text-xl">{card.key === 'placement' ? 'Placement' : 'Skill'} card</h2>
              {[
                ['title', 'Card title'], ['badge', 'Badge'], ['price', 'Price (₹)'], ['priceLabel', 'Price label'], ['buttonText', 'Button text'],
              ].map(([field, label]) => <label key={field} className="block text-sm">{label}<input className={`${inputClass} mt-2`} type={field === 'price' ? 'number' : 'text'} min={field === 'price' ? 0 : undefined} step={field === 'price' ? '0.01' : undefined} required value={card[field] ?? ''} onChange={e => edit(index, field, e.target.value)} /></label>)}
              <label className="block text-sm">Description<textarea required className={`${inputClass} mt-2`} rows={3} value={card.description} onChange={e => edit(index, 'description', e.target.value)} /></label>
              <label className="block text-sm">Features (one per line)<textarea required className={`${inputClass} mt-2`} rows={6} value={card.features.join('\n')} onChange={e => edit(index, 'features', e.target.value.split('\n'))} /></label>
            </article>)}
          </fieldset>
          {cards.length > 0 && <button disabled={saving} type="submit" className="mt-6 rounded-xl bg-[#b2e96a] text-[#01071e] font-semibold px-6 py-3 disabled:opacity-60">{saving ? 'Saving…' : 'Save homepage pricing'}</button>}
        </form>}
    </section>
  </div>;
}
