export interface ActivityApi {
  /** 1180×820 layer the activity draws into (the top bar sits above it). */
  layer: HTMLElement;
  /** Speak the task; the speaker button replays the last instruction. */
  instruct(text: string): Promise<void>;
  say(text: string): Promise<void>;
  /** Screen solved — the runner awards a star and moves on. */
  success(accuracy?: number): void;
  /** One unsuccessful attempt (for stats and fatigue detection). */
  fail(): void;
  /** Show/hide the undo button in the top bar. */
  setUndo(fn: (() => void) | null): void;
  ink: string;
}

/** An activity mounts into `api.layer` and may return a cleanup function. */
export type Activity<P> = (api: ActivityApi, params: P) => void | (() => void);

export type ScreenSpec =
  | { type: 'trace'; digit: number; support: 'full' | 'start' }
  | { type: 'write'; digit: number }
  | { type: 'fix'; digit: number }
  | { type: 'count'; n: number }
  | { type: 'match'; nums: number[] }
  | { type: 'dots' }
  | { type: 'find'; n: number }
  | { type: 'draw'; n: number }
  | { type: 'color'; digit: number }
  | { type: 'flash'; n: number }
  | { type: 'hide'; total: number; hidden: number };

/** Digit an activity mostly practises (for stats). */
export function specDigit(s: ScreenSpec): number | null {
  switch (s.type) {
    case 'trace':
    case 'write':
    case 'fix':
    case 'color':
      return s.digit;
    case 'count':
    case 'find':
    case 'draw':
    case 'flash':
      return s.n;
    case 'hide':
      return s.hidden;
    default:
      return null;
  }
}
