"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ContactSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section id="contact" className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-sm md:p-10">
        <h2 className="text-2xl font-bold text-puce-red">Join the waitlist</h2>
        <p className="mt-2 text-text-muted">
          Get early updates on new features and the mobile app launch.
        </p>
        {submitted ? (
          <p className="mt-6 rounded-lg bg-orange-yellow/30 px-4 py-3 text-puce-red">
            Thanks — we will be in touch at {email}.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" className="w-full">
              Notify me
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
