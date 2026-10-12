"use client";
import { useState } from "react";
import { changePracticeAccess } from "@/app/(admin)/admin/practice/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
export function PracticeAccess({
  id,
  emails,
}: {
  id: string;
  emails: string[];
}) {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  const router = useRouter();
  async function change(value: string, grant: boolean) {
    if (
      !grant &&
      !window.confirm("Осы оқушының нұсқаға қолжетімділігін жабу керек пе?")
    )
      return;
    setPending(true);
    try {
      const r = await changePracticeAccess(id, value, grant);
      setMessage(r.message);
      if (r.ok) router.refresh();
    } catch {
      setMessage("Қате орын алды. Қайта көріңіз.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mt-8 rounded-3xl border border-line p-6">
      <h2 className="text-xl">Қолжетімділік</h2>
      <p className="my-3 text-sm text-muted">
        Ақылы нұсқаны алған оқушының Google аккаунтындағы email мекенжайын
        енгізіңіз. Тегін нұсқалар барлық белсенді аккаунттарға ашық.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void change(email, true);
        }}
        className="flex flex-wrap gap-3"
      >
        <input
          type="email"
          required
          aria-label="Оқушының email мекенжайы"
          className="premium-input min-w-0 flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          Қолжетімділік ашу
        </Button>
      </form>
      <p role="status" className="my-3">
        {message}
      </p>
      <ul>
        {emails.map((e) => (
          <li
            key={e}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3"
          >
            <span className="break-all">{e}</span>
            <Button disabled={pending} onClick={() => change(e, false)}>
              Қолжетімділікті жабу
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
