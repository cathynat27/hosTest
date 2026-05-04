"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation?: string;
  delay?: string;
  duration?: string;
  once?: boolean;
}

export default function AnimateOnScroll({
  children,
  animation = "animate__fadeInUp",
  delay = "0s",
  duration = "1s",
  once = true,
}: AnimateOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && domRef.current) {
              observer.unobserve(domRef.current);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [once]);

  return (
    <div
      ref={domRef}
      className={`animate__animated ${isVisible ? animation : "opacity-0"}`}
      style={{
        animationDelay: delay,
        animationDuration: duration,
      }}
    >
      {children}
    </div>
  );
}
