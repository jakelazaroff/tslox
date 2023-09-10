import { Callable } from "./Callable";
import { Environment } from "./Environment";
import { Interpreter, Return } from "./Interpreter";
import * as Stmt from "./Stmt";

export class Function extends Callable {
  declaration: Stmt.Function;
  #closure: Environment;

  constructor(declaration: Stmt.Function, closure: Environment) {
    super();
    this.declaration = declaration;
    this.#closure = closure;
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
      if (e instanceof Return) return e.value;
      throw e;
    }

    return null;
  }

  override toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
