import type { APIRoute } from 'astro';
import { env } from "cloudflare:workers";
import type { ContactPayload, TurnstileResult } from '@/types/contact';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { name, email, message, token } = (await request.json()) as ContactPayload;

        if (!name || !email || !message || !token) {
            return new Response(JSON.stringify({ error: "All fields are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Canonical server-side Turnstile validation. Tokens are single-use;
        // a replayed token is rejected with timeout-or-duplicate.
        let turnstileResult: TurnstileResult;
        try {
            const clientIp =
                request.headers.get("CF-Connecting-IP") ??
                request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
                undefined;

            const turnstile = await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        secret: env.TURNSTILE_SECRET_KEY,
                        response: token,
                        ...(clientIp ? { remoteip: clientIp } : {}),
                    }),
                }
            );

            if (!turnstile.ok) {
                throw new Error(`siteverify returned HTTP ${turnstile.status}`);
            }
            turnstileResult = (await turnstile.json()) as TurnstileResult;
        } catch (err) {
            // Network error, non-2xx, or non-JSON body from siteverify. Fail closed.
            console.error("Turnstile siteverify error:", err);
            return new Response(JSON.stringify({ error: "Something went wrong" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!turnstileResult.success) {
            console.error("Turnstile validation failed:", turnstileResult["error-codes"]);
            return new Response(JSON.stringify({ error: "Verification failed. Please try again." }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const toEmail = env.CONTACT_EMAIL;
        const resendPayload = {
            from: `${name} via Contact Form <${toEmail}>`,
            to: [toEmail],
            subject: `New inquiry from ${name} (${email})`,
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
