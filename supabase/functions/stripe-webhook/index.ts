// Declare Deno global to resolve type errors in environments where Deno types are not automatically available.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// FIX: Pin supabase-js version to fix type resolution issues.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import Stripe from "https://esm.sh/stripe@11.1.0";

serve(async (req) => {
  try {
    // Initialize clients within the try block to catch secret key errors
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const litePriceId = Deno.env.get("STRIPE_LITE_PRICE_ID");
    const premiumPriceId = Deno.env.get("STRIPE_PREMIUM_PRICE_ID");

    const signature = req.headers.get("Stripe-Signature");
    const body = await req.text();
    
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(err.message, { status: 400 });
    }

    const subscription = event.data.object as Stripe.Subscription;
    let customerId: string | null = null;

    if (typeof subscription.customer === 'string') {
      customerId = subscription.customer;
    } else if (subscription.customer && 'id' in subscription.customer) {
      customerId = subscription.customer.id;
    }

    if (!customerId) {
        console.error('Webhook Error: Could not extract customer ID from subscription object.');
        return new Response('Customer ID missing', { status: 400 });
    }
    
    const customer = await stripe.customers.retrieve(customerId);

    if ('deleted' in customer && customer.deleted) {
        console.warn(`Webhook Warning: Customer ${customerId} is deleted. Cannot update profile.`);
        return new Response(JSON.stringify({ received: true, message: 'Customer deleted' }), { status: 200 });
    }
    
    const userId = (customer as Stripe.Customer).metadata.supabase_id;
    if (!userId) {
        console.error(`Webhook Error: supabase_id not found in metadata for customer ${customerId}`);
        return new Response('User ID missing in customer metadata', { status: 400 });
    }


    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const priceId = subscription.items.data[0].price.id;
        
        const subscriptionTier = priceId === litePriceId ? 'lite' 
                             : priceId === premiumPriceId ? 'premium' 
                             : 'free';

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: subscriptionTier })
          .eq("id", userId);
        if (error) throw error;
        break;
      }
      
      case "customer.subscription.deleted": {
         const { error } = await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: 'free' })
          .eq("id", userId);
        if (error) throw error;
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    return new Response(err.message, { status: 400 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});