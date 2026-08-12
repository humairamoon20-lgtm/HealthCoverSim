import { useNavigate } from 'react-router-dom';
import QuoteForm from '../components/QuoteForm';
import { createQuote } from '../utils/api';

export default function CreateQuote() {
  const navigate = useNavigate();

  async function handleSubmit(data) {
    const result = await createQuote(data);
    navigate(`/quotes/${result.id}`);
  }

  return (
    <div className="page">
      <h1>Create New Quote</h1>
      <p className="page-subtitle">Enter the applicant details below to generate a health cover quote.</p>
      <QuoteForm onSubmit={handleSubmit} submitLabel="Create Quote" />
    </div>
  );
}
