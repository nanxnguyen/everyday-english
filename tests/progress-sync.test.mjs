import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadProgressSync() {
  const source = await readFile(new URL("../public/learn/progress-sync.js", import.meta.url), "utf8");
  const context = {
    fetch: async () => { throw new Error("not used"); },
    setTimeout,
    clearTimeout,
    window: { addEventListener() {}, dispatchEvent() {} },
    document: { addEventListener() {}, visibilityState: "visible" },
    Event,
  };
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__progressSync = ProgressSync;`, context);
  return context.__progressSync;
}

test("merges progress without losing records, history, skills, or completion dates", async () => {
  const sync = await loadProgressSync();
  const remote = {
    records: { 1: { seen: 4, lapses: 1, last: 100, due: 200, streak: 2, lastCorrect: true } },
    history: [{ group: 0, mode: "quiz", at: 100, percent: 80, passed: false }],
    skills: { 0: { imagePassed: true, situationPassed: false } },
    completions: { 0: 500 },
    meta: { schemaVersion: 1, updatedAt: 100 },
  };
  const local = {
    records: {
      1: { seen: 2, lapses: 0, last: 200, due: 400, streak: 3, lastCorrect: true },
      2: { seen: 1, lapses: 0, last: 250, due: 500, streak: 1, lastCorrect: true },
    },
    history: [{ group: 0, mode: "test", at: 200, percent: 90, passed: true }],
    skills: { 0: { imagePassed: false, situationPassed: true } },
    completions: { 0: 600 },
    meta: { schemaVersion: 2, updatedAt: 250 },
  };

  const merged = sync.merge(remote, local);
  assert.equal(merged.records[1].seen, 4);
  assert.equal(merged.records[1].last, 200);
  assert.equal(merged.records[2].seen, 1);
  assert.equal(merged.history.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(merged.skills[0])), { imagePassed: true, situationPassed: true });
  assert.equal(merged.completions[0], 500);
  assert.equal(merged.meta.schemaVersion, 2);
});
