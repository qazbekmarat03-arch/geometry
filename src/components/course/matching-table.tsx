"use client";

import { useId, useState } from "react";
import { QuizText } from "./quiz-text";

export function MatchingTable({
  rows,
  options,
  value,
  onChange,
  disabled = false,
}: {
  rows: string[];
  options: string[];
  value?: number[];
  onChange?: (value: number[]) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [preview, setPreview] = useState<number[]>([]);
  const selected = value ?? preview;
  function choose(row: number, option: number) {
    const next = rows.map((_, i) => (i === row ? option : (selected[i] ?? -1)));
    if (onChange) onChange(next);
    else setPreview(next);
  }
  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-line">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">
          Сәйкестендіру: әр сұраққа бір жауап таңдаңыз
        </caption>
        <thead className="bg-white/5">
          <tr>
            <th scope="col" className="w-[36%] border-r border-line p-3 sm:p-4">
              Сұрақ
            </th>
            <th scope="col" className="p-3 sm:p-4">
              Жауап нұсқалары
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-line">
              <th
                scope="row"
                className="border-r border-line p-2 align-top font-normal sm:p-4"
              >
                <span className="mb-2 block font-semibold text-brand">
                  {r + 1})
                </span>
                <div className="min-w-0 overflow-x-auto">
                  <QuizText text={row} />
                </div>
              </th>
              <td className="p-2 sm:p-4">
                <fieldset disabled={disabled} className="min-w-0 space-y-2">
                  <legend className="sr-only">{r + 1}-жолдың жауабы</legend>
                  {options.map((option, i) => (
                    <label
                      key={i}
                      className={`flex min-h-11 min-w-0 items-start gap-2 rounded-xl border p-2 sm:p-3 ${selected[r] === i ? "border-brand bg-brand/15" : "border-line hover:bg-white/5"} ${disabled ? "" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name={`${id}-row-${r}`}
                        value={i}
                        checked={selected[r] === i}
                        onChange={() => choose(r, i)}
                        className="mt-1 shrink-0 accent-emerald-400"
                      />
                      <span className="shrink-0 font-semibold">
                        {"ABCDEF"[i]})
                      </span>
                      <div className="min-w-0 overflow-x-auto">
                        <QuizText text={option} />
                      </div>
                    </label>
                  ))}
                </fieldset>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
