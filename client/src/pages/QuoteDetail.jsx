import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchQuote, deleteQuote } from '../utils/api';

/** Format a number as AUD with thousands separators, e.g. 5380.8 -> "$5,380.80" */
const money = (n) =>
  '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          <div className="premium-label">Estimated Monthly Premium</div>
          <div className="premium-amount">{money(b.monthlyPremium)}</div>
          <div className="premium-sub">per month · {b.coverType} cover</div>
          <div className="premium-note">
            Paying {b.paymentFrequency.toLowerCase()} — {b.paymentFrequency === 'Yearly'
              ? 'the annual discount is applied to the yearly total'
              : 'the annual discount does not apply'}
          </div>
        </div>
        <div className="premium-card premium-yearly">
          <div className="premium-label">
            {b.paymentFrequency === 'Yearly'
              ? `Yearly Premium (after ${b.annualDiscountPercent}% discount)`
              : 'Yearly Premium (no discount applied)'}
          </div>
          <div className="premium-amount">
            {money(b.paymentFrequency === 'Yearly' ? b.yearlyAfterDiscount : b.yearlyBeforeDiscount)}
          </div>
          <div className="premium-sub">per year</div>
          <div className="premium-note">
            {b.paymentFrequency === 'Yearly' ? (
              <>Before discount <s>{money(b.yearlyBeforeDiscount)}</s> — you save{' '}
              {money(b.yearlyBeforeDiscount - b.yearlyAfterDiscount)}</>
            ) : (
              <>Monthly premium × 12. Switch to yearly payment to apply a discount.</>
            )}
          </div>
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
                  <td>{money(b.applicant1.hospitalBasePrice)}</td>
                  <td>{b.applicant1.lhcLoadingPercent}%</td>
                  <td className="amount">{money(b.applicant1.hospitalWithLoading)}</td>
                </tr>
                {b.applicant2 && (
                  <tr>
                    <td>Applicant 2 (age {b.applicant2.age})</td>
                    <td>{money(b.applicant2.hospitalBasePrice)}</td>
                    <td>{b.applicant2.lhcLoadingPercent}%</td>
                    <td className="amount">{money(b.applicant2.hospitalWithLoading)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td colSpan="3"><strong>Hospital Total</strong></td>
                  <td className="amount"><strong>{money(b.hospitalTotal)}</strong></td>
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
                  <td>{money(b.extrasBasePrice)}/adult</td>
                  <td>× {b.adultCount}</td>
                  <td className="amount">{money(b.extrasTotal)}</td>
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
                  <td className="amount">{money(b.familyFee)}/month</td>
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
                <td className="amount">{money(b.hospitalTotal)}</td>
              </tr>
              <tr>
                <td>Extras cover</td>
                <td className="amount">{money(b.extrasTotal)}</td>
              </tr>
              {b.familyFee > 0 && (
                <tr>
                  <td>Family upgrade fee</td>
                  <td className="amount">{money(b.familyFee)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td><strong>Monthly Premium</strong></td>
                <td className="amount"><strong>{money(b.monthlyPremium)}</strong></td>
              </tr>
              <tr>
                <td>Yearly premium (before discount)</td>
                <td className="amount">{money(b.yearlyBeforeDiscount)}</td>
              </tr>
              {b.paymentFrequency === 'Yearly' && (
                <>
                  <tr>
                    <td>Annual discount ({b.annualDiscountPercent}%)</td>
                    <td className="amount discount">
                      −{money(b.yearlyBeforeDiscount - b.yearlyAfterDiscount)}
                    </td>
                  </tr>
                  <tr className="total-row final-total">
                    <td><strong>Yearly Premium (after {b.annualDiscountPercent}% discount)</strong></td>
                    <td className="amount"><strong>{money(b.yearlyAfterDiscount)}</strong></td>
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
              <strong>Hospital cover</strong> is priced at {money(b.applicant1.hospitalBasePrice)} per adult per month
              ({b.hospitalCover} tier).
              {b.applicant1.lhcLoadingPercent > 0 && (
                <> Applicant 1 (age {b.applicant1.age}) has a {b.applicant1.lhcLoadingPercent}% Lifetime Health Cover
                loading because they did not have prior hospital cover, bringing their hospital cost
                to {money(b.applicant1.hospitalWithLoading)}/month.</>
              )}
              {b.applicant1.lhcLoadingPercent === 0 && b.applicant1.coverHistory === 'Yes' && (
                <> Applicant 1 has no LHC loading because they had prior hospital cover.</>
              )}
              {b.applicant1.lhcLoadingPercent === 0 && b.applicant1.coverHistory === 'No' && b.applicant1.age <= 30 && (
                <> Applicant 1 has no LHC loading because they are aged 30 or under.</>
              )}
              {b.applicant2 && b.applicant2.lhcLoadingPercent > 0 && (
                <> Applicant 2 (age {b.applicant2.age}) has a {b.applicant2.lhcLoadingPercent}% LHC loading,
                bringing their hospital cost to {money(b.applicant2.hospitalWithLoading)}/month.</>
              )}
              {b.applicant2 && b.applicant2.lhcLoadingPercent === 0 && b.applicant2.coverHistory === 'Yes' && (
                <> Applicant 2 has no LHC loading because they had prior hospital cover.</>
              )}
            </p>
          )}

          {b.extrasCover !== 'None' && (
            <p>
              <strong>Extras cover</strong> ({b.extrasCover}) is {money(b.extrasBasePrice)} per adult per month,
              totalling {money(b.extrasTotal)}/month for {b.adultCount} adult{b.adultCount > 1 ? 's' : ''}.
            </p>
          )}

          {b.familyFee > 0 && (
            <p>
              A <strong>family upgrade fee</strong> of {money(b.familyFee)}/month is added to cover dependent
              children under the policy.
            </p>
          )}

          <p>
            The <strong>monthly premium</strong> is {money(b.monthlyPremium)}
            {b.hospitalCover !== 'None' && <> ({money(b.hospitalTotal)} hospital</>}
            {b.extrasCover !== 'None' && <> + {money(b.extrasTotal)} extras</>}
            {b.familyFee > 0 && <> + {money(b.familyFee)} family fee</>}
            {b.hospitalCover !== 'None' && <>)</>}.
          </p>

          <p>
            The <strong>yearly premium before discount</strong> is {money(b.monthlyPremium)} × 12
            = {money(b.yearlyBeforeDiscount)}.
          </p>

          {b.paymentFrequency === 'Yearly' ? (
            <p>
              With a <strong>{b.annualDiscountPercent}% annual discount</strong> for paying yearly, the
              final yearly premium is {money(b.yearlyBeforeDiscount)} × {(1 - b.annualDiscountPercent / 100).toFixed(2)} = <strong>{money(b.yearlyAfterDiscount)}</strong>.
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
