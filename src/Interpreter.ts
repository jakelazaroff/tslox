import { Environment } from "./Environment";
import { runtimeError } from "./Lox";
import { Callable } from "./Callable";
import { Token, TokenType } from "./Scanner";
import * as Stmt from "./Stmt";
import * as Expr from "./Expr";
import { Function } from "./Function";

export class Interpreter implements Expr.ExprVisitor<unknown>, Stmt.StmtVisitor<unknown> {
  globals = new Environment();
  #environment = this.globals;

  constructor() {
    this.globals.define(
      "clock",
      new (class Clock extends Callable {
        get arity() {
          return 0;
        }

        override call() {
          return performance.now() / 1000.0;
        }

        override toString() {
          return "<native fn>";
        }
      })()
    );
  }

  interpret(statements: Stmt.Stmt[]) {
    try {
      for (const statement of statements) {
        this.#execute(statement);
      }
    } catch (error: unknown) {
      if (error instanceof RuntimeError) return runtimeError(error);
      throw error;
    }
  }

  visitVarStmt(stmt: Stmt.Var) {
    const value = stmt.initializer ? this.#evaluate(stmt.initializer) : null;
    this.#environment.define(stmt.name.lexeme, value);
  }

  visitExpressionStmt(stmt: Stmt.Expression) {
    this.#evaluate(stmt.expr);
  }

  visitFunctionStmt(stmt: Stmt.Function) {
    const fn = new Function(stmt, this.#environment);
    this.#environment.define(stmt.name.lexeme, fn);
    return null;
  }

  visitPrintStmt(stmt: Stmt.Print) {
    const value = this.#evaluate(stmt.expr);
    console.log(stringify(value));
  }

  visitReturnStmt(stmt: Stmt.Return) {
    let value: unknown = null;
    if (stmt.value !== null) value = this.#evaluate(stmt.value);

    throw new Return(value);
  }

  visitBlockStmt(stmt: Stmt.Block) {
    this.executeBlock(stmt.statements, new Environment(this.#environment));
  }

  visitIfStmt(stmt: Stmt.If) {
    if (isTruthy(this.#evaluate(stmt.condition))) this.#execute(stmt.thenBranch);
    else if (stmt.elseBranch != null) this.#execute(stmt.elseBranch);
  }

  visitWhileStmt(stmt: Stmt.While) {
    while (isTruthy(this.#evaluate(stmt.condition))) {
      this.#execute(stmt.body);
    }
  }

  visitVariableExpr(expr: Expr.Variable) {
    return this.#environment.get(expr.name);
  }

  visitAssignExpr(expr: Expr.Assign) {
    const value = this.#evaluate(expr.value);
    this.#environment.assign(expr.name, value);
    return value;
  }

  visitGroupingExpr(expr: Expr.Grouping) {
    return this.#evaluate(expr.expr);
  }

  visitBinaryExpr(expr: Expr.Binary) {
    const left = this.#evaluate(expr.left);
    const right = this.#evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return left !== right;
      case TokenType.EQUAL_EQUAL:
        return left === right;
      case TokenType.GREATER:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left > right;
      case TokenType.GREATER_EQUAL:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left >= right;
      case TokenType.LESS:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left < right;
      case TokenType.LESS_EQUAL:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left <= right;
      case TokenType.MINUS:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left - right;
      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") return left + right;
        if (typeof left === "string" && typeof right === "string") return left + right;
        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
        break;
      case TokenType.SLASH:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left / right;
      case TokenType.STAR:
        checkNumberOperand(expr.operator, left);
        checkNumberOperand(expr.operator, right);
        return left * right;
    }

    return null;
  }

  visitLogicalExpr(expr: Expr.Logical) {
    const left = this.#evaluate(expr.left);

    if (isTruthy(left) === (expr.operator.type === TokenType.OR)) return left;
    return this.#evaluate(expr.right);
  }

  visitUnaryExpr(expr: Expr.Unary) {
    const right = this.#evaluate(expr.expr);
    switch (expr.operator.type) {
      case TokenType.BANG:
        return !isTruthy(right);
      case TokenType.MINUS:
        checkNumberOperand(expr.operator, right);
        return -right;
    }

    return null;
  }

  visitCallExpr(expr: Expr.Call) {
    const callee = this.#evaluate(expr.callee);

    const args: unknown[] = [];
    for (const arg of expr.args) {
      args.push(this.#evaluate(arg));
    }

    if (!(callee instanceof Callable)) throw new RuntimeError(expr.paren, "Can only call functions and classes.");

    const fn = callee as Callable;
    if (args.length !== fn.arity) {
      throw new RuntimeError(expr.paren, `Expected ${fn.arity} arguments but got ${args.length}.`);
    }

    return fn.call(this, args);
  }

  visitLiteralExpr(expr: Expr.Literal) {
    return expr.value;
  }

  #evaluate(expr: Expr.Expr): unknown {
    return expr.accept(this);
  }

  #execute(stmt: Stmt.Stmt) {
    stmt.accept(this);
  }

  executeBlock(statements: Stmt.Stmt[], environment: Environment) {
    const prev = this.#environment;
    try {
      this.#environment = environment;
      for (const statement of statements) {
        this.#execute(statement);
      }
    } finally {
      this.#environment = prev;
    }
  }
}

function isTruthy(x: unknown): boolean {
  if (typeof x === "boolean") return Boolean(x);
  if (x === null) return false;
  return true;
}

function checkNumberOperand(operator: Token, operand: unknown): asserts operand is number {
  if (typeof operand === "number") return;

  throw new RuntimeError(operator, "Operand must be a number.");
}

function stringify(x: unknown) {
  if (x === null) return "nil";

  // edge case because stringifying -0 results in "0"
  if (x === 0) return x.toLocaleString();

  return `${x}`;
}

export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

export class Return {
  value: unknown;

  constructor(value: unknown) {
    this.value = value;
  }
}
