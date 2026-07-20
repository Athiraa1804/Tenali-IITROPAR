import { useState, useRef, useCallback, useEffect } from 'react'

const CATEGORIES = [
  {
    label: 'Popular',
    langs: [
      { id: 92, name: 'Python 3.11', icon: '🐍' },
      { id: 97, name: 'JavaScript (Node 20)', icon: '🟨' },
      { id: 105, name: 'C++ (GCC 14)', icon: '⚡' },
      { id: 91, name: 'Java (JDK 17)', icon: '☕' },
      { id: 101, name: 'TypeScript 5.6', icon: '🔷' },
    ],
  },
  {
    label: 'Scripting',
    langs: [
      { id: 109, name: 'Python 3.13', icon: '🐍' },
      { id: 100, name: 'Python 3.12', icon: '🐍' },
      { id: 70, name: 'Python 2.7', icon: '🐍' },
      { id: 72, name: 'Ruby 2.7', icon: '💎' },
      { id: 68, name: 'PHP 7.4', icon: '🐘' },
      { id: 98, name: 'PHP 8.3', icon: '🐘' },
      { id: 85, name: 'Perl 5.28', icon: '🐪' },
    ],
  },
  {
    label: 'Systems',
    langs: [
      { id: 103, name: 'C (GCC 14)', icon: '🔧' },
      { id: 104, name: 'C (Clang 18)', icon: '🔧' },
      { id: 105, name: 'C++ (GCC 14)', icon: '⚡' },
      { id: 76, name: 'C++ (Clang 7)', icon: '⚡' },
      { id: 108, name: 'Rust 1.85', icon: '🦀' },
      { id: 73, name: 'Rust 1.40', icon: '🦀' },
      { id: 90, name: 'Dart 2.19', icon: '🎯' },
    ],
  },
  {
    label: 'JVM',
    langs: [
      { id: 91, name: 'Java (JDK 17)', icon: '☕' },
      { id: 62, name: 'Java (OpenJDK 13)', icon: '☕' },
      { id: 111, name: 'Kotlin 2.1', icon: '🟣' },
      { id: 78, name: 'Kotlin 1.3', icon: '🟣' },
      { id: 81, name: 'Scala 2.13', icon: '🔴' },
      { id: 112, name: 'Scala 3.4', icon: '🔴' },
      { id: 88, name: 'Groovy 3.0', icon: '🟢' },
    ],
  },
  {
    label: 'Functional',
    langs: [
      { id: 61, name: 'Haskell 8.8', icon: '🟤' },
      { id: 86, name: 'Clojure 1.10', icon: '🔵' },
      { id: 57, name: 'Elixir 1.9', icon: '💜' },
      { id: 58, name: 'Erlang 22', icon: '🔴' },
      { id: 65, name: 'OCaml 4.09', icon: '🟡' },
      { id: 55, name: 'Common Lisp', icon: '🔶' },
      { id: 87, name: 'F# (.NET)', icon: '🟦' },
    ],
  },
  {
    label: 'Web / Shell',
    langs: [
      { id: 97, name: 'Node.js 20', icon: '🟨' },
      { id: 102, name: 'Node.js 22', icon: '🟨' },
      { id: 93, name: 'Node.js 18', icon: '🟨' },
      { id: 101, name: 'TypeScript 5.6', icon: '🔷' },
      { id: 94, name: 'TypeScript 5.0', icon: '🔷' },
      { id: 74, name: 'TypeScript 3.7', icon: '🔷' },
      { id: 46, name: 'Bash 5.0', icon: '🐚' },
    ],
  },
  {
    label: 'Other',
    langs: [
      { id: 60, name: 'Go 1.13', icon: '🐹' },
      { id: 95, name: 'Go 1.18', icon: '🐹' },
      { id: 106, name: 'Go 1.22', icon: '🐹' },
      { id: 83, name: 'Swift 5.2', icon: '🍎' },
      { id: 80, name: 'R 4.0', icon: '📊' },
      { id: 99, name: 'R 4.4', icon: '📊' },
      { id: 82, name: 'SQL (SQLite)', icon: '🗃️' },
      { id: 59, name: 'Fortran 9.2', icon: '📐' },
      { id: 45, name: 'Assembly (NASM)', icon: '⚙️' },
      { id: 47, name: 'Basic (FBC)', icon: '📝' },
      { id: 64, name: 'Lua 5.3', icon: '🌙' },
      { id: 66, name: 'Octave 5.1', icon: '📊' },
      { id: 67, name: 'Pascal 3.0', icon: '📘' },
      { id: 69, name: 'Prolog', icon: '🧠' },
      { id: 84, name: 'VB.NET', icon: '🟪' },
      { id: 79, name: 'Objective-C', icon: '🍎' },
      { id: 56, name: 'D 2.0', icon: '🔶' },
      { id: 51, name: 'C# (Mono)', icon: '🟪' },
    ],
  },
]

