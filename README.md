# Maryland Seller Net Sheet

An installable web app that estimates a Maryland seller's net proceeds: county recordation and transfer taxes, commissions, the admin fee, concessions, payoffs, property tax proration, and more. It creates a branded PDF to email to clients.

## Privacy

- Everything runs on the device. Nothing typed into the app is sent anywhere.
- Client details (names, addresses, prices, payoffs) are never saved. They disappear when the page closes or a new sheet starts.
- Only the agent's branding (name, contact info, photo, logo) and default fees are saved, in that browser on that device.
- The app loads nothing from other websites. A content security policy in `index.html` blocks outside connections.
- The PDF is built on the device by `js/minipdf.js`.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page |
| `css/app.css` | Styles |
| `js/calc.js` | All the math (no page code, tested) |
| `js/minipdf.js` | Small built-in PDF writer |
| `js/app.js` | Screen logic, branding, PDF layout |
| `data/rates.json` | County tax rates with effective dates |
| `sw.js` | Offline support |
| `tests/calc.test.js` | Tests: `node tests/calc.test.js` |

## Updating tax rates

Rates live in `data/rates.json`. Each county has a list of rate sets, and each set has an `effective` date. The app uses the newest set that's in effect on the closing date.

To change a rate, **add a new set** with its effective date (usually July 1). Don't edit the old one, so sheets for earlier closings stay correct. Then update `reviewed` at the top of the file and run the tests.

- `rec`: recordation tax per $500 of price (price rounds up to the next $500)
- `lt`: county transfer tax rate (0.005 = 0.5%)
- `ooEx` / `allEx` / `fthbEx`: dollars exempt from county transfer tax (owner-occupant / everyone / first-time buyer)
- `fthbRate`, `fthbSeller`: reduced first-time buyer county rate, and whether the seller must pay it

Sources are listed in the file. Always confirm with the title company before closing.

## Publishing

The app is served by GitHub Pages from the `main` branch root. A change pushed to `main` goes live within a minute or two, and installed copies pick it up the next time they open with an internet connection.
