import { Callable } from "./Callable";
import type { Function } from "./Function";
import { RuntimeError, type Interpreter } from "./Interpreter";
import type { Token } from "./Scanner";

export class Class extends Callable {
  name: string;
  superclass?: Class;
  #methods: Map<string, Function>;

  constructor(name: string, methods?: Map<string, Function>, superclass?: Class) {
    super();
    this.name = name;
    this.superclass = superclass;
    this.#methods = methods || new Map();
  }

  get arity() {
    return this.findMethod("init")?.arity ?? 0;
  }

  call(interpreter: Interpreter, args: unknown[]) {
    const instance = new Instance(this);

    this.findMethod("init")?.bind(instance).call(interpreter, args);
    return instance;
  }

  findMethod(name: string): Function | undefined {
    let method = this.#methods.get(name);
    if (!method && this.superclass) method = this.superclass?.findMethod(name);

    return method;
  }

  override toString() {
    return this.name;
  }
}

export class Instance {
  #class: Class;
  #fields = new Map<string, unknown>();

  constructor(c: Class) {
    this.#class = c;
  }

  get(name: Token) {
    if (this.#fields.has(name.lexeme)) return this.#fields.get(name.lexeme);

    const method = this.#class.findMethod(name.lexeme);
    if (method) return method.bind(this);

    throw new RuntimeError(name, "Undefined property '" + name.lexeme + "'.");
  }

  set(name: Token, value: unknown) {
    this.#fields.set(name.lexeme, value);
  }

  toString() {
    return this.#class.name + " instance";
  }
}
