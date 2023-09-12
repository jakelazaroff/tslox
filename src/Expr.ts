import type { Token } from "./Scanner";

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
  visitAssignExpr(expr: Assign): T;
  visitBinaryExpr(expr: Binary): T;
  visitCallExpr(expr: Call): T;
  visitGetExpr(expr: Get): T;
  visitGroupingExpr(expr: Grouping): T;
  visitLiteralExpr(expr: Literal): T;
  visitLogicalExpr(expr: Logical): T;
  visitSetExpr(expr: Set): T;
  visitSuperExpr(expr: Super): T;
  visitThisExpr(expr: This): T;
  visitUnaryExpr(expr: Unary): T;
  visitVariableExpr(expr: Variable): T;
}

export class Assign extends Expr {
  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {
    super();
    this.name = name;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitAssignExpr(this);
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

  override accept<T>(visitor: Visitor<T>) {
    return visitor.visitCallExpr(this);
  }
}

export class Get extends Expr {
  object: Expr;
  name: Token;

  constructor(object: Expr, name: Token) {
    super();
    this.object = object;
    this.name = name;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitGetExpr(this);
  }
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

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitLogicalExpr(this);
  }
}

export class Set extends Expr {
  object: Expr;
  name: Token;
  value: Expr;

  constructor(object: Expr, name: Token, value: Expr) {
    super();
    this.object = object;
    this.name = name;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitSetExpr(this);
  }
}

export class Super extends Expr {
  keyword: Token;
  method: Token;

  constructor(keyword: Token, method: Token) {
    super();
    this.keyword = keyword;
    this.method = method;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitSuperExpr(this);
  }
}

export class This extends Expr {
  keyword: Token;

  constructor(keyword: Token) {
    super();
    this.keyword = keyword;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitThisExpr(this);
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

export class Variable extends Expr {
  name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitVariableExpr(this);
  }
}
