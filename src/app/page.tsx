"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const QUESTIONS = [
  "What would you never put on your dating profile, and why?",
  "Have you ever felt like you weren’t “ready” to date? If so, what were you waiting for?",
  "Have you ever judged someone’s profile for being “too real”? What does that say about you?",
  "What fear has quietly shaped your recent decisions?",
  "Which memory still changes how you see yourself today?",
  "What does being truly known look like for you?",
  "What truth are you ready to say out loud this year?",
  "How do you know when you can trust someone new?",
  "What are you protecting that might need to be released?",
  "What kind of connection are you actively building now?",

];

type MoveDirection = "next" | "prev" | null;

const MAX_STACK_DEPTH = 3;
const RAPID_CLICK_WINDOW_MS = 260;

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moveDirection, setMoveDirection] = useState<MoveDirection>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isRapidMove, setIsRapidMove] = useState(false);
  const lastMoveTimestamp = useRef(0);

  const hasActiveAnimation = moveDirection !== null && pendingIndex !== null;
  const activeIndex = pendingIndex ?? currentIndex;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < QUESTIONS.length - 1;

  const stackIndices = useMemo(() => {
    const indices: number[] = [];

    for (let depth = 1; depth <= MAX_STACK_DEPTH; depth += 1) {
      const index = currentIndex + depth;
      if (index < QUESTIONS.length) {
        indices.push(index);
      }
    }

    return indices;
  }, [currentIndex]);

  const startMove = (direction: Exclude<MoveDirection, null>) => {
    const now = Date.now();
    setIsRapidMove(now - lastMoveTimestamp.current <= RAPID_CLICK_WINDOW_MS);
    lastMoveTimestamp.current = now;

    const baseIndex = pendingIndex ?? currentIndex;
    const targetIndex = direction === "next" ? baseIndex + 1 : baseIndex - 1;

    if (targetIndex < 0 || targetIndex >= QUESTIONS.length) return;

    // Commit in-flight destination first so rapid clicks can chain smoothly.
    if (pendingIndex !== null) {
      setCurrentIndex(pendingIndex);
    }

    setPendingIndex(targetIndex);
    setMoveDirection(direction);
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        startMove("next");
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        startMove("prev");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [startMove]);

  const finishMove = () => {
    if (pendingIndex === null) return;

    setCurrentIndex(pendingIndex);
    setPendingIndex(null);
    setMoveDirection(null);
  };

  const currentQuestion = QUESTIONS[currentIndex];
  const incomingQuestion = pendingIndex !== null ? QUESTIONS[pendingIndex] : null;

  return (
    <main className="deck-page">
      <div className="deck-background-orb deck-background-orb--left" aria-hidden="true" />
      <div className="deck-background-orb deck-background-orb--right" aria-hidden="true" />

      <section className="deck-shell">
        <header className="deck-header">
          <p className="deck-overline">The Unmasking Series</p>
          <h1 className="deck-title">Conversation Card Deck</h1>
          <p className="deck-subtitle">
            Pull one question at a time. Flip forward to remove a card, flip backward to place one back.
          </p>
        </header>

        <div className="deck-stage" role="region" aria-live="polite">
          <div className="deck-perspective">
            {stackIndices.map((index, order) => {
              const style = {
                "--stack-depth": `${order + 1}`,
              } as CSSProperties;

              return (
                <article key={index} className="deck-card deck-card--stack" style={style}>
                  <p className="deck-card-label">Coming up</p>
                  <p className="deck-card-question">{QUESTIONS[index]}</p>
                </article>
              );
            })}

            {!hasActiveAnimation ? (
              <article className="deck-card deck-card--front" key={currentIndex}>
                <p className="deck-card-label">Question {currentIndex + 1}</p>
                <p className="deck-card-question">{currentQuestion}</p>
              </article>
            ) : (
              <>
                <article
                  className={`deck-card deck-card--front ${
                    moveDirection === "next" ? "deck-card--leave-next" : "deck-card--leave-prev"
                  } ${isRapidMove ? "deck-card--rapid" : ""}`}
                >
                  <p className="deck-card-label">Question {currentIndex + 1}</p>
                  <p className="deck-card-question">{currentQuestion}</p>
                </article>
                <article
                  className={`deck-card deck-card--front ${
                    moveDirection === "next" ? "deck-card--enter-next" : "deck-card--enter-prev"
                  } ${isRapidMove ? "deck-card--rapid" : ""}`}
                  onAnimationEnd={finishMove}
                >
                  <p className="deck-card-label">
                    Question {pendingIndex !== null ? pendingIndex + 1 : currentIndex + 1}
                  </p>
                  <p className="deck-card-question">{incomingQuestion}</p>
                </article>
              </>
            )}
          </div>
        </div>

        <footer className="deck-controls">
          <button
            type="button"
            className="deck-button"
            onClick={() => startMove("prev")}
            disabled={!canGoPrev}
          >
            Previous card
          </button>
          <p className="deck-progress">
            {currentIndex + 1} / {QUESTIONS.length}
          </p>
          <button
            type="button"
            className="deck-button"
            onClick={() => startMove("next")}
            disabled={!canGoNext}
          >
            Next card
          </button>
        </footer>
      </section>
    </main>
  );
}
