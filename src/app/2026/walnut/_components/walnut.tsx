"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";
import { Button } from "@/app/2026/_components/ui/Button";



export default function Prelab() {
  const egg = useEgg();
  const opened = useRef(false);
  return (
    <section className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">
        🎉 Congrats!
      </h1>
      <p className="text-ink-dim mt-3 max-w-md text-lg">
        Nice work finishing the ESP32 Workshop prelab.
      </p>
      <Button
        size="lg"
        onClick={() => {
          opened.current = true;
          egg.open("prelab");
        }}
        className="font-display brick mt-8 text-lg font-bold tracking-wide uppercase"
      >
        Claim your Class C ticket
      </Button>
    </section>
  );
}