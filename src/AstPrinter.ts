import { type Visitor, Expr, Binary, Grouping, Literal, Unary } from "./Expr";
import { Token, TokenType } from "./Scanner";

export class AstPrinter implements Visitor<string> {
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
    return expr.value.toString();
  }

  visitUnaryExpr(expr: Unary) {
    return this.#parenthesize(expr.operator.lexeme, expr.expr);
  }

  #parenthesize(name: string, ...exprs: Expr[]): string {
    return `(${name} ${exprs.map(expr => expr.accept(this)).join(" ")})`;
  }
}

const expr = new Binary(
  new Unary(new Token(TokenType.MINUS, "-", null, 1), new Literal(123)),
  new Token(TokenType.STAR, "*", null, 1),
  new Grouping(new Literal(45.67))
);

console.log(new AstPrinter().print(expr));
