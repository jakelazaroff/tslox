import { Token, TokenType } from "./Scanner";
import { error } from "./Lox";
import * as Expr from "./Expr";
import * as Stmt from "./Stmt";

class ParseError extends Error {}

export class Parser {
  #tokens: Token[] = [];
  #current = 0;

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
  }

  parse() {
    const statements: Stmt.Stmt[] = [];
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
      if (this.#match(TokenType.CLASS)) return this.#classDeclaration();
      if (this.#match(TokenType.FUN)) return this.#function("function");
      if (this.#match(TokenType.VAR)) return this.#varDeclaration();

      return this.#statement();
    } catch (error: unknown) {
      if (error instanceof ParseError) return this.#synchronize();
      throw error;
    }
  }

  #classDeclaration() {
    const name = this.#consume(TokenType.IDENTIFIER, "Expect class name.");
    this.#consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

    const methods: Stmt.Function[] = [];
    while (!this.#check(TokenType.RIGHT_BRACE) && !this.#done) {
      methods.push(this.#function("method"));
    }

    this.#consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

    return new Stmt.Class(name, methods);
  }

  #function(kind: string) {
    const name = this.#consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
    this.#consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);

    const parameters: Token[] = [];
    if (!this.#check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) error(this.#peek(), "Can't have more than 255 parameters.");

        parameters.push(this.#consume(TokenType.IDENTIFIER, "Expect parameter name."));
      } while (this.#match(TokenType.COMMA));
    }

    this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

    this.#consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + " body.");
    const body = this.#block();

    return new Stmt.Function(name, parameters, body);
  }

  #varDeclaration() {
    const name = this.#consume(TokenType.IDENTIFIER, "Expect variable name.");

    let initializer: Expr.Expr | undefined;
    if (this.#match(TokenType.EQUAL)) initializer = this.#expression();

    this.#consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Stmt.Var(name, initializer);
  }

  #statement(): Stmt.Stmt {
    if (this.#match(TokenType.FOR)) return this.#forStatement();
    if (this.#match(TokenType.IF)) return this.#ifStatement();
    if (this.#match(TokenType.PRINT)) return this.#printStatement();
    if (this.#match(TokenType.RETURN)) return this.#returnStatement();
    if (this.#match(TokenType.WHILE)) return this.#whileStatement();
    if (this.#match(TokenType.LEFT_BRACE)) return new Stmt.Block(this.#block());
    return this.#expressionStatement();
  }

  #forStatement() {
    this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
    let initializer: Stmt.Stmt | undefined;
    let condition: Expr.Expr | undefined;
    let increment: Expr.Expr | undefined;

    if (this.#match(TokenType.SEMICOLON)) {
      // noop
    } else if (this.#match(TokenType.VAR)) initializer = this.#varDeclaration();
    else initializer = this.#expressionStatement();

    if (!this.#check(TokenType.SEMICOLON)) condition = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    if (!this.#check(TokenType.RIGHT_PAREN)) increment = this.#expression();
    this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.#statement();
    if (increment) body = new Stmt.Block([body, new Stmt.Expression(increment)]);
    body = new Stmt.While(condition || new Expr.Literal(true), body);
    if (initializer) body = new Stmt.Block([initializer, body]);

    return body;
  }

  #ifStatement() {
    this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.#expression();
    this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.#statement();
    let elseBranch: Stmt.Stmt | undefined;
    if (this.#match(TokenType.ELSE)) {
      elseBranch = this.#statement();
    }

    return new Stmt.If(condition, thenBranch, elseBranch);
  }

  #printStatement() {
    const value = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }

  #returnStatement() {
    const keyword = this.#previous();
    let value: Expr.Expr = new Expr.Literal(null);
    if (!this.#check(TokenType.SEMICOLON)) value = this.#expression();

    this.#consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return new Stmt.Return(keyword, value);
  }

  #whileStatement() {
    this.#consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.#expression();
    this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.#statement();

    return new Stmt.While(condition, body);
  }

  #expressionStatement() {
    const value = this.#expression();
    this.#consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Stmt.Expression(value);
  }

  #block() {
    const statements: Stmt.Stmt[] = [];

    while (!this.#check(TokenType.RIGHT_BRACE) && !this.#done) {
      const decl = this.#declaration();
      if (decl) statements.push(decl);
    }

    this.#consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  #expression(): Expr.Expr {
    return this.#assignment();
  }

  #assignment(): Expr.Expr {
    const expr = this.#or();

    if (this.#match(TokenType.EQUAL)) {
      const equals = this.#previous();
      const value = this.#assignment();

      if (expr instanceof Expr.Variable) return new Expr.Assign(expr.name, value);
      else if (expr instanceof Expr.Get) return new Expr.Set(expr.object, expr.name, value);

      error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  #or(): Expr.Expr {
    let expr = this.#and();

    while (this.#match(TokenType.OR)) {
      const operator = this.#previous();
      const right = this.#and();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  #and(): Expr.Expr {
    let expr = this.#equality();

    while (this.#match(TokenType.AND)) {
      const operator = this.#previous();
      const right = this.#equality();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  #equality(): Expr.Expr {
    let expr = this.#comparison();

    while (this.#match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.#previous();
      const right = this.#comparison();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  #comparison(): Expr.Expr {
    let expr = this.#term();

    while (this.#match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.#previous();
      const right = this.#term();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  #term(): Expr.Expr {
    let expr = this.#factor();

    while (this.#match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.#previous();
      const right = this.#factor();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  #factor(): Expr.Expr {
    let expr = this.#unary();

    while (this.#match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.#previous();
      const right = this.#unary();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  #unary(): Expr.Expr {
    if (this.#match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.#previous();
      const right = this.#unary();
      return new Expr.Unary(operator, right);
    }

    return this.#call();
  }

  #call(): Expr.Expr {
    let expr = this.#primary();

    while (true) {
      if (this.#match(TokenType.LEFT_PAREN)) expr = this.#finishCall(expr);
      else if (this.#match(TokenType.DOT)) {
        const name = this.#consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
        expr = new Expr.Get(expr, name);
      } else break;
    }

    return expr;
  }

  #finishCall(callee: Expr.Expr) {
    const args: Expr.Expr[] = [];

    if (!this.#check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) error(this.#peek(), "Can't have more than 255 arguments.");
        args.push(this.#expression());
      } while (this.#match(TokenType.COMMA));
    }

    const paren = this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

    return new Expr.Call(callee, paren, args);
  }

  #primary(): Expr.Expr {
    if (this.#match(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.#match(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.#match(TokenType.NIL)) return new Expr.Literal(null);
    if (this.#match(TokenType.NUMBER, TokenType.STRING)) return new Expr.Literal(this.#previous().literal);
    if (this.#match(TokenType.THIS)) return new Expr.This(this.#previous());
    if (this.#match(TokenType.IDENTIFIER)) return new Expr.Variable(this.#previous());

    if (this.#match(TokenType.LEFT_PAREN)) {
      const expr = this.#expression();
      this.#consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.#error(this.#peek(), "Expect expression.");
  }
}
