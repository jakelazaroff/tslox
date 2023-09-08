import type { Token } from "./Scanner";

export abstract class Expr {
  abstract accept<T>(visitor: ExprVisitor<T>): T;
}

export interface ExprVisitor<T> {
  visitVariableExpr(expr: Variable): T;
  visitAssignExpr(expr: Assign): T;
  visitGroupingExpr(expr: Grouping): T;
  visitBinaryExpr(expr: Binary): T;
  visitLogicalExpr(expr: Logical): T;
  visitUnaryExpr(expr: Unary): T;
  visitCallExpr(expr: Call): T;
  visitLiteralExpr(expr: Literal): T;
}

export class Call extends Expr {
  callee: Expr;
  paren: Token;
  args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    super();
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  override accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitCallExpr(this);
  }
}

export class Variable extends Expr {
  name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitVariableExpr(this);
  }
}

export class Assign extends Expr {
  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {
    super();
    this.name = name;
    this.value = value;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitAssignExpr(this);
  }
}

export class Grouping extends Expr {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  value: unknown;

  constructor(value: unknown) {
    super();
    this.value = value;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitLiteralExpr(this);
  }
}

export class Unary extends Expr {
  operator: Token;
  expr: Expr;

  constructor(operator: Token, expr: Expr) {
    super();
    this.operator = operator;
    this.expr = expr;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitUnaryExpr(this);
  }
}

export class Binary extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitBinaryExpr(this);
  }
}

export class Logical extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: ExprVisitor<T>) {
    return visitor.visitLogicalExpr(this);
  }
}