const ALL_LANGS = CATEGORIES.flatMap(c => c.langs)

const DEFAULT_CODES = {
  92: `# Python 3.11 — Hello World
name = "World"
print(f"Hello, {name}!")
print("2 + 2 =", 2 + 2)`,
  109: `# Python 3.13 — Hello World
name = "World"
print(f"Hello, {name}!")
print("2 + 2 =", 2 + 2)`,
  100: `# Python 3.12 — Hello World
name = "World"
print(f"Hello, {name}!")
print("2 + 2 =", 2 + 2)`,
  70: `# Python 2.7 — Hello World
name = "World"
print "Hello, %s!" % name
print "2 + 2 =", 2 + 2`,
  71: `# Python 3.8 — Hello World
name = "World"
print(f"Hello, {name}!")
print("2 + 2 =", 2 + 2)`,
  97: `// JavaScript (Node 20) — Hello World
const name = "World";
console.log(\`Hello, \${name}!\`);
console.log("2 + 2 =", 2 + 2);`,
  102: `// JavaScript (Node 22) — Hello World
const name = "World";
console.log(\`Hello, \${name}!\`);
console.log("2 + 2 =", 2 + 2);`,
  93: `// JavaScript (Node 18) — Hello World
const name = "World";
console.log(\`Hello, \${name}!\`);
console.log("2 + 2 =", 2 + 2);`,
  103: `/* C (GCC 14) — Hello World */
#include <stdio.h>

int main(void) {
    const char *name = "World";
    printf("Hello, %s!\\n", name);
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}`,
  104: `/* C (Clang 18) — Hello World */
#include <stdio.h>

int main(void) {
    const char *name = "World";
    printf("Hello, %s!\\n", name);
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}`,
  48: `/* C (GCC 7) — Hello World */
#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}`,
  49: `/* C (GCC 8) — Hello World */
#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}`,
  50: `/* C (GCC 9) — Hello World */
#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}`,
  75: `/* C (Clang 7) — Hello World */
#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}`,
  105: `// C++ (GCC 14) — Hello World
#include <iostream>
using namespace std;

int main() {
    string name = "World";
    cout << "Hello, " << name << "!" << endl;
    cout << "2 + 2 = " << 2 + 2 << endl;
    return 0;
}`,
  52: `// C++ (GCC 7) — Hello World
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "2 + 2 = " << 2 + 2 << endl;
    return 0;
}`,
  53: `// C++ (GCC 8) — Hello World
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "2 + 2 = " << 2 + 2 << endl;
    return 0;
}`,
  54: `// C++ (GCC 9) — Hello World
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "2 + 2 = " << 2 + 2 << endl;
    return 0;
}`,
  76: `// C++ (Clang 7) — Hello World
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "2 + 2 = " << 2 + 2 << endl;
    return 0;
}`,
  91: `// Java (JDK 17) — Hello World
public class Main {
    public static void main(String[] args) {
        String name = "World";
        System.out.println("Hello, " + name + "!");
        System.out.println("2 + 2 = " + (2 + 2));
    }
}`,
  62: `// Java (OpenJDK 13) — Hello World
public class Main {
    public static void main(String[] args) {
        String name = "World";
        System.out.println("Hello, " + name + "!");
        System.out.println("2 + 2 = " + (2 + 2));
    }
}`,
  106: `// Go 1.22 — Hello World
package main

import "fmt"

func main() {
    name := "World"
    fmt.Printf("Hello, %s!\\n", name)
    fmt.Printf("2 + 2 = %d\\n", 2+2)
}`,
  95: `// Go 1.18 — Hello World
package main

import "fmt"

func main() {
    name := "World"
    fmt.Printf("Hello, %s!\\n", name)
    fmt.Printf("2 + 2 = %d\\n", 2+2)
}`,
  60: `// Go 1.13 — Hello World
package main

import "fmt"

func main() {
    name := "World"
    fmt.Printf("Hello, %s!\\n", name)
    fmt.Printf("2 + 2 = %d\\n", 2+2)
}`,
  108: `// Rust 1.85 — Hello World
fn main() {
    let name = "World";
    println!("Hello, {}!", name);
    println!("2 + 2 = {}", 2 + 2);
}`,
  73: `// Rust 1.40 — Hello World
fn main() {
    println!("Hello, World!");
    println!("2 + 2 = {}", 2 + 2);
}`,
  101: `// TypeScript 5.6 — Hello World
const name: string = "World";
console.log(\`Hello, \${name}!\`);
console.log("2 + 2 =", 2 + 2);`,
  94: `// TypeScript 5.0 — Hello World
const name: string = "World";
console.log(\`Hello, \${name}!\`);
console.log("2 + 2 =", 2 + 2);`,
  74: `// TypeScript 3.7 — Hello World
const name: string = "World";
console.log(\`Hello, \${name}!\`);
console.log("2 + 2 =", 2 + 2);`,
  72: `# Ruby 2.7 — Hello World
name = "World"
puts "Hello, #{name}!"
puts "2 + 2 = #{2 + 2}"`,
  68: `<?php
// PHP 7.4 — Hello World
$name = "World";
echo "Hello, $name!\\n";
echo "2 + 2 = " . (2 + 2) . "\\n";
?>`,
  98: `<?php
// PHP 8.3 — Hello World
$name = "World";
echo "Hello, $name!\\n";
echo "2 + 2 = " . (2 + 2) . "\\n";
?>`,
  46: `#!/bin/bash
# Bash 5.0 — Hello World
name="World"
echo "Hello, $name!"
echo "2 + 2 = $((2 + 2))"`,
  82: `-- SQL (SQLite)
SELECT 'Hello, World!' AS greeting;
SELECT 2 + 2 AS answer;`,
  83: `// Swift 5.2 — Hello World
let name = "World"
print("Hello, \\(name)!")
print("2 + 2 = \\(2 + 2)")`,
  111: `// Kotlin 2.1 — Hello World
fun main() {
    val name = "World"
    println("Hello, $name!")
    println("2 + 2 = ${2 + 2}")
}`,
  78: `// Kotlin 1.3 — Hello World
fun main() {
    val name = "World"
    println("Hello, $name!")
    println("2 + 2 = ${2 + 2}")
}`,
  81: `// Scala 2.13 — Hello World
object Main extends App {
  val name = "World"
  println(s"Hello, $name!")
  println(s"2 + 2 = ${2 + 2}")
}`,
  112: `// Scala 3.4 — Hello World
@main def main() =
  val name = "World"
  println(s"Hello, $name!")
  println(s"2 + 2 = ${2 + 2}")`,
  88: `// Groovy 3.0 — Hello World
def name = "World"
println "Hello, $name!"
println "2 + 2 = ${2 + 2}"`,
  61: `-- Haskell 8.8 — Hello World
main :: IO ()
main = do
    let name = "World"
    putStrLn $ "Hello, " ++ name ++ "!"
    putStrLn $ "2 + 2 = " ++ show (2 + 2)`,
  86: `; Clojure 1.10 — Hello World
(let [name "World"]
  (println (str "Hello, " name "!"))
  (println (str "2 + 2 = " (+ 2 2))))`,
  57: `# Elixir 1.9 — Hello World
name = "World"
IO.puts("Hello, #{name}!")
IO.puts("2 + 2 = #{2 + 2}")`,
  58: `-module(main).
-export([main/0]).

main() ->
    io:format("Hello, World!~n"),
    io:format("2 + 2 = ~p~n", [2 + 2]).`,
  65: `(* OCaml 4.09 — Hello World *)
let () =
  let name = "World" in
  Printf.printf "Hello, %s!\\n" name;
  Printf.printf "2 + 2 = %d\\n" (2 + 2)`,
  55: `;;; Common Lisp — Hello World
(format t "Hello, World!~%")
(format t "2 + 2 = ~d~%" (+ 2 2))`,
  87: `// F# (.NET) — Hello World
let name = "World"
printfn "Hello, %s!" name
printfn "2 + 2 = %d" (2 + 2)`,
  80: `# R 4.0 — Hello World
name <- "World"
cat(sprintf("Hello, %s!\\n", name))
cat(sprintf("2 + 2 = %d\\n", 2 + 2))`,
  99: `# R 4.4 — Hello World
name <- "World"
cat(sprintf("Hello, %s!\\n", name))
cat(sprintf("2 + 2 = %d\\n", 2 + 2))`,
  59: `! Fortran 9.2 — Hello World
program hello
  implicit none
  print *, "Hello, World!"
  print *, "2 + 2 =", 2 + 2
end program hello`,
  45: `; Assembly (NASM) — x86_64 Linux
section .data
    msg db "Hello, World!", 10
    len equ $ - msg
    msg2 db "2 + 2 = 4", 10
    len2 equ $ - msg2

section .text
    global _start

_start:
    mov rax, 1
    mov rdi, 1
    mov rsi, msg
    mov rdx, len
    syscall

    mov rax, 1
    mov rdi, 1
    mov rsi, msg2
    mov rdx, len2
    syscall

    mov rax, 60
    xor rdi, rdi
    syscall`,
  47: `' Basic (FBC) — Hello World
PRINT "Hello, World!"
PRINT "2 + 2 ="; 2 + 2`,
  64: `-- Lua 5.3 — Hello World
local name = "World"
print("Hello, " .. name .. "!")
print("2 + 2 = " .. tostring(2 + 2))`,
  66: `# Octave 5.1 — Hello World
name = "World";
printf("Hello, %s!\\n", name);
printf("2 + 2 = %d\\n", 2 + 2);`,
  67: `program hello;
begin
  writeln('Hello, World!');
  writeln('2 + 2 = ', 2 + 2);
end.`,
  69: `% Prolog — Hello World
:- initialization(main).

main :-
    write('Hello, World!'), nl,
    X is 2 + 2,
    write('2 + 2 = '), write(X), nl.`,
  84: `' VB.NET — Hello World
Module Main
    Sub Main()
        Dim name As String = "World"
        Console.WriteLine("Hello, " & name & "!")
        Console.WriteLine("2 + 2 = " & (2 + 2))
    End Sub
End Module`,
  79: `/* Objective-C (Clang) — Hello World */
#import <Foundation/Foundation.h>

int main(void) {
    @autoreleasepool {
        NSLog(@"Hello, World!");
        NSLog(@"2 + 2 = %d", 2 + 2);
    }
    return 0;
}`,
  56: `// D 2.0 — Hello World
import std.stdio;

void main() {
    auto name = "World";
    writeln("Hello, ", name, "!");
    writeln("2 + 2 = ", 2 + 2);
}`,
  51: `// C# (Mono) — Hello World
using System;

class Program {
    static void Main() {
        string name = "World";
        Console.WriteLine($"Hello, {name}!");
        Console.WriteLine($"2 + 2 = {2 + 2}");
    }
}`,
  77: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO.
       PROCEDURE DIVISION.
           DISPLAY "Hello, World!"
           DISPLAY "2 + 2 = " FUNCTION INTEGER(2 + 2)
           STOP RUN.`,
}

function getDefaultCode(langId) {
  return DEFAULT_CODES[langId] || `// Write your code here\nconsole.log("Hello, World!");`
}

