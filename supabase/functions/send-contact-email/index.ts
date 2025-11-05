// Declare Deno global to resolve type errors.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_URL = 'https://api.resend.com/emails';
const TARGET_EMAIL = 'martintazlari@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // IMPORTANT: For best results, verify a domain with Resend and use an email from that domain.

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing required environment variables.");
    }

    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      throw new Error("Missing required form fields.");
    }

    // Save a copy to the database
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert({
      name,
      email,
      message,
    });

    if (dbError) {
      console.error("Error saving contact message to DB:", dbError);
      // We can continue to send the email even if the DB save fails
    }

    // Send the email via Resend
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `AI Game Scanner <${FROM_EMAIL}>`,
        to: [TARGET_EMAIL],
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h1>New Message via AI Game Scanner Contact Form</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr>
          <h2>Message:</h2>
          <p style="white-space: pre-wrap;">${message}</p>
        `,
        reply_to: email,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error("Error from Resend API:", errorData);
      throw new Error(`Failed to send email. Status: ${resendResponse.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error in send-contact-email function:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
