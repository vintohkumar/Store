"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { logClientAction } from "../lib/clientLogger";

function getElementDescriptor(element) {
  if (!element) {
    return "";
  }

  const tag = (element.tagName || "").toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const className = typeof element.className === "string" ? element.className.trim().split(/\s+/)[0] : "";
  const klass = className ? `.${className}` : "";
  return `${tag}${id}${klass}`;
}

export default function ClientActionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    logClientAction("page_view", { pathname });
  }, [pathname]);

  useEffect(() => {
    const onClick = (event) => {
      const target = event.target instanceof Element ? event.target.closest("a,button,[role='button']") : null;
      if (!target) {
        return;
      }

      const text = (target.textContent || "").trim().slice(0, 80);
      const href = target.getAttribute("href") || "";
      logClientAction("click", {
        target: getElementDescriptor(target),
        text,
        href,
      });
    };

    const onSubmit = (event) => {
      const form = event.target instanceof Element ? event.target : null;
      if (!form) {
        return;
      }
      logClientAction("form_submit", {
        form: getElementDescriptor(form),
      });
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}