const STATUS_MAP = {
  3: { label: 'Accepted', color: 'var(--clr-correct)' },
  4: { label: 'Wrong Answer', color: 'var(--clr-wrong)' },
  5: { label: 'Time Limit Exceeded', color: 'var(--clr-wrong)' },
  6: { label: 'Compilation Error', color: 'var(--clr-wrong)' },
  7: { label: 'Runtime Error', color: 'var(--clr-wrong)' },
  11: { label: 'Output Limit Exceeded', color: 'var(--clr-wrong)' },
  12: { label: 'Memory Limit Exceeded', color: 'var(--clr-wrong)' },
  13: { label: 'Illegal System Call', color: 'var(--clr-wrong)' },
  14: { label: 'Internal Error', color: 'var(--clr-wrong)' },
}

function getLangName(id) {
  const found = ALL_LANGS.find(l => l.id === id)
  return found ? found.name : `Language #${id}`
}

export default function PlaygroundApp({ onBack }) {
  const [langId, setLangId] = useState(92)
  const [code, setCode] = useState(getDefaultCode(92))
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [showStdin, setShowStdin] = useState(false)
  const [activeTab, setActiveTab] = useState('output')
  const [copied, setCopied] = useState(null)
  const [showAllLangs, setShowAllLangs] = useState(false)
  const lastRunTime = useRef(0)
  const codeRef = useRef(null)

  const handleLangChange = useCallback((newId) => {
    setLangId(newId)
    setCode(getDefaultCode(newId))
    setOutput(null)
    setError(null)
    setActiveTab('output')
    setShowAllLangs(false)
  }, [])

  const handleRun = useCallback(async () => {
    const now = Date.now()
    if (now - lastRunTime.current < 2000) return
    lastRunTime.current = now
    setRunning(true)
    setOutput(null)
    setError(null)
    setActiveTab('output')
    try {
      const res = await fetch('/api/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: langId,
          stdin: stdin || undefined,
          cpu_time_limit: 10,
          memory_limit: 256,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`)
      }
      const data = await res.json()
      setOutput(data)
    } catch (err) {
      setError(err.message || 'Failed to execute code')
    } finally {
      setRunning(false)
    }
  }, [code, langId, stdin])

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleRun() }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const start = ta.selectionStart, end = ta.selectionEnd
      const val = ta.value
      ta.value = val.substring(0, start) + '  ' + val.substring(end)
      ta.selectionStart = ta.selectionEnd = start + 2
      setCode(ta.value)
    }
  }, [handleRun])

  const handleCopy = useCallback((text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    })
  }, [])

  const statusInfo = output?.status ? STATUS_MAP[output.status.id] : null
  const stdout = (output?.stdout || '').replace(/\r\n/g, '\n')
  const stderr = (output?.stderr || '').replace(/\r\n/g, '\n')
  const compileOut = (output?.compile_output || '').replace(/\r\n/g, '\n')

  const hasOutput = stdout.trim() || stderr.trim() || compileOut.trim()
  const hasErrors = stderr.trim() || compileOut.trim()

  return (
    <div className="app-shell">
      <div className="card is-wide" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button className="back-button" onClick={onBack}>← Back</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 2 }}>
              Code Playground
            </h1>
            <p className="subtitle" style={{ marginBottom: 0, fontSize: '0.88rem' }}>
              Write, run, and test code in 50+ languages
            </p>
          </div>
          <div style={{ width: 80 }} />
        </div>

        {/* Language selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Language
            </span>
            <span style={{
              fontSize: '0.88rem', fontWeight: 600, color: 'var(--clr-accent)',
              background: 'var(--clr-surface)', padding: '4px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--clr-border)',
            }}>
              {getLangName(langId)}
            </span>
            <button
              className="back-button"
              onClick={() => setShowAllLangs(s => !s)}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              {showAllLangs ? '▾ Less' : '▸ All Languages'}
            </button>
          </div>

          {/* Popular quick picks */}
          {!showAllLangs && (
            <div className="radio-group" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES[0].langs.map(l => (
                <button
                  key={l.id}
                  className={`radio-pill${langId === l.id ? ' active' : ''}`}
                  onClick={() => handleLangChange(l.id)}
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  {l.icon} {l.name}
                </button>
              ))}
            </div>
          )}

          {/* All languages by category */}
          {showAllLangs && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12, marginTop: 8,
            }}>
              {CATEGORIES.filter(c => c.label !== 'Popular').map(cat => (
                <div key={cat.label}>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-soft)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
                  }}>
                    {cat.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {cat.langs.map(l => (
                      <button
                        key={`${cat.label}-${l.id}`}
                        className={`radio-pill${langId === l.id ? ' active' : ''}`}
                        onClick={() => handleLangChange(l.id)}
                        style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                      >
                        {l.icon} {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor + Output */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}
          className="playground-grid"
        >
          {/* Left: Code editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            <div style={{
              background: '#1a1b26', border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              flex: 1, minHeight: 320,
            }}>
              <div style={{
                padding: '8px 14px', borderBottom: '1px solid #2f3146',
                fontSize: '0.75rem', color: '#7982a9', fontWeight: 600,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: '#f7768e',
                  }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e0af68' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9ece6a' }} />
                  <span style={{ marginLeft: 6 }}>{getLangName(langId)}</span>
                </span>
                <span style={{ opacity: 0.5 }}>⌘/Ctrl + Enter to run</span>
              </div>
              <textarea
                ref={codeRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{
                  flex: 1, width: '100%', background: 'transparent', color: '#c0caf5',
                  border: 'none', outline: 'none', resize: 'none', padding: '14px 16px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontSize: '0.88rem', lineHeight: 1.65, tabSize: 2, minHeight: 280,
                }}
                placeholder="Write your code here..."
              />
            </div>

            {/* Stdin */}
            <div>
              <button
                className="back-button"
                onClick={() => setShowStdin(s => !s)}
                style={{ fontSize: '0.82rem', padding: '5px 12px' }}
              >
                {showStdin ? '▾ Hide' : '▸ Show'} Standard Input
              </button>
              {showStdin && (
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  spellCheck={false}
                  rows={3}
                  style={{
                    width: '100%', marginTop: 8, background: 'var(--clr-surface)',
                    color: 'var(--clr-text)', border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)', outline: 'none', resize: 'vertical',
                    padding: '10px 14px', minHeight: 40, maxHeight: 120, boxSizing: 'border-box',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', lineHeight: 1.5,
                  }}
                  placeholder="Optional — provide input for your program..."
                />
              )}
            </div>

            {/* Run */}
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                minWidth: 160, fontSize: '1rem', fontWeight: 700,
                background: running ? 'var(--clr-text-soft)' : 'var(--clr-accent)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius)',
                padding: '12px 24px', cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {running ? 'Running...' : 'Run Code'}
            </button>
          </div>

          {/* Right: Output panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Status bar */}
            {statusInfo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', marginBottom: 8, borderRadius: 'var(--radius-sm)',
                background: `${statusInfo.color}15`, border: `1px solid ${statusInfo.color}40`,
                color: statusInfo.color, fontWeight: 600, fontSize: '0.88rem',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: statusInfo.color, flexShrink: 0,
                }} />
                {statusInfo.label}
                {output?.time && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 400, opacity: 0.8 }}>
                    {output.time}s · {(output.memory / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div style={{
                padding: '10px 16px', marginBottom: 8, borderRadius: 'var(--radius-sm)',
                background: 'rgba(247, 118, 142, 0.1)', border: '1px solid rgba(247, 118, 142, 0.3)',
                color: 'var(--clr-wrong)', fontWeight: 500, fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 0, borderBottom: '1px solid var(--clr-border)',
            }}>
              {[
                { key: 'output', label: 'Output', has: !!stdout.trim() },
                { key: 'stderr', label: 'Errors', has: !!stderr.trim() },
                { key: 'compiler', label: 'Compiler', has: !!compileOut.trim() },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: activeTab === t.key ? 'var(--clr-surface)' : 'transparent',
                    color: activeTab === t.key ? 'var(--clr-text)' : 'var(--clr-text-soft)',
                    border: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: activeTab === t.key ? '2px solid var(--clr-accent)' : '2px solid transparent',
                  }}
                >
                  {t.label}
                  {t.has && (
                    <span style={{
                      display: 'inline-block', marginLeft: 6, width: 6, height: 6,
                      borderRadius: '50%', background: t.key === 'output' ? 'var(--clr-correct)' : 'var(--clr-wrong)',
                    }} />
                  )}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {output && activeTab === 'output' && stdout.trim() && (
                <button
                  onClick={() => handleCopy(stdout, 'output')}
                  className="back-button"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', margin: '4px 8px 4px 0', borderRadius: 6 }}
                >
                  {copied === 'output' ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {/* Terminal output */}
            <div style={{
              background: '#1a1b26', border: '1px solid #2f3146',
              borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)',
              minHeight: 200, maxHeight: 420, overflow: 'auto',
            }}>
              {!output && !error && !running && (
                <div style={{
                  color: '#7982a9', fontSize: '0.85rem', textAlign: 'center',
                  padding: '48px 16px', fontFamily: "'JetBrains Mono', monospace",
                }}>
                  Click <strong style={{ color: '#7aa2f7' }}>Run Code</strong> to see output here
                  <div style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.6 }}>
                    Ctrl+Enter to run
                  </div>
                </div>
              )}

              {running && (
                <div style={{
                  color: '#7982a9', fontSize: '0.85rem', textAlign: 'center',
                  padding: '48px 16px', fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #2f3146', borderTopColor: '#7aa2f7', borderRadius: '50%', animation: 'pgspin 0.6s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
                  Executing...
                </div>
              )}

              {/* Output tab — terminal style */}
              {output && activeTab === 'output' && (
                <div style={{
                  padding: '14px 16px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.84rem', lineHeight: 1.6,
                }}>
                  {stdout.trim() ? (
                    <pre style={{
                      margin: 0, color: '#c0caf5', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>{stdout}</pre>
                  ) : !hasErrors ? (
                    <div style={{ color: '#7982a9', textAlign: 'center', padding: '20px 0' }}>
                      Program ran successfully with no output
                    </div>
                  ) : (
                    <div style={{ color: '#7982a9', textAlign: 'center', padding: '20px 0' }}>
                      No standard output
                    </div>
                  )}
                </div>
              )}

              {/* Stderr tab */}
              {output && activeTab === 'stderr' && (
                <div style={{
                  padding: '14px 16px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.84rem', lineHeight: 1.6,
                }}>
                  {stderr.trim() ? (
                    <pre style={{
                      margin: 0, color: '#f7768e', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>{stderr}</pre>
                  ) : (
                    <div style={{ color: '#7982a9', textAlign: 'center', padding: '20px 0' }}>
                      No errors
                    </div>
                  )}
                </div>
              )}

              {/* Compiler tab */}
              {output && activeTab === 'compiler' && (
                <div style={{
                  padding: '14px 16px',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.84rem', lineHeight: 1.6,
                }}>
                  {compileOut.trim() ? (
                    <pre style={{
                      margin: 0, color: '#e0af68', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>{compileOut}</pre>
                  ) : (
                    <div style={{ color: '#7982a9', textAlign: 'center', padding: '20px 0' }}>
                      No compiler output
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <History
          output={output}
          langId={langId}
          code={code}
          stdin={stdin}
          onLoad={(h) => {
            setLangId(h.langId)
            setCode(h.code)
            setStdin(h.stdin || '')
            setOutput(null)
            setError(null)
            setActiveTab('output')
          }}
        />
      </div>

      <style>{`
        @keyframes pgspin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .playground-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function History({ output, langId, code, stdin, onLoad }) {
  const [history, setHistory] = useState([])
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (!output) return
    const entry = {
      id: Date.now(),
      lang: getLangName(langId),
      langId,
      code,
      stdin: stdin || '',
      status: output.status?.description || 'Unknown',
      statusId: output.status?.id,
      time: output.time,
      memory: output.memory,
      stdout: output.stdout || '',
    }
    setHistory(prev => [entry, ...prev].slice(0, 10))
  }, [output, langId])

  if (history.length === 0) return null

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        fontSize: '0.78rem', fontWeight: 600, color: 'var(--clr-text-soft)',
        marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        Recent Runs
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {history.map((h, i) => (
          <div key={h.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            background: i === 0 ? 'var(--clr-surface)' : 'transparent',
            border: `1px solid ${i === 0 ? 'var(--clr-border)' : 'transparent'}`,
            borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: h.statusId === 3 ? 'var(--clr-correct)' : 'var(--clr-wrong)',
            }} />
            <span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>{h.lang}</span>
            <span style={{ color: 'var(--clr-text-soft)' }}>·</span>
            <span style={{
              color: h.statusId === 3 ? 'var(--clr-correct)' : 'var(--clr-wrong)',
              fontWeight: 500, fontSize: '0.78rem',
            }}>{h.status}</span>
            {h.time && <span style={{ color: 'var(--clr-text-soft)' }}>{h.time}s</span>}
            {h.stdout && h.stdout.trim().length > 0 && (
              <span style={{
                color: 'var(--clr-text-soft)', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.75rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{h.stdout.trim()}</span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button
                onClick={() => setViewing(h)}
                style={{
                  background: 'transparent', color: 'var(--clr-accent)',
                  border: '1px solid var(--clr-border)', borderRadius: 4,
                  padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500,
                }}
              >
                View Code
              </button>
              <button
                onClick={() => onLoad(h)}
                style={{
                  background: 'transparent', color: 'var(--clr-text-soft)',
                  border: '1px solid var(--clr-border)', borderRadius: 4,
                  padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500,
                }}
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Code Modal */}
      {viewing && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: 24,
          }}
          onClick={() => setViewing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1b26', border: '1px solid #2f3146', borderRadius: 'var(--radius)',
              width: '100%', maxWidth: 720, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid #2f3146',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ color: '#c0caf5', fontWeight: 600, fontSize: '0.9rem' }}>
                  {viewing.lang}
                </span>
                <span style={{ color: '#7982a9', fontSize: '0.78rem', marginLeft: 10 }}>
                  {viewing.status}
                  {viewing.time && ` · ${viewing.time}s`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    onLoad(viewing)
                    setViewing(null)
                  }}
                  style={{
                    background: '#7aa2f7', color: '#fff', border: 'none', borderRadius: 6,
                    padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Load Code
                </button>
                <button
                  onClick={() => setViewing(null)}
                  style={{
                    background: 'transparent', color: '#7982a9', border: '1px solid #2f3146',
                    borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{ padding: '14px 16px', overflow: 'auto', flex: 1 }}>
              <pre style={{
                margin: 0, color: '#c0caf5', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.84rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{viewing.code}</pre>
            </div>
            {viewing.stdout && (
              <div style={{
                borderTop: '1px solid #2f3146', padding: '10px 16px',
                fontSize: '0.78rem', color: '#7982a9',
              }}>
                <span style={{ fontWeight: 600 }}>Output:</span>{' '}
                <span style={{ color: '#9ece6a', fontFamily: "'JetBrains Mono', monospace" }}>
                  {viewing.stdout.length > 120 ? viewing.stdout.slice(0, 120) + '...' : viewing.stdout}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
