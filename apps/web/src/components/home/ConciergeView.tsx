"use client";

import { useState } from "react";
import { CONCIERGE_COPY, type FeatureRequestCategory } from "@bookmarked/utils/homeConcierge";
import { submitFeatureRequest, submitSupportTicket } from "@/lib/services/homeConcierge";
import { Button } from "@/components/ui/Button";

const CATEGORIES: FeatureRequestCategory[] = [
  "reading",
  "social",
  "maps",
  "clubs",
  "billing",
  "other",
];

export function ConciergeView() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [category, setCategory] = useState<FeatureRequestCategory>("other");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface-card p-5">
        <h2 className="font-semibold text-puce-red">Priority Feature Request</h2>
        <p className="mt-2 text-sm text-text-muted">{CONCIERGE_COPY.featureRequestBlurb}</p>
        <p className="mt-1 text-xs text-text-muted">{CONCIERGE_COPY.noSla}</p>
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as FeatureRequestCategory)}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <textarea
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            placeholder="What problem are you trying to solve?"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            rows={3}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            rows={4}
          />
          <Button
            onClick={() => {
              void submitFeatureRequest({ title, description, category, problem }).then((result) => {
                setMessage(result.ok ? "Request sent with Home priority." : result.error ?? "Could not send.");
              });
            }}
          >
            Submit request
          </Button>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="font-semibold text-puce-red">{CONCIERGE_COPY.prioritySupportTag}</h2>
        <p className="mt-2 text-sm text-text-muted">
          The Priority Support tag is added on the server from your Home entitlement. You cannot set
          it yourself. {CONCIERGE_COPY.noSla}
        </p>
        <div className="mt-4 space-y-3">
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="How can we help?"
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            rows={6}
          />
          <Button
            variant="secondary"
            onClick={() => {
              void submitSupportTicket(subject, body).then((result) => {
                setMessage(
                  result.ok
                    ? `Ticket sent${result.priority_tag ? ` · ${result.priority_tag}` : ""}.`
                    : result.error ?? "Could not send."
                );
              });
            }}
          >
            Send ticket
          </Button>
        </div>
      </section>
      {message ? <p className="text-sm text-text-muted lg:col-span-2">{message}</p> : null}
    </div>
  );
}
