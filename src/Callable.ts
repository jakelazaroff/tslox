import type { Interpreter } from "./Interpreter";

export abstract class Callable {
  abstract arity: number;
  abstract call(interpreter: Interpreter, args: unknown[]): unknown;
}
