import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type VybeRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  distance?: "sm" | "md";
  once?: boolean;
};

export function VybeReveal({
  children,
  className = "",
  delayMs = 0,
  distance = "md",
  once = true,
}: VybeRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
        else if (!once) setVisible(false);
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const style = { "--vybe-motion-delay": `${delayMs}ms` } as CSSProperties;
  return <div ref={ref} style={style} data-vybe-visible={visible ? "true" : "false"} data-vybe-distance={distance} className={`vybe-reveal ${className}`}>{children}</div>;
}
