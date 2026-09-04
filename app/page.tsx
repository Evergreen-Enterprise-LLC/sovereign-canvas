"use client";

import { useEffect, useState } from "react";
import styles from "./calculator.module.css";

type Operator = "+" | "−" | "×" | "÷" | "^";
type AngleMode = "DEG" | "RAD";

const scientificKeys = [
  ["sin", "cos", "tan"],
  ["ln", "log", "√"],
  ["x²", "xʸ", "1/x"],
  ["π", "e", "|x|"],
];

const keypad = [
  ["AC", "⌫", "±", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "EXP", "="],
];

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Math error");
  if (Object.is(value, -0)) return "0";
  const magnitude = Math.abs(value);
  if ((magnitude !== 0 && magnitude < 1e-9) || magnitude >= 1e12) {
    return value.toExponential(8).replace(/\.0+e/, "e");
  }
  return Number(value.toPrecision(12)).toString();
}

function binary(left: number, right: number, operator: Operator): number {
  if (operator === "+") return left + right;
  if (operator === "−") return left - right;
  if (operator === "×") return left * right;
  if (operator === "÷") {
    if (right === 0) throw new Error("Cannot divide by zero");
    return left / right;
  }
  return left ** right;
}

export default function ScientificCalculator() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");

  const clearError = () => {
    if (error) {
      setError("");
      setDisplay("0");
      setStored(null);
      setOperator(null);
      setWaiting(false);
    }
  };

  const enterDigit = (digit: string) => {
    clearError();
    setDisplay((value) => {
      if (waiting || value === "0") return digit;
      if (value.replace("-", "").replace(".", "").length >= 14) return value;
      return value + digit;
    });
    setWaiting(false);
  };

  const enterDecimal = () => {
    clearError();
    setDisplay((value) => waiting ? "0." : value.includes(".") ? value : value + ".");
    setWaiting(false);
  };

  const chooseOperator = (next: Operator) => {
    clearError();
    const value = Number(display);
    if (stored !== null && operator && !waiting) {
      try {
        const result = binary(stored, value, operator);
        setStored(result);
        setDisplay(formatNumber(result));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Math error");
        return;
      }
    } else {
      setStored(value);
    }
    setOperator(next);
    setWaiting(true);
  };

  const equals = () => {
    if (stored === null || !operator || error) return;
    try {
      const right = Number(display);
      const result = binary(stored, right, operator);
      const formatted = formatNumber(result);
      setHistory((items) => [`${formatNumber(stored)} ${operator} ${formatNumber(right)} = ${formatted}`, ...items].slice(0, 8));
      setDisplay(formatted);
      setStored(null);
      setOperator(null);
      setWaiting(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Math error");
    }
  };

  const unary = (key: string) => {
    clearError();
    const value = Number(display);
    const radians = angleMode === "DEG" ? value * Math.PI / 180 : value;
    try {
      let result = value;
      if (key === "sin") result = Math.sin(radians);
      if (key === "cos") result = Math.cos(radians);
      if (key === "tan") result = Math.tan(radians);
      if (key === "ln") result = Math.log(value);
      if (key === "log") result = Math.log10(value);
      if (key === "√") result = Math.sqrt(value);
      if (key === "x²") result = value ** 2;
      if (key === "1/x") {
        if (value === 0) throw new Error("Cannot divide by zero");
        result = 1 / value;
      }
      if (key === "|x|") result = Math.abs(value);
      if (!Number.isFinite(result)) throw new Error("Outside function domain");
      const formatted = formatNumber(result);
      setHistory((items) => [`${key}(${formatNumber(value)}) = ${formatted}`, ...items].slice(0, 8));
      setDisplay(formatted);
      setWaiting(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Math error");
    }
  };

  const press = (key: string) => {
    if (/^\d$/.test(key)) return enterDigit(key);
    if (key === ".") return enterDecimal();
    if (["+", "−", "×", "÷"].includes(key)) return chooseOperator(key as Operator);
    if (key === "xʸ") return chooseOperator("^");
    if (key === "=") return equals();
    if (key === "AC") {
      setDisplay("0"); setStored(null); setOperator(null); setWaiting(false); setError("");
      return;
    }
    if (key === "⌫") {
      clearError();
      setDisplay((value) => value.length > 1 ? value.slice(0, -1) : "0");
      return;
    }
    if (key === "±") {
      clearError();
      setDisplay((value) => value === "0" ? value : value.startsWith("-") ? value.slice(1) : `-${value}`);
      return;
    }
    if (key === "π" || key === "e") {
      clearError();
      setDisplay(formatNumber(key === "π" ? Math.PI : Math.E));
      setWaiting(true);
      return;
    }
    if (key === "EXP") {
      clearError();
      setDisplay((value) => value.includes("e") ? value : value + "e");
      setWaiting(false);
      return;
    }
    unary(key);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key);
      else if (event.key === ".") press(".");
      else if (event.key === "Enter" || event.key === "=") press("=");
      else if (event.key === "Escape") press("AC");
      else if (event.key === "Backspace") press("⌫");
      else if (event.key === "+") press("+");
      else if (event.key === "-") press("−");
      else if (event.key === "*") press("×");
      else if (event.key === "/") press("÷");
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>EVERGREEN LABS</p>
          <h1>Scientific Calculator</h1>
          <p className={styles.subtitle}>A precise, distraction-free workspace for everyday and scientific calculations.</p>
        </div>
        <div className={styles.live}><span /> Ready</div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.calculator}>
          <div className={styles.display}>
            <div className={styles.displayMeta}>
              <span>{angleMode}</span>
              <span>{memory !== 0 ? "M" : ""}</span>
              <span>{stored !== null && operator ? `${formatNumber(stored)} ${operator}` : " "}</span>
            </div>
            <div className={error ? styles.error : styles.value}>{error || display}</div>
          </div>

          <div className={styles.modeRow}>
            <button onClick={() => setAngleMode((mode) => mode === "DEG" ? "RAD" : "DEG")}>{angleMode}</button>
            <button onClick={() => setMemory(0)}>MC</button>
            <button onClick={() => setDisplay(formatNumber(memory))}>MR</button>
            <button onClick={() => setMemory((value) => value + Number(display))}>M+</button>
            <button onClick={() => setMemory((value) => value - Number(display))}>M−</button>
          </div>

          <div className={styles.controls}>
            <div className={styles.scientific}>
              {scientificKeys.flat().map((key) => (
                <button key={key} onClick={() => press(key)} className={key === "xʸ" ? styles.accentSoft : ""}>{key}</button>
              ))}
            </div>
            <div className={styles.keypad}>
              {keypad.flat().map((key) => (
                <button
                  key={key}
                  onClick={() => press(key)}
                  className={
                    key === "=" ? styles.equals :
                    ["+", "−", "×", "÷"].includes(key) ? styles.operator :
                    ["AC", "⌫", "±"].includes(key) ? styles.utility : ""
                  }
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.history}>
          <div className={styles.historyHead}>
            <div>
              <p className={styles.eyebrow}>SESSION</p>
              <h2>History</h2>
            </div>
            <button onClick={() => setHistory([])}>Clear</button>
          </div>
          {history.length ? (
            <ol>{history.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>
          ) : (
            <div className={styles.empty}>
              <span>∑</span>
              <p>Your completed calculations will appear here.</p>
            </div>
          )}
          <div className={styles.tip}><kbd>Enter</kbd> calculate · <kbd>Esc</kbd> clear</div>
        </aside>
      </section>
    </main>
  );
}

