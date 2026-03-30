import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJsonPath = resolve("package.json");
const defaultGremlinsPath = resolve("src/config/default-gremlins.json");

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const defaultGremlins = JSON.parse(readFileSync(defaultGremlinsPath, "utf8"));

packageJson.contributes.configuration.properties[
  "highlight-unwanted-spaces.gremlins.characters"
].default = defaultGremlins;

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
