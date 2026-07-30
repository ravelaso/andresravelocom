import type { APIRoute } from 'astro';
import { env } from "cloudflare:workers";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { name, email, message, token } = await request.json();

        if (!name || !email || !message || !token) {
            return new Response(JSON.stringify({ error: "All fields are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const turnstile = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    secret: env.TURNSTILE_SECRET_KEY,
                    response: token,
                }),
            }
        );
        const turnstileResult = await turnstile.json();

        if (!turnstileResult.success) {
            return new Response(JSON.stringify({ error: "Verification failed. Please try again." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const toEmail = env.CONTACT_EMAIL;
        const resendPayload = {
            from: toEmail,
            to: [toEmail],
            subject: `New inquiry from ${name}`,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
            reply_to: email,
        };

        const resend = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
            },
            body: JSON.stringify(resendPayload),
        });

        if (!resend.ok) {
            const err = await resend.text();
            console.error("Resend error:", err);
            return new Response(JSON.stringify({ error: "Failed to send message. Please try again." }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Contact API error:", err);
        return new Response(JSON.stringify({ error: "Something went wrong" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
