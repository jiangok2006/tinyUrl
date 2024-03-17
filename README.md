This project uses Remix.run. It shows 4 forms on one page:
1. the table of (tiny url, long url, long url's click count).
2. tiny url creation: create a random or custom tiny url given a long url and a custom url (optional).
3. tiny url deletion.
4. tiny url query: given a tiny url, print long url and click count.

models/Store.ts has the data model and necessary information (e.g. tiny url query result, duplicate custom tiny url error message) needed by UI.

To run: `npm run dev`.