import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

// Note: This key is publishable
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51PVA0gRxPlOC3UKk6a9pASeK7q7Z1BfM3Wn2n6mhV4n5kBlj5jYd7j02QPQW2fGdnkPB8HTobJ7Y4Yj3oG6WjA9O00sJb2ReoG';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const getApiHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("User not authenticated.");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };
};

// Helper to handle both JSON and text error responses from functions
const handleErrorResponse = async (response: Response, defaultMessage: string) => {
    const errorText = await response.text();
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || defaultMessage);
    } catch {
        // If parsing fails, it's a plain text error
        throw new Error(errorText || defaultMessage);
    }
}

export const redirectToCheckout = async (planId: 'lite' | 'premium') => {
    try {
        const headers = await getApiHeaders();

        // Call the dedicated 'create-checkout-session' function
        const response = await fetch('/functions/v1/create-checkout-session', {
            method: 'POST',
            headers,
            body: JSON.stringify({ planId }) // Send planId as expected by the function
        });

        if (!response.ok) {
            await handleErrorResponse(response, 'Failed to create checkout session.');
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
        // Call the dedicated 'create-portal-link' function
        const response = await fetch('/functions/v1/create-portal-link', {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            await handleErrorResponse(response, 'Failed to create portal session.');
        }

        const portalSession = await response.json();
        window.location.href = portalSession.url;
    } catch (error) {
        console.error("Error redirecting to customer portal:", error);
        alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
};