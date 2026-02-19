"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"
import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { ready: Promise<void> }
    }

    if (doc.startViewTransition) {
      await doc.startViewTransition(() => {
        flushSync(() => {
          const newTheme = !isDark
          setIsDark(newTheme)
          document.documentElement.classList.toggle("dark")
          localStorage.setItem("theme", newTheme ? "dark" : "light")
        })
      }).ready
    } else {
      flushSync(() => {
        const newTheme = !isDark
        setIsDark(newTheme)
        document.documentElement.classList.toggle("dark")
        localStorage.setItem("theme", newTheme ? "dark" : "light")
      })
    }

    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [isDark, duration])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center p-2 rounded-lg transition-colors",
        className
      )}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      {...props}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-[#005EB8]" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5 text-[#005EB8]" strokeWidth={2} />
      )}
    </button>
  )
}