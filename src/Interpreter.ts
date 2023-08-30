import { Environment } from "./Environment";
import type { Binary, Expr, Grouping, Literal, Unary, ExprVisitor, Variable, Assign } from "./Expr";
import { runtimeError } from "./Lox";
import { Token, TokenType } from "./Scanner";
import { Stmt, type Expression, type Print, type StmtVisitor, Var, Block } from "./Stmt";

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<unknown> {
  #environment = new Environment();

  interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.#execute(statement);
      }
    } catch (error: unknown) {
      if (error instanceof RuntimeError) return runtimeError(error);
      throw error;
    }
  }

  visitVarStmt(stmt: Var) {
    const value = stmt.initializer ? this.#evaluate(stmt.initializer) : null;
    this.#environment.define(stmt.name.lexeme, value);
  }

  visitExpressionStmt(stmt: Expression) {
    this.#evaluate(stmt.expr);
  }

  visitPrintStmt(stmt: Print) {
    const value = this.#evaluate(stmt.expr);
    console.log(stringify(value));
  }

  visitBlockStmt(stmt: Block) {
    this.#executeBlock(stmt.statements, new Environment(this.#environment));
  }

  visitVariableExpr(expr: Variable) {
    return this.#environment.get(expr.name);
  }

  visitAssignExpr(expr: Assign) {
    const value = this.#evaluate(expr.value);
    this.#environment.assign(expr.name, value);
    return value;
  }

  visitGroupingExpr(expr: Grouping) {
    return this.#evaluate(expr.expr);
  }

  visitBinaryExpr(expr: Binary) {
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

  visitUnaryExpr(expr: Unary) {
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

  visitLiteralExpr(expr: Literal) {
    return expr.value;
  }

  #evaluate(expr: Expr): unknown {
    return expr.accept(this);
  }

  #execute(stmt: Stmt) {
    stmt.accept(this);
  }

  #executeBlock(statements: Stmt[], environment: Environment) {
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
