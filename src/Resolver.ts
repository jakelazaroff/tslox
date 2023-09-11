import type { Interpreter } from "./Interpreter";
import * as Expr from "./Expr";
import type * as Stmt from "./Stmt";
import type { Token } from "./Scanner";
import { error } from "./Lox";

enum FunctionType {
  NONE,
  FUNCTION,
  INITIALIZER,
  METHOD
}

enum ClassType {
  NONE,
  CLASS
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  #interpreter: Interpreter;
  #scopes: Map<string, boolean>[] = [];
  #currentFunction = FunctionType.NONE;
  #currentClass = ClassType.NONE;

  constructor(interpreter: Interpreter) {
    this.#interpreter = interpreter;
  }

  resolve(...nodes: Array<Stmt.Stmt | Expr.Expr>) {
    for (const node of nodes) node.accept(this);
  }

  visitBlockStmt(stmt: Stmt.Block) {
    this.#scope(() => {
      this.resolve(...stmt.statements);
    });
  }

  visitClassStmt(stmt: Stmt.Class) {
    const enclosingClass = this.#currentClass;
    this.#currentClass = ClassType.CLASS;

    this.#declare(stmt.name);
    this.#define(stmt.name);

    this.#scope(() => {
      this.#scopes.at(-1)?.set("this", true);

      for (const method of stmt.methods) {
        let declaration = FunctionType.METHOD;
        if (method.name.lexeme === "init") declaration = FunctionType.INITIALIZER;

        this.#resolveFunction(method, declaration);
      }
    });

    this.#currentClass = enclosingClass;
  }

  visitExpressionStmt(stmt: Stmt.Expression) {
    this.resolve(stmt.expr);
  }

  visitFunctionStmt(stmt: Stmt.Function) {
    this.#declare(stmt.name);
    this.#define(stmt.name);

    this.#resolveFunction(stmt, FunctionType.FUNCTION);
  }

  visitIfStmt(stmt: Stmt.If) {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve(stmt.elseBranch);
  }

  visitPrintStmt(stmt: Stmt.Print) {
    this.resolve(stmt.expr);
  }

  visitReturnStmt(stmt: Stmt.Return) {
    if (this.#currentFunction == FunctionType.NONE) error(stmt.keyword, "Can't return from top-level code.");
    if (
      this.#currentFunction == FunctionType.INITIALIZER &&
      stmt.value instanceof Expr.Literal &&
      stmt.value.value !== null
    ) {
      error(stmt.keyword, "Can't return a value from an initializer.");
    }

    this.resolve(stmt.value);
  }

  visitVarStmt(stmt: Stmt.Var) {
    this.#declare(stmt.name);
    if (stmt.initializer) this.resolve(stmt.initializer);
    this.#define(stmt.name);
  }

  visitWhileStmt(stmt: Stmt.While) {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  visitAssignExpr(expr: Expr.Assign) {
    this.resolve(expr.value);
    this.#resolveLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: Expr.Binary) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpr(expr: Expr.Call) {
    this.resolve(expr.callee);
    for (const arg of expr.args) this.resolve(arg);
  }

  visitGetExpr(expr: Expr.Get) {
    this.resolve(expr.object);
  }

  visitGroupingExpr(expr: Expr.Grouping) {
    this.resolve(expr.expr);
  }

  visitLiteralExpr() {
    // noop
  }

  visitLogicalExpr(expr: Expr.Logical) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitSetExpr(expr: Expr.Set) {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  visitThisExpr(expr: Expr.This) {
    if (this.#currentClass == ClassType.NONE) return error(expr.keyword, "Can't use 'this' outside of a class.");

    this.#resolveLocal(expr, expr.keyword);
  }

  visitUnaryExpr(expr: Expr.Unary) {
    this.resolve(expr.expr);
  }

  visitVariableExpr(expr: Expr.Variable) {
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
