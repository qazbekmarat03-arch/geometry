"use client";
import { useEffect } from "react";

export function LandingMotion({ paused }: { paused: boolean }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || paused) return;
    let disposed = false;
    let cleanup = () => {};
    void Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("lenis"),
    ])
      .then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const root = document.querySelector<HTMLElement>(".geomind");
        if (!root) return;
        const lenis = new Lenis({
          duration: 0.85,
          smoothWheel: true,
          anchors: true,
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        const context = gsap.context(() => {
          gsap.from(".gm-hero-title > span", {
            y: 35,
            opacity: 0,
            filter: "blur(8px)",
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            clearProps: "all",
          });
          gsap.utils
            .toArray<HTMLElement>("[data-reveal]")
            .forEach((element) => {
              gsap.from(element, {
                y: 24,
                opacity: 0,
                duration: 0.65,
                clearProps: "all",
                scrollTrigger: {
                  trigger: element,
                  start: "top 96%",
                  once: true,
                },
              });
            });
          gsap.utils.toArray<HTMLElement>("[data-count]").forEach((element) => {
            const target = Number(element.dataset.count),
              value = { count: 0 };
            gsap.to(value, {
              count: target,
              duration: 1.2,
              ease: "power2.out",
              onUpdate: () => {
                element.textContent = String(Math.round(value.count)).padStart(
                  2,
                  "0",
                );
              },
              onComplete: () => {
                element.textContent = String(target).padStart(2, "0");
              },
              scrollTrigger: { trigger: element, start: "top 98%", once: true },
            });
          });
        }, root);
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
        const cursor = root.querySelector<HTMLElement>(".gm-cursor");
        const move = (event: PointerEvent) => {
          if (!fine.matches || event.pointerType !== "mouse") return;
          if (cursor) {
            cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
            cursor.style.opacity = ".6";
          }
          const card = (event.target as HTMLElement).closest<HTMLElement>(
            "[data-tilt], [data-magnetic]",
          );
          if (!card) return;
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5,
            y = (event.clientY - bounds.top) / bounds.height - 0.5;
          card.style.setProperty("--pointer-x", `${(x + 0.5) * 100}%`);
          card.style.setProperty("--pointer-y", `${(y + 0.5) * 100}%`);
          card.style.transform = card.hasAttribute("data-magnetic")
            ? `translate(${x * 5}px, ${y * 5}px)`
            : `perspective(900px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
        };
        const reset = (event: PointerEvent) => {
          const card = (event.target as HTMLElement).closest<HTMLElement>(
            "[data-tilt], [data-magnetic]",
          );
          if (card && !card.contains(event.relatedTarget as Node | null))
            card.style.transform = "";
        };
        const hide = () => {
          if (cursor) cursor.style.opacity = "0";
        };
        root.addEventListener("pointermove", move);
        root.addEventListener("pointerout", reset);
        root.addEventListener("pointerleave", hide);
        const stop = () => {
          if (media.matches) cleanup();
        };
        cleanup = () => {
          context.revert();
          lenis.destroy();
          gsap.ticker.remove(tick);
          root.removeEventListener("pointermove", move);
          root.removeEventListener("pointerout", reset);
          root.removeEventListener("pointerleave", hide);
          media.removeEventListener("change", stop);
          root
            .querySelectorAll<HTMLElement>("[data-tilt], [data-magnetic]")
            .forEach((item) => {
              item.style.transform = "";
            });
          hide();
        };
        media.addEventListener("change", stop);
      })
      .catch(() => {
        /* The complete static page remains available if animation loading fails. */
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [paused]);
  return null;
}
