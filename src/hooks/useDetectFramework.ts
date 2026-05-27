import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import type { Framework } from "../types";

const ANGULAR_SIGNALS = [
  "@Component(",
  "@NgModule(",
  "@Injectable(",
  "@Input()",
  "@Output()",
  "implements OnInit",
  "implements OnDestroy",
  "ngOnInit",
  "ngOnDestroy",
  "[(ngModel)]",
  "*ngIf",
  "*ngFor",
  "from '@angular/core'",
];

const REACT_SIGNALS = [
  "useState(",
  "useEffect(",
  "useRef(",
  "useCallback(",
  "useMemo(",
  "import React",
  "from 'react'",
  "JSX.Element",
  "React.FC",
  "ReactNode",
];

const VUE_SIGNALS = [
  "<template>",
  "<script setup>",
  "defineComponent(",
  "ref(",
  "reactive(",
  "computed(",
  "onMounted(",
  "from 'vue'",
  "v-if",
  "v-for",
  "v-model",
];

function detect(code: string): Framework | null {
  const count = (signals: string[]) => signals.filter((s) => code.includes(s)).length;

  const angular = count(ANGULAR_SIGNALS);
  const react = count(REACT_SIGNALS);
  const vue = count(VUE_SIGNALS);

  const max = Math.max(angular, react, vue);
  if (max < 2) return null;

  if (angular === max && angular > react && angular > vue) return "angular";
  if (react === max && react > angular && react > vue) return "react";
  if (vue === max && vue > angular && vue > react) return "vue";
  return null;
}

export function useDetectFramework(): void {
  const sourceCode = useAppStore((s) => s.sourceCode);
  const setSourceFramework = useAppStore((s) => s.setSourceFramework);
  const setIsAutoDetected = useAppStore((s) => s.setIsAutoDetected);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!sourceCode.trim()) {
      setIsAutoDetected(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      const detected = detect(sourceCode);
      if (detected) {
        setSourceFramework(detected);
        setIsAutoDetected(true);
      } else {
        setIsAutoDetected(false);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sourceCode, setSourceFramework, setIsAutoDetected]);
}
