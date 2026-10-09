"use client";
import Image from "next/image";
import { useState } from "react";
import { CourseCover } from "@/components/course/course-cover";
export function CourseThumbnail({
  url,
  title,
}: {
  url: string | null;
  title: string;
}) {
  const [failed, setFailed] = useState(false);
  const safe =
    url?.startsWith("https://") ||
    (url?.startsWith("/") && !url.startsWith("//"));
  return (
    <div className="course-art geometry-grid relative flex aspect-[1.85] items-center justify-center overflow-hidden">
      {safe && !failed ? (
        <Image
          src={url!}
          alt={title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <CourseCover title={title} />
      )}
    </div>
  );
}
