/* Net sheet math. Pure functions only: no page, no storage, no network.
   Loaded by the app in the browser and by tests/calc.test.js in Node. */
(function (root) {
  "use strict";

  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const up500 = (x) => Math.ceil(Math.max(0, x) / 500) * 500;
  const cap = (c) => (c == null ? Infinity : c);

  // Newest rate set whose effective date is on or before the closing date.
  function pickRates(list, dateISO) {
    const sorted = list.slice().sort((a, b) => a.effective.localeCompare(b.effective));
    const day = dateISO || new Date().toISOString().slice(0, 10);
    let chosen = sorted[0];
    for (const r of sorted) if (r.effective <= day) chosen = r;
    return chosen;
  }

  function countyRates(rates, countyId, dateISO) {
    const c = rates.counties.find((x) => x.id === countyId) || rates.counties[0];
    return Object.assign({ id: c.id, name: c.name }, pickRates(c.rates, dateISO));
  }

  function tiered(amount, tiers) {
    let tax = 0, prev = 0;
    for (const [top, rate] of tiers) {
      const t = cap(top);
      if (amount > prev) tax += (Math.min(amount, t) - prev) * rate;
      prev = t;
    }
    return tax;
  }

  // Deed taxes for one price. o = {fthb, owner, sellerShare (0..1), ovRec, ovLocal, closing}
  function calcTaxes(rates, c, price, o) {
    const fthb = !!o.fthb, owner = !!(o.owner || o.fthb);
    const share = o.sellerShare;
    const notes = [];
    const st = pickRates(rates.state, o.closing);

    // Recordation
    let rec;
    if (o.ovRec != null) {
      rec = (up500(price) / 500) * o.ovRec;
    } else if (c.special === "moco") {
      rec = tiered(up500(price), c.recTiers);
      if (owner) { rec = Math.max(0, rec - (c.ooRecCredit || 0)); notes.push("First $100,000 exempt from recordation (owner-occupant)"); }
    } else if (c.special === "bcity") {
      const base = owner ? Math.max(0, price - c.ooRecEx) : price;
      rec = (up500(base) / 500) * c.rec;
      if (owner) notes.push("First $" + c.ooRecEx.toLocaleString("en-US") + " exempt from recordation (owner-occupant)");
      if (price > c.yieldOver) { rec *= c.recYield; notes.push("Includes Baltimore City yield tax over $1M"); }
    } else {
      rec = (up500(price) / 500) * c.rec;
    }

    // County transfer
    let rate = c.lt || 0, ex = 0, localSellerOnly = false;
    if (c.lt1m && price >= 1000000) rate = c.lt1m;
    if (c.special === "bcity") {
      if (price > c.yieldOver) rate = c.ltOver1m;
      if (owner && price < c.ooLtExMaxPrice) ex = c.ooLtEx;
    }
    if (c.ltTiers) { for (const [top, rr] of c.ltTiers) { if (price < cap(top)) { rate = rr; break; } } }
    if (c.allEx) ex = Math.max(ex, c.allEx);
    if (owner && c.ooEx) ex = Math.max(ex, c.ooEx);
    if (fthb && c.fthbEx) ex = Math.max(ex, c.fthbEx);
    if (fthb && c.fthbRate && (!c.fthbMax || price < c.fthbMax)) {
      rate = c.fthbRate;
      if (c.fthbSeller) localSellerOnly = true;
      notes.push("County transfer tax reduced to " + (c.fthbRate * 100) + "% for first-time buyer");
    }
    if (o.ovLocal != null) rate = o.ovLocal / 100;
    if (ex > 0 && rate > 0) notes.push("First $" + ex.toLocaleString("en-US") + " exempt from county transfer tax");
    const local = Math.max(0, price - ex) * rate;

    // State transfer (first-time MD buyer: reduced rate, paid entirely by seller)
    const state = price * (fthb ? st.fthbTransfer : st.transfer);
    if (fthb) notes.push("State transfer tax " + st.fthbTransfer * 100 + "%, paid by seller (first-time buyer)");

    return {
      recTotal: r2(rec), localTotal: r2(local), stateTotal: r2(state),
      rec: r2(rec * share),
      state: r2(fthb ? state : state * share),
      local: r2(localSellerOnly ? local : local * share),
      notes,
    };
  }

  function prorateTax(annual, status, closing) {
    if (!annual || !closing) return null;
    const d = new Date(closing + "T12:00:00");
    if (isNaN(d)) return null;
    const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    const start = new Date(y, 6, 1, 12), end = new Date(y + 1, 6, 1, 12);
    const fyDays = Math.round((end - start) / 864e5);
    const sellerDays = Math.round((d - start) / 864e5);
    const sellerShare = (annual * sellerDays) / fyDays;
    const paid = status === "paid" ? annual : status === "half" ? annual / 2 : 0;
    return { credit: r2(paid - sellerShare), sellerDays, fyDays, fy: y };
  }

  // s = inputs, price = scenario price
  function buildSheet(rates, s, price) {
    const c = countyRates(rates, s.county, s.closing);
    const tx = calcTaxes(rates, c, price, s);
    const title = [
      ["Settlement / closing fee", s.feeSettle], ["Wire fee", s.feeWire], ["Courier fee", s.feeCourier],
      ["Payoff processing fee", s.feePayoff], ["Document preparation", s.feeDoc], ["Release tracking fee", s.feeRelease],
    ];
    const third = [["Recordation tax", tx.rec], ["State transfer tax", tx.state], ["County transfer tax", tx.local]];
    const selling = [
      ["Commission – listing", r2((price * s.listPct) / 100)],
      ["Commission – buyer agent", r2((price * s.buyPct) / 100)],
    ];
    if (s.flatComm) selling.push(["Flat commission", s.flatComm]);
    selling.push(["Admin fee", s.adminFee]);
    const conc = s.concPct ? r2((price * s.conc) / 100) : s.conc;
    const add = [
      ["First loan payoff", s.loan1],
      ["Second loan payoff", s.loan2], ["HELOC payoff", s.heloc], ["Other liens / judgments", s.liens],
      ["Seller concessions" + (s.concPct && s.conc ? ` (${s.conc}%)` : ""), conc],
      ["HOA / condo fees", s.hoaDues], ["Resale package / transfer fee", s.hoaPkg], ["Special assessments", s.assess],
      ["Water / sewer escrow", s.water], ["Termite inspection / treatment", s.termite], ["Home warranty", s.warranty],
      ["Repair credit to buyer", s.repairs],
      [s.o1Label || "Other fee / credit", s.o1Amt], [s.o2Label || "Other fee / credit", s.o2Amt],
    ];
    const sum = (a) => r2(a.reduce((t, [, v]) => t + (+v || 0), 0));
    const tTitle = sum(title), tThird = sum(third), tSell = sum(selling);
    const closingCosts = r2(tTitle + tThird + tSell);
    const proceeds = r2(price - closingCosts);
    const tAdd = sum(add);
    const pr = prorateTax(s.annualTax, s.taxStatus, s.closing);
    const credits = pr ? [["Property tax proration", pr.credit]] : [];
    const tCred = sum(credits);
    const net = r2(proceeds - tAdd + tCred);
    return { price, county: c, tx, title, third, selling, add, credits, tTitle, tThird, tSell, closingCosts, proceeds, tAdd, tCred, net, pr };
  }

  const api = { r2, up500, pickRates, countyRates, calcTaxes, prorateTax, buildSheet };
  root.NetCalc = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
