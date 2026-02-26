import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual Stripe publishable key
// You can get this from the Stripe Dashboard
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample';

export const stripePromise = loadStripe(stripePublishableKey);

export const createCheckoutSession = async (_priceId: string, _userId: string) => {
    // This will call a Supabase Edge Function to create the session
    // We'll implement the edge function later
    return { sessionId: 'mock_session_id' };
};
