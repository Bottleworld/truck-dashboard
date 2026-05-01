"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function FakeNotFoundPage() {
  const router = useRouter();
  const startX = useRef(0);

  async function unlock() {
    await fetch("/api/unlock", { method: "POST" });
    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center select-none"
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0].clientX;
        if (endX - startX.current > 180) {
          unlock();
        }
      }}
      onMouseDown={(e) => {
        startX.current = e.clientX;
      }}
      onMouseUp={(e) => {
        const endX = e.clientX;
        if (endX - startX.current > 180) {
          unlock();
        }
      }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black">404</h1>
        <p className="text-black mt-2">PAGE NOT FOUND</p>
      </div>
    </div>
  );
}