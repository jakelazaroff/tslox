import type { Interpreter } from "./Interpreter";
import type * as Expr from "./Expr";
import type * as Stmt from "./Stmt";
import type { Token } from "./Scanner";
import { error } from "./Lox";

enum FunctionType {
  NONE,
  FUNCTION
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  #interpreter: Interpreter;
  #scopes: Map<string, boolean>[] = [];
  #currentFunction = FunctionType.NONE;

  constructor(interpreter: Interpreter) {
    this.#interpreter = interpreter;
  }

  resolve(...nodes: Array<Stmt.Stmt | Expr.Expr>) {
    for (const node of nodes) node.accept(this);
  }

  visitBlockStmt(stmt: Stmt.Block): void {
    this.#scope(() => {
      this.resolve(...stmt.statements);
    });
  }

  visitExpressionStmt(stmt: Stmt.Expression): void {
    this.resolve(stmt.expr);
  }

  visitFunctionStmt(stmt: Stmt.Function): void {
    this.#declare(stmt.name);
    this.#define(stmt.name);

    this.#resolveFunction(stmt, FunctionType.FUNCTION);
  }

  visitIfStmt(stmt: Stmt.If): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve(stmt.elseBranch);
  }

  visitPrintStmt(stmt: Stmt.Print): void {
    this.resolve(stmt.expr);
  }

  visitReturnStmt(stmt: Stmt.Return): void {
    if (this.#currentFunction == FunctionType.NONE) error(stmt.keyword, "Can't return from top-level code.");

    this.resolve(stmt.value);
  }

  visitVarStmt(stmt: Stmt.Var): void {
    this.#declare(stmt.name);
    if (stmt.initializer) this.resolve(stmt.initializer);
    this.#define(stmt.name);
  }

  visitWhileStmt(stmt: Stmt.While): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  visitAssignExpr(expr: Expr.Assign): void {
    this.resolve(expr.value);
    this.#resolveLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: Expr.Binary): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpr(expr: Expr.Call): void {
    this.resolve(expr.callee);
    for (const arg of expr.args) this.resolve(arg);
  }

  visitGroupingExpr(expr: Expr.Grouping): void {
    this.resolve(expr.expr);
  }

  visitLiteralExpr(): void {
    // noop
  }

  visitLogicalExpr(expr: Expr.Logical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitUnaryExpr(expr: Expr.Unary): void {
    this.resolve(expr.expr);
  }

  visitVariableExpr(expr: Expr.Variable): void {
    if (this.#scopes.at(-1)?.get(expr.name.lexeme) === false) {
      error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.#resolveLocal(expr, expr.name);
  }

  #scope(fn: () => void) {
    this.#scopes.push(new Map());
    fn();
    this.#scopes.pop();
  }

  #resolveLocal(expr: Expr.Expr, name: Token) {
    const i = this.#scopes.findLastIndex(scope => scope.has(name.lexeme));
    if (i !== -1) this.#interpreter.resolve(expr, this.#scopes.length - 1 - i);
  }

  #resolveFunction(stmt: Stmt.Function, type: FunctionType) {
    const enclosingFunction = this.#currentFunction;
    this.#currentFunction = type;
    this.#scope(() => {
      for (const param of stmt.params) {
        this.#declare(param);
        this.#define(param);
      }
      this.resolve(...stmt.body);
    });

    this.#currentFunction = enclosingFunction;
  }

  #declare(name: Token) {
    const scope = this.#scopes.at(-1);
    if (scope?.has(name.lexeme)) error(name, "Already a variable with this name in this scope.");
    scope?.set(name.lexeme, false);
  }

  #define(name: Token) {
    this.#scopes.at(-1)?.set(name.lexeme, true);
  }
}
