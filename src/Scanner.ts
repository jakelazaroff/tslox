import { error } from "./Lox";

export class Token {
  type: TokenType;
  lexeme: string;
  literal: unknown;
  line: number;

  constructor(type: TokenType, lexeme: string, literal: unknown, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    let lit = this.literal;

    // ensure numbers have at least one decimal digit
    if (typeof lit === "number") lit = lit.toFixed(Math.max(1, `${lit}`.split(".")[1]?.length || 0));

    return `${this.type} ${this.lexeme} ${lit}`;
  }
}

export enum TokenType {
  // single-character tokens
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  LEFT_BRACE = "LEFT_BRACE",
  RIGHT_BRACE = "RIGHT_BRACE",
  COMMA = "COMMA",
  DOT = "DOT",
  MINUS = "MINUS",
  PLUS = "PLUS",
  SEMICOLON = "SEMICOLON",
  SLASH = "SLASH",
  STAR = "STAR",

  // one or two character tokens
  BANG = "BANG",
  BANG_EQUAL = "BANG_EQUAL",
  EQUAL = "EQUAL",
  EQUAL_EQUAL = "EQUAL_EQUAL",
  GREATER = "GREATER",
  GREATER_EQUAL = "GREATER_EQUAL",
  LESS = "LESS",
  LESS_EQUAL = "LESS_EQUAL",

  // literals
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",

  // keywords
  AND = "AND",
  CLASS = "CLASS",
  ELSE = "ELSE",
  FALSE = "FALSE",
  FUN = "FUN",
  FOR = "FOR",
  IF = "IF",
  NIL = "NIL",
  OR = "OR",
  PRINT = "PRINT",
  RETURN = "RETURN",
  SUPER = "SUPER",
  THIS = "THIS",
  TRUE = "TRUE",
  VAR = "VAR",
  WHILE = "WHILE",

  EOF = "EOF"
}

export class Scanner {
  #source = "";
  #tokens: Token[] = [];

  #start = 0;
  #current = 0;
  #line = 1;

  static keywords: { [key: string]: TokenType } = {
    and: TokenType.AND,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    fun: TokenType.FUN,
    if: TokenType.IF,
    nil: TokenType.NIL,
    or: TokenType.OR,
    print: TokenType.PRINT,
    return: TokenType.RETURN,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    var: TokenType.VAR,
    while: TokenType.WHILE
  };

  constructor(source: string) {
    this.#source = source;
  }

  scanTokens(): Token[] {
    while (!this.#done) {
      // we're at the beginning of the next lexeme
      this.#start = this.#current;
      this.#scanToken();
    }

    this.#tokens.push(new Token(TokenType.EOF, "", null, this.#line));
    return this.#tokens;
  }

  get #done() {
    return this.#current >= this.#source.length;
  }

  #peek(lookahead = 0) {
    if (this.#done) return "\0";
    return this.#source[this.#current + lookahead] || "\0";
  }

  #advance() {
    return this.#source[this.#current++] || "\0";
  }

  #match(expected: string) {
    if (this.#done) return false;
    if (this.#source[this.#current] != expected) return false;

    this.#current++;
    return true;
  }

  #add(type: TokenType, literal: unknown = null) {
    const text = this.#source.substring(this.#start, this.#current);
    this.#tokens.push(new Token(type, text, literal, this.#line));
  }

  #scanToken() {
    const c = this.#advance();
    switch (c) {
      case "(":
        this.#add(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.#add(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.#add(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.#add(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.#add(TokenType.COMMA);
        break;
      case ".":
        this.#add(TokenType.DOT);
        break;
      case "-":
        this.#add(TokenType.MINUS);
        break;
      case "+":
        this.#add(TokenType.PLUS);
        break;
      case ";":
        this.#add(TokenType.SEMICOLON);
        break;
      case "*":
        this.#add(TokenType.STAR);
        break;
      case "!":
        this.#add(this.#match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.#add(this.#match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case "<":
        this.#add(this.#match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.#add(this.#match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case "/":
        // match comments
        if (this.#match("/")) while (this.#peek() !== "\n" && !this.#done) this.#advance();
        // match slashes
        else this.#add(TokenType.SLASH);
        break;

      // ignore whitespace
      case " ":
      case "\r":
      case "\t":
        break;

      case "\n":
        this.#line++;
        break;

      case '"':
        this.#string();
        break;

      default:
        if (isDigit(c)) this.#number();
        else if (isAlpha(c)) this.#identifier();
        else error(this.#line, "Unexpected character.");
        break;
    }
  }

  #string() {
    // consume the string
    while (this.#peek() !== '"' && !this.#done) {
      if (this.#peek() === "\n") this.#line++;
      this.#advance();
    }

    if (this.#done) return error(this.#line, "Unterminated string.");

    // the closing delimiter
    this.#advance();

    // Trim the surrounding quotes.
    const value = this.#source.substring(this.#start + 1, this.#current - 1);
    this.#add(TokenType.STRING, value);
  }

  #number() {
    while (isDigit(this.#peek())) this.#advance();

    // consume a fractional part, if it exists
    if (this.#peek() == "." && isDigit(this.#peek(1))) {
      // consume the decimal point
      this.#advance();

      // consume additional digits
      while (isDigit(this.#peek())) this.#advance();
    }

    this.#add(TokenType.NUMBER, Number(this.#source.substring(this.#start, this.#current)));
  }

  #identifier() {
    while (isAlphaNumeric(this.#peek())) this.#advance();

    const text = this.#source.substring(this.#start, this.#current);
    const type = Scanner.keywords[text] || TokenType.IDENTIFIER;
    this.#add(type);
  }
}

function isAlpha(c: string) {
  return ("a" <= c && c <= "z") || ("A" <= c && c <= "Z") || c == "_";
}

function isDigit(c: string) {
  return "0" <= c && c <= "9";
}

function isAlphaNumeric(c: string) {
  return isAlpha(c) || isDigit(c);
}
