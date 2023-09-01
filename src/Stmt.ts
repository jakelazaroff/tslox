import type { Expr } from "./Expr";
import type { Token } from "./Scanner";

export abstract class Stmt {
  abstract accept<T>(visitor: StmtVisitor<T>): T;
}

export interface StmtVisitor<T> {
  visitExpressionStmt(stmt: Expression): T;
  visitPrintStmt(stmt: Print): T;
  visitVarStmt(stmt: Var): T;
  visitBlockStmt(stmt: Block): T;
  visitIfStmt(stmt: If): T;
  visitWhileStmt(stmt: While): T;
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

export class If extends Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch?: Stmt;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch?: Stmt) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept<T>(visitor: StmtVisitor<T>) {
    return visitor.visitIfStmt(this);
  }
}

export class While extends Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    super();
    this.condition = condition;
    this.body = body;
  }

  accept<T>(visitor: StmtVisitor<T>) {
    return visitor.visitWhileStmt(this);
  }
}
