import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

// Note: This key is publishable
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51PVA0gRxPlOC3UKk6a9pASeK7q7Z1BfM3Wn2n6mhV4n5kBlj5jYd7j02QPQW2fGdnkPB8HTobJ7Y4Yj3oG6WjA9O00sJb2ReoG';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export const redirectToCheckout = async (planId: 'lite' | 'premium') => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("User not logged in.");

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { planId },
        });

        if (error) throw error;
        
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe.js failed to load.");

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (stripeError) throw stripeError;

    } catch (error) {
        console.error("Error redirecting to checkout:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
};

export const redirectToCustomerPortal = async () => {
    try {
        const { data, error } = await supabase.functions.invoke('create-portal-link');
        if (error) throw error;

        window.location.href = data.url;
    } catch (error) {
        console.error("Error redirecting to customer portal:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
};