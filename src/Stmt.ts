import type { Expr } from "./Expr";
import type { Token } from "./Scanner";

export abstract class Stmt {
  abstract accept<T>(visitor: StmtVisitor<T>): T;
}

export interface StmtVisitor<T> {
  visitExpressionStmt(expr: Expression): T;
  visitPrintStmt(expr: Print): T;
  visitVarStmt(expr: Var): T;
  visitBlockStmt(expr: Block): T;
}

export class Expression extends Stmt {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class Print extends Stmt {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}

export class Var extends Stmt {
  name: Token;
  initializer?: Expr;

  constructor(name: Token, initializer?: Expr) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitVarStmt(this);
  }
}

export class Block extends Stmt {
  statements: Stmt[];

  constructor(statements: Stmt[]) {
    super();
    this.statements = statements;
  }

  accept<T>(visitor: StmtVisitor<T>): T {
    return visitor.visitBlockStmt(this);
  }
}
