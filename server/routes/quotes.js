const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculateQuote } = require('../utils/calculateQuote');


// Validation Helper


const VALID_COVER_TYPES = ['Single', 'Couple', 'Family'];
const VALID_HOSPITAL = ['None', 'Basic', 'Bronze', 'Silver', 'Gold'];
const VALID_EXTRAS = ['None', 'Basic', 'Standard', 'Premium'];
const VALID_HISTORY = ['Yes', 'No', 'Not sure'];
const VALID_FREQUENCY = ['Monthly', 'Yearly'];

function validateQuoteData(data) {
  const errors = [];

  // Customer name
  if (!data.customer_name || typeof data.customer_name !== 'string' || data.customer_name.trim() === '') {
    errors.push('Customer name is required.');
  }

  // Cover type
  if (!VALID_COVER_TYPES.includes(data.cover_type)) {
    errors.push('Cover type must be one of: Single, Couple, Family.');
  }

  // Applicant 1 age
  const age1 = parseInt(data.applicant1_age, 10);
  if (isNaN(age1) || age1 < 18 || age1 > 100) {
    errors.push('Applicant 1 age must be a number between 18 and 100.');
  }

  // Applicant 1 cover history
  if (!VALID_HISTORY.includes(data.applicant1_cover_history)) {
    errors.push('Applicant 1 hospital cover history must be one of: Yes, No, Not sure.');
  }

  // Applicant 2 fields (required for Couple/Family)
  if (data.cover_type === 'Couple' || data.cover_type === 'Family') {
    const age2 = parseInt(data.applicant2_age, 10);
    if (isNaN(age2) || age2 < 18 || age2 > 100) {
      errors.push('Applicant 2 age is required for Couple/Family cover and must be between 18 and 100.');
    }
    if (!VALID_HISTORY.includes(data.applicant2_cover_history)) {
      errors.push('Applicant 2 hospital cover history is required for Couple/Family cover.');
    }
  }

  // Hospital cover
  if (!VALID_HOSPITAL.includes(data.hospital_cover)) {
    errors.push('Hospital cover must be one of: None, Basic, Bronze, Silver, Gold.');
  }

  // Extras cover
  if (!VALID_EXTRAS.includes(data.extras_cover)) {
    errors.push('Extras cover must be one of: None, Basic, Standard, Premium.');
  }

  // Payment frequency
  if (!VALID_FREQUENCY.includes(data.payment_frequency)) {
    errors.push('Payment frequency must be one of: Monthly, Yearly.');
  }

  // Annual discount
  if (data.annual_discount !== undefined && data.annual_discount !== null && data.annual_discount !== '') {
    const discount = parseFloat(data.annual_discount);
    if (isNaN(discount) || discount < 0 || discount > 10) {
      errors.push('Annual discount must be between 0% and 10%.');
    }
  }

  return errors;
}


// POST /api/quotes Create a new quote

router.post('/', (req, res) => {
  try {
    const errors = validateQuoteData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const {
      customer_name,
      cover_type,
      applicant1_age,
      applicant1_cover_history,
      applicant2_age,
      applicant2_cover_history,
      hospital_cover,
      extras_cover,
      payment_frequency,
      annual_discount,
      notes
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO quotes (
        customer_name, cover_type,
        applicant1_age, applicant1_cover_history,
        applicant2_age, applicant2_cover_history,
        hospital_cover, extras_cover,
        payment_frequency, annual_discount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      customer_name.trim(),
      cover_type,
      parseInt(applicant1_age, 10),
      applicant1_cover_history,
      (cover_type === 'Single') ? null : (applicant2_age ? parseInt(applicant2_age, 10) : null),
      (cover_type === 'Single') ? null : (applicant2_cover_history || null),
      hospital_cover,
      extras_cover,
      payment_frequency,
      parseFloat(annual_discount) || 0,
      notes || null
    );

    const newQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newQuote);
  } catch (err) {
    console.error('Error creating quote:', err.message);
    res.status(500).json({ error: 'Failed to create quote.' });
  }
});


// GET /api/quotes — List all quotes

router.get('/', (req, res) => {
  try {
    const quotes = db.prepare('SELECT * FROM quotes ORDER BY created_at DESC').all();

    
    const withPremiums = quotes.map((quote) => {
      try {
        const breakdown = calculateQuote(quote);
        return {
          ...quote,
          monthly_premium: breakdown.monthlyPremium,
          yearly_premium: quote.payment_frequency === 'Yearly'
            ? breakdown.yearlyAfterDiscount
            : breakdown.yearlyBeforeDiscount,
          has_warnings: breakdown.warnings.length > 0
        };
      } catch {
        
        return { ...quote, monthly_premium: null, yearly_premium: null, has_warnings: false };
      }
    });

    res.json(withPremiums);
  } catch (err) {
    console.error('Error fetching quotes:', err.message);
    res.status(500).json({ error: 'Failed to fetch quotes.' });
  }
});


// GET /api/quotes/:id — Get a single quote with calculation

router.get('/:id', (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found.' });
    }

    // Calculate the premium breakdown
    const breakdown = calculateQuote(quote);

    res.json({ ...quote, breakdown });
  } catch (err) {
    console.error('Error fetching quote:', err.message);
    res.status(500).json({ error: 'Failed to fetch quote.' });
  }
});


// PUT /api/quotes/:id — Update an existing quote

router.put('/:id', (req, res) => {
  try {
    // Check quote exists
    const existing = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Quote not found.' });
    }

    const errors = validateQuoteData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const {
      customer_name,
      cover_type,
      applicant1_age,
      applicant1_cover_history,
      applicant2_age,
      applicant2_cover_history,
      hospital_cover,
      extras_cover,
      payment_frequency,
      annual_discount,
      notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE quotes SET
        customer_name = ?,
        cover_type = ?,
        applicant1_age = ?,
        applicant1_cover_history = ?,
        applicant2_age = ?,
        applicant2_cover_history = ?,
        hospital_cover = ?,
        extras_cover = ?,
        payment_frequency = ?,
        annual_discount = ?,
        notes = ?
      WHERE id = ?
    `);

    stmt.run(
      customer_name.trim(),
      cover_type,
      parseInt(applicant1_age, 10),
      applicant1_cover_history,
      (cover_type === 'Single') ? null : (applicant2_age ? parseInt(applicant2_age, 10) : null),
      (cover_type === 'Single') ? null : (applicant2_cover_history || null),
      hospital_cover,
      extras_cover,
      payment_frequency,
      parseFloat(annual_discount) || 0,
      notes || null,
      req.params.id
    );

    const updatedQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    res.json(updatedQuote);
  } catch (err) {
    console.error('Error updating quote:', err.message);
    res.status(500).json({ error: 'Failed to update quote.' });
  }
});


// DELETE /api/quotes/:id — Delete a quote

router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Quote not found.' });
    }

    db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Quote deleted successfully.' });
  } catch (err) {
    console.error('Error deleting quote:', err.message);
    res.status(500).json({ error: 'Failed to delete quote.' });
  }
});

module.exports = router;
