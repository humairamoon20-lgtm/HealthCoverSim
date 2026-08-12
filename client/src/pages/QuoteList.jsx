import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuotes, deleteQuote } from '../utils/api';

export default function QuoteList() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadQuotes(); }, []);

  async function loadQuotes() {
    try {
      const data = await fetchQuotes();
      setQuotes(data);
    } catch (err) {
      setError(err.message || 'Failed to load quotes.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete the quote for "${name}"?`)) return;
    try {
      await deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete quote.');
    }
  }

  if (loading) return <div className="loading">Loading quotes...</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>All Quotes</h1>
        <Link to="/create" className="btn btn-primary">+ New Quote</Link>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No quotes yet</h2>
          <p>Create your first health cover quote to get started.</p>
          <Link to="/create" className="btn btn-primary">Create Quote</Link>
        </div>
      ) : (
        <div className="quote-grid">
          {quotes.map(quote => (
            <div key={quote.id} className="quote-card">
              <div className="quote-card-header">
                <h3>{quote.customer_name}</h3>
                <span className={`badge badge-${quote.cover_type.toLowerCase()}`}>
                  {quote.cover_type}
                </span>
              </div>
              <div className="quote-card-body">
                <div className="quote-card-detail">
                  <span className="label">Hospital</span>
                  <span className="value">{quote.hospital_cover}</span>
                </div>
                <div className="quote-card-detail">
                  <span className="label">Extras</span>
                  <span className="value">{quote.extras_cover}</span>
                </div>
                <div className="quote-card-detail">
                  <span className="label">Payment</span>
                  <span className="value">{quote.payment_frequency}</span>
                </div>
                <div className="quote-card-detail">
                  <span className="label">Created</span>
                  <span className="value">{new Date(quote.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="quote-card-actions">
                <Link to={`/quotes/${quote.id}`} className="btn btn-sm btn-view">View Details</Link>
                <Link to={`/quotes/${quote.id}/edit`} className="btn btn-sm btn-edit">Edit</Link>
                <button className="btn btn-sm btn-delete" onClick={() => handleDelete(quote.id, quote.customer_name)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
