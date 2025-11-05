// Declare Deno global to resolve type errors.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { SMTPClient } from "https://deno.land/x/denomail@1.0.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The email address where contact form submissions will be sent.
const TARGET_EMAIL = 'martintazlari@gmail.com'; 
// The 'from' address should be from a domain you can send from, as configured in your SMTP provider.
const FROM_EMAIL = 'noreply@ai-game-scanner.com'; 

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase-provided SMTP settings from secrets
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Deno.env.get("SMTP_PORT");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing required SMTP or Supabase environment variables in project secrets. Please ensure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are set for your email provider (e.g., Resend).");
    }
    
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      throw new Error("Missing required form fields: name, email, and message.");
    }
    
    // Save a copy of the message to the database for backup.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError } = await supabaseAdmin.from('contact_messages').insert({
      name,
      email,
      message,
    });

    if (dbError) {
      console.error("Error saving contact message to DB:", dbError);
      // We can continue to send the email even if the DB save fails.
    }
    
    // Send email using the SMTP client and Supabase secrets
    const smtpClient = new SMTPClient({
        connection: {
            hostname: smtpHost,
            port: Number(smtpPort),
            // Use TLS, as recommended for most SMTP providers on port 465/587
            tls: true, 
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        },
    });
    
    await smtpClient.send({
      from: `AI Game Scanner <${FROM_EMAIL}>`,
      to: TARGET_EMAIL,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h1>New Message via AI Game Scanner Contact Form</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr>
        <h2>Message:</h2>
        <p style="white-space: pre-wrap;">${message}</p>
      `
    });

    await smtpClient.close();
    
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
