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
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!
      );
    } catch (err) {
      return new Response(err.message, { status: 400 });
    }

    const customer = await stripe.customers.retrieve(event.data.object.customer);
    const userId = customer.metadata.supabase_id;

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0].price.id;
        
        const subscriptionTier = priceId === litePriceId ? 'lite' 
                             : priceId === premiumPriceId ? 'premium' 
                             : 'free';

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: subscriptionTier })
          .eq("id", userId);
        break;
      }
      
      case "customer.subscription.deleted": {
         await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: 'free' })
          .eq("id", userId);
        break;
      }
    }
  } catch (err) {
    console.log("Webhook processing error:", err.message);
    return new Response(err.message, { status: 400 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});