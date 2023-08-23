import { Scanner } from "./Scanner";

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

  for (const token of tokens) {
    console.log(token.toString());
  }
}

export function error(line: number, message: string) {
  report(line, "", message);
}

function report(line: number, where: string, message: string) {
  console.log("[line " + line + "] Error" + where + ": " + message);
  hadError = true;
}
