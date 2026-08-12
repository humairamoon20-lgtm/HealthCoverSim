import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QuoteForm from '../components/QuoteForm';
import { fetchQuote, updateQuote } from '../utils/api';

export default function EditQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchQuote(id);
        setQuote(data);
      } catch (err) {
        setError(err.message || 'Failed to load quote.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(data) {
    await updateQuote(id, data);
    navigate(`/quotes/${id}`);
  }

  if (loading) return <div className="loading">Loading quote...</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div className="page">
      <Link to={`/quotes/${id}`} className="back-link">← Back to Quote</Link>
      <h1>Edit Quote for {quote.customer_name}</h1>
      <p className="page-subtitle">Update the details below and save your changes.</p>
      <QuoteForm initialData={quote} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
