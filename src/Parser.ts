import { Binary, Unary, type Expr, Literal, Grouping, Variable, Assign } from "./Expr";
import { Token, TokenType } from "./Scanner";
import { error } from "./Lox";
import { Expression, Print, Var, type Stmt, Block } from "./Stmt";

class ParseError extends Error {}

export class Parser {
  #tokens: Token[] = [];
  #current = 0;

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
  }

  parse() {
    const statements: Stmt[] = [];
    while (!this.#done) {
      const statement = this.#declaration();
      if (statement) statements.push(statement);
    }

    return statements;
  }

  #advance(): Token {
    if (!this.#done) this.#current++;
    return this.#previous();
  }

  get #done() {
    return this.#peek().type == TokenType.EOF;
  }

  #peek() {
    return this.#tokens[this.#current];
  }

  #previous() {
    return this.#tokens[this.#current - 1];
  }

  #check(type: TokenType) {
    if (this.#done) return false;
    return this.#peek().type == type;
  }

  #match(...types: TokenType[]) {
    for (const type of types) {
      if (this.#check(type)) {
        this.#advance();
        return true;
      }
    }

    return false;
  }

  #consume(type: TokenType, message: string): Token {
    if (this.#check(type)) return this.#advance();

    throw this.#error(this.#peek(), message);
  }

  #error(token: Token, message: string): ParseError {
    error(token, message);
    return new ParseError();
  }

  #synchronize() {
    this.#advance();

    while (!this.#done) {
      if (this.#previous().type === TokenType.SEMICOLON) return;

      switch (this.#peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.#advance();
    }
  }

  #declaration() {
    try {
      if (this.#match(TokenType.VAR)) return this.#varDeclaration();

      return this.#statement();
    } catch (error: unknown) {
      if (error instanceof ParseError) return this.#synchronize();
      throw error;
    }
  }

  #varDeclaration() {
    const name = this.#consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer: Expr | undefined;
    if (this.#match(TokenType.EQUAL)) initializer = this.#expression();

    this.#consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }

  #statement(): Stmt {
    if (this.#match(TokenType.PRINT)) return this.#printStatement();
    if (this.#match(TokenType.LEFT_BRACE)) return new Block(this.#block());
    return this.#expressionStatement();
  }

  #printStatement() {
    const value = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  #expressionStatement() {
    const value = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Expression(value);
  }

  #block() {
    const statements: Stmt[] = [];

    while (!this.#check(TokenType.RIGHT_BRACE) && !this.#done) {
      const decl = this.#declaration();
      if (decl) statements.push(decl);
    }

    this.#consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  #expression(): Expr {
    return this.#assignment();
  }

  #assignment(): Expr {
    const expr = this.#equality();

    if (this.#match(TokenType.EQUAL)) {
      const equals = this.#previous();
      const value = this.#assignment();

      if (expr instanceof Variable) return new Assign(expr.name, value);
      error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  #equality(): Expr {
    let expr = this.#comparison();

    while (this.#match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.#previous();
      const right = this.#comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  #comparison(): Expr {
    let expr = this.#term();

    while (this.#match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.#previous();
      const right = this.#term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  #term(): Expr {
    let expr = this.#factor();

    while (this.#match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.#previous();
      const right = this.#factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  #factor(): Expr {
    let expr = this.#unary();

    while (this.#match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.#previous();
      const right = this.#unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  #unary(): Expr {
    if (this.#match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.#previous();
      const right = this.#unary();
      return new Unary(operator, right);
    }

    return this.#primary();
  }

  #primary(): Expr {
    if (this.#match(TokenType.FALSE)) return new Literal(false);
    if (this.#match(TokenType.TRUE)) return new Literal(true);
    if (this.#match(TokenType.NIL)) return new Literal(null);
    if (this.#match(TokenType.NUMBER, TokenType.STRING)) return new Literal(this.#previous().literal);
    if (this.#match(TokenType.IDENTIFIER)) return new Variable(this.#previous());

    if (this.#match(TokenType.LEFT_PAREN)) {
      const expr = this.#expression();
      this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr);
    }

    throw this.#error(this.#peek(), "Expect expression.");
  }
}
