import { Interpreter, type RuntimeError } from "./Interpreter";
import { Parser } from "./Parser";
import { Resolver } from "./Resolver";
import { Scanner, Token, TokenType } from "./Scanner";

let hadError = false;
let hadRuntimeError = false;

const interpreter = new Interpreter();

export async function main() {
  switch (Bun.argv.length) {
    case 2:
      await runPrompt();
      break;

    case 3:
      await runFile(Bun.argv[2] || "");
      break;

    default:
      console.log("Usage: tslox [script]");
      process.exit(64);
  }
}

async function runFile(path: string) {
  const source = await Bun.file(path).text();
  run(source);

  if (hadError) process.exit(65);
  if (hadRuntimeError) process.exit(70);
}

async function runPrompt() {
  const prompt = "> ";

  process.stdout.write(prompt);
  for await (const line of console) {
    if (!line) break;

    run(line);
    hadError = false;
    process.stdout.write(prompt);
  }
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens);
  const statements = parser.parse();

  // stop if there was a syntax error
  if (hadError) return;

  const resolver = new Resolver(interpreter);
  resolver.resolve(...statements);

  // Stop if there was a resolution error.
  if (hadError) return;

  interpreter.interpret(statements);
}

export function error(problem: number, message: string): void;
export function error(problem: Token, message: string): void;
export function error(problem: number | Token, message: string) {
  if (typeof problem === "number") report(problem, "", message);
  else if (problem.type == TokenType.EOF) report(problem.line, " at end", message);
  else report(problem.line, " at '" + problem.lexeme + "'", message);
}

function report(line: number, where: string, message: string) {
  process.stderr.write(`[line ${line}] Error${where}: ${message}\n`);
  hadError = true;
}

export function runtimeError(error: RuntimeError) {
  process.stderr.write(`${error.message}\n[line ${error.token.line}]\n`);
  hadRuntimeError = true;
}
