import { AstPrinter } from "./AstPrinter";
import { Parser } from "./Parser";
import { Scanner, Token, TokenType } from "./Scanner";

let hadError = false;

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
  const expr = parser.parse();

  // stop if there was a syntax error
  if (hadError || !expr) return;

  console.log(new AstPrinter().print(expr));
}

export function error(problem: number, message: string): void;
export function error(problem: Token, message: string): void;
export function error(problem: number | Token, message: string) {
  if (typeof problem === "number") report(problem, "", message);
  else if (problem.type == TokenType.EOF) report(problem.line, " at end", message);
  else report(problem.line, " at '" + problem.lexeme + "'", message);
}

function report(line: number, where: string, message: string) {
  console.log("[line " + line + "] Error" + where + ": " + message);
  hadError = true;
}
