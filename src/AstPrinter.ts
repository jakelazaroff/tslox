import { type ExprVisitor, Expr, Binary, Grouping, Literal, Unary } from "./Expr";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Binary) {
    return this.#parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Grouping) {
    return this.#parenthesize("group", expr.expr);
  }

  visitLiteralExpr(expr: Literal) {
    if (expr.value == null) return "nil";
    let val = expr.value;

    // ensure numbers have at least one decimal digit
    if (typeof val === "number") val = val.toFixed(Math.max(1, `${val}`.split(".")[1]?.length || 0));

    return val.toString();
  }

  visitUnaryExpr(expr: Unary) {
    return this.#parenthesize(expr.operator.lexeme, expr.expr);
  }

  #parenthesize(name: string, ...exprs: Expr[]): string {
    return `(${name} ${exprs.map(expr => expr.accept(this)).join(" ")})`;
  }
}
