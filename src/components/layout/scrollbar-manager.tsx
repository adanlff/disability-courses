"use client";

import { useEffect } from "react";

export default function ScrollbarManager() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Add scrolling class to html element
      document.documentElement.classList.add("scrolling");

      // Set timeout to remove class after 1 second of inactivity
      timeoutId = setTimeout(() => {
        document.documentElement.classList.remove("scrolling");
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return null;
}
