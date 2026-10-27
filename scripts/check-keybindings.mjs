/* Round-trip gate for the keybinding table. Run with `pnpm keys:check`.

   A chord is stored as text but matched against a live KeyboardEvent, so a
   binding whose stored form does not match what `eventToChord` produces is
   documented in the shortcuts panel and silently never fires. This rebuilds an
   event from each stored chord and checks it round-trips. */

import { eventToChord, formatChord, isBindable, keybindings } from "../src/content/keybindings.ts";

function fakeEvent(chord) {
  const parts = chord.split("+");
  const key = parts.at(-1);
  return {
    ctrlKey: parts.includes("Mod"),
    metaKey: false,
    altKey: parts.includes("Alt"),
    shiftKey: parts.includes("Shift"),
    // Browsers report single characters already shifted; eventToChord uppercases.
    key: key.length === 1 ? key.toLowerCase() : key,
  };
}

let failures = 0;
const seen = new Map();

for (const binding of keybindings) {
  const problems = [];
  const roundTrip = eventToChord(fakeEvent(binding.chord));
  if (roundTrip !== binding.chord) problems.push(`parses back as "${roundTrip}"`);
  if (!isBindable(binding.chord)) problems.push("rejected by isBindable, so it cannot be rebound");

  const clash = seen.get(binding.chord);
  if (clash) problems.push(`duplicate of ${clash}`);
  seen.set(binding.chord, binding.command);

  if (problems.length) {
    failures += problems.length;
    console.log(`FAIL  ${binding.command.padEnd(18)} ${binding.chord}`);
    for (const p of problems) console.log(`        ${p}`);
  } else {
    console.log(`PASS  ${binding.command.padEnd(18)} ${binding.chord.padEnd(22)} shows as "${formatChord(binding.chord)}"`);
  }
}

console.log(`\n${keybindings.length} bindings, ${failures} problems.`);
process.exit(failures ? 1 : 0);
