"use client";
import Image from "next/image";
import { useState } from "react";
import { CourseArtwork } from "@/components/course/course-artwork";
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
        <>
          <CourseArtwork className="absolute h-full w-full" />
          <span className="absolute left-6 top-5 text-[9px] tracking-[.16em] text-brand">
            ВИДЕО КУРС / GEOMETRY
          </span>
        </>
      )}
    </div>
  );
}
