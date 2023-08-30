import { RuntimeError } from "./Interpreter";
import type { Token } from "./Scanner";

export class Environment {
  #enclosing?: Environment;
  #values = new Map<string, unknown>();

  constructor(enclosing?: Environment) {
    this.#enclosing = enclosing;
  }

  get(name: Token): unknown {
    if (this.#values.has(name.lexeme)) return this.#values.get(name.lexeme);
    if (this.#enclosing) return this.#enclosing.get(name);

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }

  define(name: string, value: unknown) {
    this.#values.set(name, value);
  }

  assign(name: Token, value: unknown) {
    if (this.#values.has(name.lexeme)) {
      this.#values.set(name.lexeme, value);
      return;
    }

    if (this.#enclosing) {
      this.#enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }
}
