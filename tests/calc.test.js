// Run with: node tests/calc.test.js
const assert = require("assert");
const path = require("path");
const fs = require("fs");
const C = require("../js/calc.js");
const rates = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/rates.json"), "utf8"));

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok  " + name); }

const base = {
  county: "queen_annes", closing: "2026-05-25", listPct: 2.5, buyPct: 2.5, conc: 17850, concPct: false, loan1: 238000,
  feeSettle: 0, feeWire: 30, feeCourier: 30, feePayoff: 175, feeDoc: 0, feeRelease: 45, adminFee: 0,
  sellerShare: 0.5, ovRec: null, ovLocal: null, annualTax: 0, taxStatus: "paid",
};

test("matches the original Queen Anne's net sheet to the penny", () => {
  const r = C.buildSheet(rates, base, 595000);
  assert.strictEqual(r.tTitle, 280);
  assert.strictEqual(r.tx.rec, 2945.25);
  assert.strictEqual(r.tx.state, 1487.5);
  assert.strictEqual(r.tx.local, 1487.5);
  assert.strictEqual(r.tThird, 5920.25);
  assert.strictEqual(r.tSell, 29750);
  assert.strictEqual(r.closingCosts, 35950.25);
  assert.strictEqual(r.proceeds, 559049.75);
  assert.strictEqual(r.tAdd, 255850);
  assert.strictEqual(r.net, 303199.75);
});

test("$495 admin fee comes off the net", () => {
  assert.strictEqual(C.buildSheet(rates, { ...base, adminFee: 495 }, 595000).net, 302704.75);
});

test("percent concessions scale with price", () => {
  const r = C.buildSheet(rates, { ...base, conc: 3, concPct: true }, 600000);
  assert.strictEqual(r.add[4][1], 18000);
});

test("first-time buyer in Queen Anne's: seller pays reduced state and county tax in full", () => {
  const r = C.buildSheet(rates, { ...base, fthb: true }, 595000);
  assert.strictEqual(r.tx.state, 1487.5);   // 0.25% of 595k, all seller
  assert.strictEqual(r.tx.local, 1487.5);   // 0.25% of 595k, all seller
  assert.strictEqual(r.tx.rec, 2945.25);    // recordation still split
});

test("Montgomery tiered recordation with owner-occupant credit", () => {
  const r = C.buildSheet(rates, { ...base, county: "montgomery", owner: true }, 650000);
  // 4,450 + 1,350 + 50,000*2.04% = 6,820, minus 890 = 5,930
  assert.strictEqual(r.tx.recTotal, 5930);
  assert.strictEqual(r.tx.localTotal, 6500);
});

test("Baltimore City yield tax over $1M", () => {
  const r = C.buildSheet(rates, { ...base, county: "baltimore_city" }, 1200000);
  assert.strictEqual(r.tx.recTotal, C.r2(1200000 / 500 * 5 * 1.15));
  assert.strictEqual(r.tx.localTotal, C.r2(1200000 * 0.021));
});

test("Garrett exempts the first $50,000 of county transfer tax", () => {
  const r = C.buildSheet(rates, { ...base, county: "garrett" }, 300000);
  assert.strictEqual(r.tx.localTotal, 2500);
});

test("rate sets switch on their effective date", () => {
  const copy = JSON.parse(JSON.stringify(rates));
  const qa = copy.counties.find((c) => c.id === "queen_annes");
  qa.rates.push({ ...qa.rates[0], effective: "2027-07-01", rec: 6.0 });
  assert.strictEqual(C.countyRates(copy, "queen_annes", "2027-06-30").rec, 4.95);
  assert.strictEqual(C.countyRates(copy, "queen_annes", "2027-07-01").rec, 6.0);
});

test("property tax proration", () => {
  const p = C.prorateTax(6000, "paid", "2026-11-20");
  assert.strictEqual(p.sellerDays, 142);
  assert.strictEqual(p.credit, 3665.75);
  assert.ok(C.prorateTax(6000, "unpaid", "2026-11-20").credit < 0);
});

test("every county has a complete current rate set", () => {
  assert.strictEqual(rates.counties.length, 24);
  for (const c of rates.counties) {
    const r = C.countyRates(rates, c.id, "2026-10-05");
    assert.ok(r.special === "moco" || typeof r.rec === "number", c.id + " recordation");
    assert.ok(typeof r.lt === "number", c.id + " transfer");
  }
});

test("PDF writer produces a valid file", () => {
  const MiniPDF = require("../js/minipdf.js");
  const d = new MiniPDF();
  d.setFont("helvetica", "bold"); d.setFontSize(18); d.text("Estimated Net Seller Proceeds — test", 42, 60);
  d.setFont("helvetica", "normal"); d.text("$303,199.75", 570, 80, { align: "right" });
  d.addPage(); d.text("Page two", 42, 60);
  const bytes = d.output();
  const s = Buffer.from(bytes).toString("latin1");
  assert.ok(s.startsWith("%PDF-1.4"));
  assert.ok(s.trimEnd().endsWith("%%EOF"));
  assert.ok(/\/Count 2/.test(s));
  fs.writeFileSync(path.join(require("os").tmpdir(), "netsheet-test.pdf"), bytes);
});

console.log(`\n${passed} tests passed`);
