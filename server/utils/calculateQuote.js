


// Pricing Tables (per adult, per month)

const HOSPITAL_PRICES = {
  'None': 0,
  'Basic': 90,
  'Bronze': 120,
  'Silver': 160,
  'Gold': 220
};

const EXTRAS_PRICES = {
  'None': 0,
  'Basic': 25,
  'Standard': 45,
  'Premium': 70
};

const FAMILY_UPGRADE_FEE = 30; // $30/month flat fee for Family cover


// LHC Loading Calculation


/**
 * @param {number} age - Applicant's age
 * @param {string} coverHistory - 'Yes', 'No', or 'Not sure'
 * @param {string} hospitalCover - Hospital cover tier
 * @returns {{ loadingPercent: number, warning: string|null }}
 */
function calculateLHCLoading(age, coverHistory, hospitalCover) {
  // No hospital cover selected 
  if (hospitalCover === 'None') {
    return { loadingPercent: 0, warning: null };
  }

  switch (coverHistory) {
    case 'Yes':
      // Had cover before 
      return { loadingPercent: 0, warning: null };

    case 'No':
      // Never had cover apply loading if age > 30
      if (age > 30) {
        const loading = (age - 30) * 2;
        return { loadingPercent: loading, warning: null };
      }
      return { loadingPercent: 0, warning: null };

    case 'Not sure':
      // Unknown history don't apply loading but show warning
      return {
        loadingPercent: 0,
        warning: `Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate.`
      };

    default:
      return { loadingPercent: 0, warning: null };
  }
}


// Full Quote Calculation


/**
 * @param {Object} quote - The quote input data
 * @returns {Object} Full breakdown with all line items
 */
function calculateQuote(quote) {
  const {
    cover_type,
    applicant1_age,
    applicant1_cover_history,
    applicant2_age,
    applicant2_cover_history,
    hospital_cover,
    extras_cover,
    payment_frequency,
    annual_discount
  } = quote;

  const hospitalBasePrice = HOSPITAL_PRICES[hospital_cover] || 0;
  const extrasBasePrice = EXTRAS_PRICES[extras_cover] || 0;
  const adultCount = cover_type === 'Single' ? 1 : 2;

  // Applicant 1 LHC 
  const app1LHC = calculateLHCLoading(applicant1_age, applicant1_cover_history, hospital_cover);
  const app1HospitalMonthly = hospitalBasePrice * (1 + app1LHC.loadingPercent / 100);

  // Applicant 2 LHC (only for Couple/Family)
  let app2LHC = { loadingPercent: 0, warning: null };
  let app2HospitalMonthly = 0;

  if (cover_type === 'Couple' || cover_type === 'Family') {
    app2LHC = calculateLHCLoading(
      applicant2_age,
      applicant2_cover_history,
      hospital_cover
    );
    app2HospitalMonthly = hospitalBasePrice * (1 + app2LHC.loadingPercent / 100);
  }

  // Hospital total
  const hospitalTotal = cover_type === 'Single'
    ? app1HospitalMonthly
    : app1HospitalMonthly + app2HospitalMonthly;

  // Extras total (no LHC loading on extras)
  const extrasTotal = extrasBasePrice * adultCount;

  // Family upgrade fee
  const familyFee = cover_type === 'Family' ? FAMILY_UPGRADE_FEE : 0;

  // Monthly premium
  const monthlyPremium = hospitalTotal + extrasTotal + familyFee;

  // Yearly calculations
  const yearlyBeforeDiscount = monthlyPremium * 12;
  const discountPercent = payment_frequency === 'Yearly' ? (annual_discount || 0) : 0;
  const yearlyAfterDiscount = yearlyBeforeDiscount * (1 - discountPercent / 100);

  // Warnings
  const warnings = [];
  if (app1LHC.warning) {
    warnings.push(`Applicant 1: ${app1LHC.warning}`);
  }
  if ((cover_type === 'Couple' || cover_type === 'Family') && app2LHC.warning) {
    warnings.push(`Applicant 2: ${app2LHC.warning}`);
  }

  // Build the result
  return {
    // Input summary
    coverType: cover_type,
    hospitalCover: hospital_cover,
    extrasCover: extras_cover,
    paymentFrequency: payment_frequency,
    adultCount,

    // Applicant 1 breakdown
    applicant1: {
      age: applicant1_age,
      coverHistory: applicant1_cover_history,
      lhcLoadingPercent: app1LHC.loadingPercent,
      hospitalBasePrice,
      hospitalWithLoading: parseFloat(app1HospitalMonthly.toFixed(2))
    },

    // Applicant 2 breakdown (null for Single)
    applicant2: (cover_type === 'Couple' || cover_type === 'Family') ? {
      age: applicant2_age,
      coverHistory: applicant2_cover_history,
      lhcLoadingPercent: app2LHC.loadingPercent,
      hospitalBasePrice,
      hospitalWithLoading: parseFloat(app2HospitalMonthly.toFixed(2))
    } : null,

    // Line items
    hospitalTotal: parseFloat(hospitalTotal.toFixed(2)),
    extrasTotal: parseFloat(extrasTotal.toFixed(2)),
    extrasBasePrice,
    familyFee,

    // Totals
    monthlyPremium: parseFloat(monthlyPremium.toFixed(2)),
    yearlyBeforeDiscount: parseFloat(yearlyBeforeDiscount.toFixed(2)),
    yearlyAfterDiscount: parseFloat(yearlyAfterDiscount.toFixed(2)),
    annualDiscountPercent: discountPercent,

    // Warnings and required statements
    warnings,
    lhcStatement: 'Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.'
  };
}

module.exports = { calculateQuote, HOSPITAL_PRICES, EXTRAS_PRICES };
