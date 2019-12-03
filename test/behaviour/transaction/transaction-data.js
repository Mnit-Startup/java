module.exports = {
  // email: email to send transaction receipt when mode of
  // payment is cash
  emailMissing: {
    email: '',
  },
  invalidEmail: {
    email: 'helloworld',
  },
  validEmail: {
    email: 'shreyance.jain@jalantechnologies.com',
  },
  // payement_mode: mode of payment for a particular transaction
  // accepted payment_modes: kadima, cash
  invalidPaymentMode: {
    mode_of_payment: '123xyz',
  },
  paymentModeCash: {
    mode_of_payment: 'cash',
  },
};
