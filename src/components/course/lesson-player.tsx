"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { VideoPlayer } from "./video-player";
import { Button } from "@/components/ui/button";
import { saveLessonProgress } from "@/app/(student)/dashboard/courses/actions";
import { useToast } from "@/components/ui/toast";

export function LessonPlayer({
  courseId,
  lessonId,
  position,
  completed,
  quizRequired = false,
}: {
  courseId: string;
  lessonId: string;
  position: number;
  completed: boolean;
  quizRequired?: boolean;
}) {
  const [done, setDone] = useState(completed);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  async function complete() {
    if (pending) return;
    setPending(true);
    try {
      // Completion never overwrites the independently saved playback position.
      const result = await saveLessonProgress(courseId, lessonId, null, true);
      if (!result.ok) throw new Error("save");
      setDone(true);
      toast({ message: "Сабақ аяқталды" });
      setError("");
      router.refresh();
    } catch {
      toast({
        message: "Қате орын алды",
        description: "Прогресс сақталмады. Қайта көріңіз.",
        error: true,
      });
      setError("Прогресс сақталмады. Қайта көріңіз.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <VideoPlayer lessonId={lessonId} position={position} />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted">Сабақты аяқтап, біліміңді бекіт.</p>
        <Button disabled={done || completed || pending || quizRequired} onClick={() => void complete()}>
          {pending ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Check size={17} />
          )}{" "}
          {quizRequired ? "Алдымен тесттен өтіңіз" : done || completed ? "Сабақ аяқталды" : "Сабақты аяқтадым"}
        </Button>
      </div>
      {done && (
        <p role="status" className="mt-3 text-sm text-brand">
          Сабақ аяқталды. Прогресс сақталды.
        </p>
      )}
      {error && (
        <div role="alert" className="mt-3 text-sm text-red-700">
          <p>{error}</p>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => void complete()}
          >
            Қайта сақтау
          </Button>
        </div>
      )}
    </>
  );
}
