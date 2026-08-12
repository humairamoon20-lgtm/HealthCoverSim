import { useState, useEffect } from 'react';

/**
 * QuoteForm — Shared form component used by both Create and Edit pages.
 * Handles conditional rendering of Applicant 2 fields and frontend validation.
 */
export default function QuoteForm({ initialData, onSubmit, submitLabel }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    cover_type: 'Single',
    applicant1_age: '',
    applicant1_cover_history: 'Yes',
    applicant2_age: '',
    applicant2_cover_history: 'Yes',
    hospital_cover: 'None',
    extras_cover: 'None',
    payment_frequency: 'Monthly',
    annual_discount: 0,
    notes: ''
  });

  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        customer_name: initialData.customer_name || '',
        cover_type: initialData.cover_type || 'Single',
        applicant1_age: initialData.applicant1_age ?? '',
        applicant1_cover_history: initialData.applicant1_cover_history || 'Yes',
        applicant2_age: initialData.applicant2_age ?? '',
        applicant2_cover_history: initialData.applicant2_cover_history || 'Yes',
        hospital_cover: initialData.hospital_cover || 'None',
        extras_cover: initialData.extras_cover || 'None',
        payment_frequency: initialData.payment_frequency || 'Monthly',
        annual_discount: initialData.annual_discount ?? 0,
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const needsApplicant2 = formData.cover_type === 'Couple' || formData.cover_type === 'Family';

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors.length > 0) setErrors([]);
  }

  function validate() {
    const errs = [];

    if (!formData.customer_name.trim()) {
      errs.push('Customer name is required.');
    }

    const age1 = parseInt(formData.applicant1_age, 10);
    if (isNaN(age1) || age1 < 18 || age1 > 100) {
      errs.push('Applicant 1 age must be between 18 and 100.');
    }

    if (needsApplicant2) {
      const age2 = parseInt(formData.applicant2_age, 10);
      if (isNaN(age2) || age2 < 18 || age2 > 100) {
        errs.push('Applicant 2 age must be between 18 and 100.');
      }
    }

    if (needsApplicant2 && !formData.applicant2_cover_history) {
      errs.push('Applicant 2 hospital cover history is required for Couple and Family cover.');
    }

    // Checked regardless of frequency so the stored value can never fall outside 0–10%,
    // which is what the backend enforces too.
    const discount = parseFloat(formData.annual_discount);
    if (isNaN(discount) || discount < 0 || discount > 10) {
      errs.push('Annual discount must be between 0% and 10%.');
    }

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        applicant1_age: parseInt(formData.applicant1_age, 10),
        annual_discount: parseFloat(formData.annual_discount) || 0
      };

      if (needsApplicant2) {
        dataToSend.applicant2_age = parseInt(formData.applicant2_age, 10);
      } else {
        dataToSend.applicant2_age = null;
        dataToSend.applicant2_cover_history = null;
      }

      await onSubmit(dataToSend);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors([err.message || 'Something went wrong.']);
      }
    } finally {
      setSubmitting(false);
    }
  }

  // noValidate turns off the browser's native popups so our own validate() runs and reports
  // every problem at once in the summary box, rather than the browser blocking submit and
  // showing one tooltip at a time. The backend re-validates everything regardless.
  return (
    <form className="quote-form" onSubmit={handleSubmit} noValidate>
      {errors.length > 0 && (
        <div className="error-box">
          <strong>Please fix the following:</strong>
          <ul>
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="customer_name">Customer Name *</label>
        <input
          type="text"
          id="customer_name"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          placeholder="Enter customer name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cover_type">Cover Type *</label>
        <select id="cover_type" name="cover_type" value={formData.cover_type} onChange={handleChange}>
          <option value="Single">Single</option>
          <option value="Couple">Couple</option>
          <option value="Family">Family</option>
        </select>
      </div>

      <fieldset className="applicant-fieldset">
        <legend>Applicant 1</legend>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="applicant1_age">Age *</label>
            <input
              type="number"
              id="applicant1_age"
              name="applicant1_age"
              value={formData.applicant1_age}
              onChange={handleChange}
              min="18"
              max="100"
              placeholder="18–100"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="applicant1_cover_history">Hospital Cover History *</label>
            <select
              id="applicant1_cover_history"
              name="applicant1_cover_history"
              value={formData.applicant1_cover_history}
              onChange={handleChange}
            >
              <option value="Yes">Yes — had cover before</option>
              <option value="No">No — never had cover</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>
        </div>
      </fieldset>

      {needsApplicant2 && (
        <fieldset className="applicant-fieldset">
          <legend>Applicant 2</legend>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="applicant2_age">Age *</label>
              <input
                type="number"
                id="applicant2_age"
                name="applicant2_age"
                value={formData.applicant2_age}
                onChange={handleChange}
                min="18"
                max="100"
                placeholder="18–100"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="applicant2_cover_history">Hospital Cover History *</label>
              <select
                id="applicant2_cover_history"
                name="applicant2_cover_history"
                value={formData.applicant2_cover_history}
                onChange={handleChange}
              >
                <option value="Yes">Yes — had cover before</option>
                <option value="No">No — never had cover</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
          </div>
        </fieldset>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="hospital_cover">Hospital Cover *</label>
          <select id="hospital_cover" name="hospital_cover" value={formData.hospital_cover} onChange={handleChange}>
            <option value="None">None — $0</option>
            <option value="Basic">Basic — $90/month</option>
            <option value="Bronze">Bronze — $120/month</option>
            <option value="Silver">Silver — $160/month</option>
            <option value="Gold">Gold — $220/month</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="extras_cover">Extras Cover *</label>
          <select id="extras_cover" name="extras_cover" value={formData.extras_cover} onChange={handleChange}>
            <option value="None">None — $0</option>
            <option value="Basic">Basic — $25/month</option>
            <option value="Standard">Standard — $45/month</option>
            <option value="Premium">Premium — $70/month</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="payment_frequency">Payment Frequency *</label>
          <select
            id="payment_frequency"
            name="payment_frequency"
            value={formData.payment_frequency}
            onChange={handleChange}
          >
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="annual_discount">
            Annual Discount % {formData.payment_frequency !== 'Yearly' && <span className="muted">(Yearly only)</span>}
          </label>
          <input
            type="number"
            id="annual_discount"
            name="annual_discount"
            value={formData.annual_discount}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.5"
            disabled={formData.payment_frequency !== 'Yearly'}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes..."
          rows="3"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving...' : (submitLabel || 'Create Quote')}
      </button>
    </form>
  );
}
