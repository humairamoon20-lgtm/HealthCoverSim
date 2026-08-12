import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchQuote, deleteQuote } from '../utils/api';

/**
 * QuoteDetail — The Explanation Sheet
 * Shows the complete premium breakdown in plain English.
 */
export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadQuote() {
      try {
        const data = await fetchQuote(id);
        setQuote(data);
      } catch (err) {
        setError(err.message || 'Failed to load quote.');
      } finally {
        setLoading(false);
      }
    }
    loadQuote();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    try {
      await deleteQuote(id);
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to delete quote.');
    }
  }

  if (loading) return <div className="loading">Loading quote...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!quote) return <div className="error-box">Quote not found.</div>;

  const b = quote.breakdown;

  return (
    <div className="page">
      <Link to="/" className="back-link">← Back to All Quotes</Link>

      <div className="detail-header">
        <div>
          <h1>Quote for {quote.customer_name}</h1>
          <span className={`badge badge-${quote.cover_type.toLowerCase()}`}>
            {quote.cover_type} Cover
          </span>
        </div>
        <div className="detail-actions">
          <Link to={`/quotes/${id}/edit`} className="btn btn-edit">Edit Quote</Link>
          <button className="btn btn-delete" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {/* Premium Summary */}
      <div className="premium-summary">
        <div className="premium-card premium-monthly">
          <div className="premium-label">Monthly Premium</div>
          <div className="premium-amount">${b.monthlyPremium.toFixed(2)}</div>
          <div className="premium-sub">per month</div>
        </div>
        <div className="premium-card premium-yearly">
          <div className="premium-label">
            {b.paymentFrequency === 'Yearly' ? 'Yearly Premium (after discount)' : 'Yearly Premium (no discount)'}
          </div>
          <div className="premium-amount">
            ${b.paymentFrequency === 'Yearly' ? b.yearlyAfterDiscount.toFixed(2) : b.yearlyBeforeDiscount.toFixed(2)}
          </div>
          <div className="premium-sub">per year</div>
        </div>
      </div>

      {/* Warnings */}
      {b.warnings.length > 0 && (
        <div className="warning-box">
          <strong>⚠️ Warnings</strong>
          <ul>
            {b.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="breakdown-section">
        <h2>Premium Breakdown</h2>

        {/* Hospital Cover */}
        <div className="breakdown-group">
          <h3>🏥 Hospital Cover — {b.hospitalCover}</h3>
          {b.hospitalCover === 'None' ? (
            <p className="no-cover">No hospital cover selected.</p>
          ) : (
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Base Price</th>
                  <th>LHC Loading</th>
                  <th>Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Applicant 1 (age {b.applicant1.age})</td>
                  <td>${b.applicant1.hospitalBasePrice.toFixed(2)}</td>
                  <td>{b.applicant1.lhcLoadingPercent}%</td>
                  <td className="amount">${b.applicant1.hospitalWithLoading.toFixed(2)}</td>
                </tr>
                {b.applicant2 && (
                  <tr>
                    <td>Applicant 2 (age {b.applicant2.age})</td>
                    <td>${b.applicant2.hospitalBasePrice.toFixed(2)}</td>
                    <td>{b.applicant2.lhcLoadingPercent}%</td>
                    <td className="amount">${b.applicant2.hospitalWithLoading.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan="3"><strong>Hospital Total</strong></td>
                  <td className="amount"><strong>${b.hospitalTotal.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Extras Cover */}
        <div className="breakdown-group">
          <h3>🦷 Extras Cover — {b.extrasCover}</h3>
          {b.extrasCover === 'None' ? (
            <p className="no-cover">No extras cover selected.</p>
          ) : (
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Rate</th>
                  <th>Adults</th>
                  <th>Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{b.extrasCover} extras</td>
                  <td>${b.extrasBasePrice.toFixed(2)}/adult</td>
                  <td>× {b.adultCount}</td>
                  <td className="amount">${b.extrasTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Family Fee */}
        {b.familyFee > 0 && (
          <div className="breakdown-group">
            <h3>👨‍👩‍👧‍👦 Family Upgrade Fee</h3>
            <table className="breakdown-table">
              <tbody>
                <tr>
                  <td>Family upgrade (covers dependent children)</td>
                  <td className="amount">${b.familyFee.toFixed(2)}/month</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="breakdown-group totals-group">
          <h3>💰 Total Summary</h3>
          <table className="breakdown-table">
            <tbody>
              <tr>
                <td>Hospital cover</td>
                <td className="amount">${b.hospitalTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Extras cover</td>
                <td className="amount">${b.extrasTotal.toFixed(2)}</td>
              </tr>
              {b.familyFee > 0 && (
                <tr>
                  <td>Family upgrade fee</td>
                  <td className="amount">${b.familyFee.toFixed(2)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td><strong>Monthly Premium</strong></td>
                <td className="amount"><strong>${b.monthlyPremium.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td>Yearly premium (before discount)</td>
                <td className="amount">${b.yearlyBeforeDiscount.toFixed(2)}</td>
              </tr>
              {b.paymentFrequency === 'Yearly' && (
                <>
                  <tr>
                    <td>Annual discount ({b.annualDiscountPercent}%)</td>
                    <td className="amount discount">
                      -${(b.yearlyBeforeDiscount - b.yearlyAfterDiscount).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="total-row final-total">
                    <td><strong>Yearly Premium (after {b.annualDiscountPercent}% discount)</strong></td>
                    <td className="amount"><strong>${b.yearlyAfterDiscount.toFixed(2)}</strong></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LHC Statement */}
      <div className="lhc-statement">
        <strong>ℹ️ {b.lhcStatement}</strong>
      </div>

      {/* Plain English Explanation */}
      <div className="explanation-section">
        <h2>How This Quote Was Calculated</h2>
        <div className="explanation-text">
          <p>
            This quote is for <strong>{quote.cover_type}</strong> cover
            with <strong>{b.hospitalCover}</strong> hospital
            and <strong>{b.extrasCover}</strong> extras.
          </p>

          {b.hospitalCover !== 'None' && (
            <p>
              <strong>Hospital cover</strong> is priced at ${b.applicant1.hospitalBasePrice.toFixed(2)} per adult per month
              ({b.hospitalCover} tier).
              {b.applicant1.lhcLoadingPercent > 0 && (
                <> Applicant 1 (age {b.applicant1.age}) has a {b.applicant1.lhcLoadingPercent}% Lifetime Health Cover
                loading because they did not have prior hospital cover, bringing their hospital cost
                to ${b.applicant1.hospitalWithLoading.toFixed(2)}/month.</>
              )}
              {b.applicant1.lhcLoadingPercent === 0 && b.applicant1.coverHistory === 'Yes' && (
                <> Applicant 1 has no LHC loading because they had prior hospital cover.</>
              )}
              {b.applicant1.lhcLoadingPercent === 0 && b.applicant1.coverHistory === 'No' && b.applicant1.age <= 30 && (
                <> Applicant 1 has no LHC loading because they are aged 30 or under.</>
              )}
              {b.applicant2 && b.applicant2.lhcLoadingPercent > 0 && (
                <> Applicant 2 (age {b.applicant2.age}) has a {b.applicant2.lhcLoadingPercent}% LHC loading,
                bringing their hospital cost to ${b.applicant2.hospitalWithLoading.toFixed(2)}/month.</>
              )}
              {b.applicant2 && b.applicant2.lhcLoadingPercent === 0 && b.applicant2.coverHistory === 'Yes' && (
                <> Applicant 2 has no LHC loading because they had prior hospital cover.</>
              )}
            </p>
          )}

          {b.extrasCover !== 'None' && (
            <p>
              <strong>Extras cover</strong> ({b.extrasCover}) is ${b.extrasBasePrice.toFixed(2)} per adult per month,
              totalling ${b.extrasTotal.toFixed(2)}/month for {b.adultCount} adult{b.adultCount > 1 ? 's' : ''}.
            </p>
          )}

          {b.familyFee > 0 && (
            <p>
              A <strong>family upgrade fee</strong> of ${b.familyFee.toFixed(2)}/month is added to cover dependent
              children under the policy.
            </p>
          )}

          <p>
            The <strong>monthly premium</strong> is ${b.monthlyPremium.toFixed(2)}
            {b.hospitalCover !== 'None' && <> (${b.hospitalTotal.toFixed(2)} hospital</>}
            {b.extrasCover !== 'None' && <> + ${b.extrasTotal.toFixed(2)} extras</>}
            {b.familyFee > 0 && <> + ${b.familyFee.toFixed(2)} family fee</>}
            {b.hospitalCover !== 'None' && <>)</>}.
          </p>

          <p>
            The <strong>yearly premium before discount</strong> is ${b.monthlyPremium.toFixed(2)} × 12
            = ${b.yearlyBeforeDiscount.toFixed(2)}.
          </p>

          {b.paymentFrequency === 'Yearly' ? (
            <p>
              With a <strong>{b.annualDiscountPercent}% annual discount</strong> for paying yearly, the
              final yearly premium is ${b.yearlyBeforeDiscount.toFixed(2)} × {(1 - b.annualDiscountPercent / 100).toFixed(2)} = <strong>${b.yearlyAfterDiscount.toFixed(2)}</strong>.
            </p>
          ) : (
            <p>
              Payment is <strong>monthly</strong>, so no annual discount is applied.
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="notes-section">
          <h3>Notes</h3>
          <p>{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
