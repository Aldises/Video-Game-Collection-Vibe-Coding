import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

// Note: This key is publishable
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51PVA0gRxPlOC3UKk6a9pASeK7q7Z1BfM3Wn2n6mhV4n5kBlj5jYd7j02QPQW2fGdnkPB8HTobJ7Y4Yj3oG6WjA9O00sJb2ReoG';
const LITE_PRICE_ID = 'price_1PVA4zRxPlOC3UKk6fK0F9G7';
const PREMIUM_PRICE_ID = 'price_1PVA5ORxPlOC3UKkS1mC5q3Z';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const getApiHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("User not authenticated.");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
};

export const redirectToCheckout = async (planId: 'lite' | 'premium') => {
    try {
        const price = planId === 'lite' ? LITE_PRICE_ID : PREMIUM_PRICE_ID;
        const headers = await getApiHeaders();

        const response = await fetch('/functions/v1/stripe-integration/stripe/create-checkout', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                price,
                success_url: `${window.location.origin}/#subscription`,
                cancel_url: `${window.location.origin}/#subscription`,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create checkout session.');
        }

        const session = await response.json();
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe.js failed to load.");

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: session.id });
        if (stripeError) throw stripeError;

    } catch (error) {
        console.error("Error redirecting to checkout:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
};

export const redirectToCustomerPortal = async () => {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`/functions/v1/stripe-integration/stripe/portal?return_url=${window.location.origin}/#account`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || 'Failed to create portal session.');
        }

        const portalSession = await response.json();
        window.location.href = portalSession.url;
    } catch (error) {
        console.error("Error redirecting to customer portal:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
};
