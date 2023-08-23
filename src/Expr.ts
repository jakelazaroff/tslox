import type { Token } from "./Scanner";

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
  visitBinaryExpr(expr: Binary): T;
  visitGroupingExpr(expr: Grouping): T;
  visitLiteralExpr(expr: Literal): T;
  visitUnaryExpr(expr: Unary): T;
}

export class Grouping extends Expr {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  value: unknown;

  constructor(value: unknown) {
    super();
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>) {
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

  accept<T>(visitor: Visitor<T>) {
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

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitBinaryExpr(this);
  }
}
