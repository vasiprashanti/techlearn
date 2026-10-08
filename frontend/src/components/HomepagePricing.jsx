import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { homepagePricingAPI } from '../services/homepagePricingApi';

export default function HomepagePricing() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    homepagePricingAPI.get(controller.signal)
      .then(setCards)
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  return <section className="tl-pricing-section" id="pricing">
    <div className="tl-pricing-inner">
      <div className="tl-pricing-header">
        <span className="tl-pricing-eyebrow">THE NEXT STEP</span>
        <h2 className="tl-pricing-title">Choose <i>your</i>&nbsp;&nbsp;path</h2>
      </div>
      {loading ? <p role="status" className="text-center text-white py-12">Loading pricing…</p>
        : error ? <div role="alert" className="text-center text-white py-12"><p>{error}</p><button type="button" className="tl-price-button mt-4" onClick={() => setRetry(n => n + 1)}>Retry</button></div>
        : cards.length === 0 ? <p className="text-center text-white py-12">Pricing options will be available soon.</p>
        : <div className="tl-pricing-grid">{cards.map(card => <article key={card.key} className={`tl-price-card ${card.featured ? 'featured' : ''}`}>
          <div className={`tl-price-badge ${card.featured ? '' : 'secondary-badge'}`}>{card.badge}</div>
          <h3 className="tl-price-card-title">{card.title}</h3>
          <p className="tl-price-subtitle">{card.description}</p>
          <div className="tl-price">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(card.price)} <small>{card.priceLabel}</small></div>
          <div className="tl-price-divider" />
          <ul className="tl-price-features">{card.features.map((feature, i) => <li key={`${i}-${feature}`}>{feature}</li>)}</ul>
          <Link to={`/onboarding?intent=${card.key === 'placement' ? 'placement' : 'skill'}`} className="tl-price-button">{card.buttonText} →</Link>
        </article>)}</div>}
    </div>
  </section>;
}
