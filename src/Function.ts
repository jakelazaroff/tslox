import { Callable } from "./Callable";
import type { Instance } from "./Class";
import { Environment } from "./Environment";
import { Interpreter, Return } from "./Interpreter";
import * as Stmt from "./Stmt";

export class Function extends Callable {
  declaration: Stmt.Function;
  #closure: Environment;
  #isInitializer: boolean;

  constructor(declaration: Stmt.Function, closure: Environment, isInitializer = false) {
    super();
    this.declaration = declaration;
    this.#closure = closure;
    this.#isInitializer = isInitializer;
  }

  get arity() {
    return this.declaration.params.length;
  }

  override call(interpreter: Interpreter, args: unknown[]) {
    const environment = new Environment(this.#closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (e) {
      if (e instanceof Return) return this.#isInitializer ? this.#closure.getAt(0, "this") : e.value;
      throw e;
    }

    if (this.#isInitializer) return this.#closure.getAt(0, "this");
    return null;
  }

  bind(instance: Instance) {
    const environment = new Environment(this.#closure);
    environment.define("this", instance);
    return new Function(this.declaration, environment, this.#isInitializer);
  }

  override toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
