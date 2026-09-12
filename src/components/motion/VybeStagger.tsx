import { useEffect, useRef, useState, type ReactNode } from "react";

type VybeStaggerProps = {
  children: ReactNode;
  className?: string;
};

export function VybeStagger({ children, className = "" }: VybeStaggerProps) {
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
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-vybe-visible={visible ? "true" : "false"} className={`vybe-stagger ${className}`}>
      {children}
    </div>
  );
}
