import { RuntimeError } from "./Interpreter";
import type { Token } from "./Scanner";

export class Environment {
  enclosing?: Environment;
  values = new Map<string, unknown>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  assign(name: Token, value: unknown) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }

  assignAt(depth: number, name: Token, value: unknown) {
    this.#ancestor(depth)?.values.set(name.lexeme, value);
  }

  define(name: string, value: unknown) {
    this.values.set(name, value);
  }

  get(name: Token): unknown {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);
    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.");
  }

  getAt(depth: number, name: string) {
    return this.#ancestor(depth)?.values.get(name);
  }

  #ancestor(depth: number) {
    let env: Environment = this;
    for (let i = 0; i < depth; i++) {
      if (!env.enclosing) return;
      env = env.enclosing;
    }

    return env;
  }
}
