// Declare Deno global to resolve type errors.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import Stripe from "https://esm.sh/stripe@14.21.0";

// --- ENV VARS ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const STRIPE_SECRET = Deno.env.get("STRIPE_SECRET");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const LITE_PRICE_ID = Deno.env.get("STRIPE_LITE_PRICE_ID");
const PREMIUM_PRICE_ID = Deno.env.get("STRIPE_PREMIUM_PRICE_ID");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET || !LITE_PRICE_ID || !PREMIUM_PRICE_ID) {
  console.error("❌ Missing one or more required environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient()
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Helper: Get user from JWT ---
async function getSupabaseUser(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header.");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error) throw new Error(`Authentication error: ${error.message}`);
  if (!user) throw new Error("User not found.");
  return user;
}

// --- Helper: Get or create Stripe customer and update profile ---
async function getOrCreateStripeCustomer(user) {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (profile?.stripe_customer_id) {
        return profile.stripe_customer_id;
    }

    const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_id: user.id },
    });

    const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", user.id);

    if (updateError) throw updateError;
    
    return customer.id;
}


// --- Main request handler ---
serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1/stripe-integration', ''); // Adjust path for local vs deployed
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- WEBHOOK (Public) ---
    if (path === "/stripe/webhook" && req.method === "POST") {
      const sig = req.headers.get("stripe-signature");
      const body = await req.text();
      let event;
      try {
        event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error("❌ Stripe signature verification failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }

      const subscription = event.data.object;
      const customerId = subscription.customer;

      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
          return new Response('Customer deleted', { status: 200 });
      }
      
      const userId = customer.metadata.supabase_id;
      if (!userId) {
          throw new Error(`supabase_id not found in metadata for customer ${customerId}`);
      }

      // Update user's subscription tier in Supabase
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const priceId = subscription.items.data[0].price.id;
          const tier = priceId === LITE_PRICE_ID ? 'lite' : priceId === PREMIUM_PRICE_ID ? 'premium' : 'free';
          const { error } = await supabaseAdmin.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
          if (error) throw error;
          console.log(`✅ Profile updated for ${userId} to ${tier}`);
          break;
        }
        case "customer.subscription.deleted": {
          const { error } = await supabaseAdmin.from("profiles").update({ subscription_tier: 'free' }).eq("id", userId);
          if (error) throw error;
          console.log(`✅ Profile updated for ${userId} to free`);
          break;
        }
      }

      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- CHECKOUT (Authenticated) ---
    if (path === "/stripe/create-checkout" && req.method === "POST") {
      const user = await getSupabaseUser(req);
      const customerId = await getOrCreateStripeCustomer(user);
      const { price, success_url, cancel_url } = await req.json();

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        success_url,
        cancel_url,
        line_items: [{ price, quantity: 1 }],
      });
      return new Response(JSON.stringify(session), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- PORTAL (Authenticated) ---
    if (path === "/stripe/portal" && req.method === "GET") {
      const user = await getSupabaseUser(req);
      const customerId = await getOrCreateStripeCustomer(user);
      const return_url = url.searchParams.get("return_url");

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url,
      });
      return new Response(JSON.stringify(portalSession), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Default 404 ---
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error(`❌ Error in ${path}:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
