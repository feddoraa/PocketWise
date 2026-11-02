# PocketWise — Student Finance Tracker

A beginner-friendly finance tracking website built with **HTML, CSS, and vanilla JavaScript**. No framework, payment, server, or account required.

## Features
- Record income and expenses in **Jordanian dinars (JOD)**.
- Track monthly income, expenses, and **monthly net (income minus expenses)**.
- Browse transactions by month, filter by type, and search.
- See a breakdown of spending by category.
- Set a monthly spending budget and see how much you have left.
- Delete entries and export the selected month as CSV.
- Click **Try sample data** to explore the interface with fake transactions.
- Entries are saved in this browser using **localStorage**.

## How to run
1. Unzip the `student-finance-tracker.zip` file.
2. Open the extracted folder in **Visual Studio Code**.
3. Install the **Live Server** VS Code extension (optional but recommended).
4. Right-click `index.html` → **Open with Live Server**. You can also open the HTML file in a browser directly.
5. Try adding an expense, set a monthly budget, then refresh to see browser storage in action.

## File guide
- `index.html` — page structure and form elements.
- `styles.css` — color, layout, typography, and responsive design.
- `script.js` — interaction, calculation, browser storage, and CSV export.

## Important limitations
- This is a **learning/portfolio project**, not a bank-integrated finance service.
- Information is stored **only in the current browser**. Clearing site data or switching devices may lose your entries. Export CSV if you want a backup.
- GitHub Pages can host this static website. Publishing the code does **not** publish entries you've typed into your own browser.
- No login, cloud backup, or real database in v1.
- This is not personal financial advice.

## Beginner learning challenge
Change the headline in `index.html`, then change `--teal` in `styles.css`. In `script.js`, find `render()` and look at how it computes income, expenses, and net from transaction objects.

## Next development ideas
- Editing transactions.
- Improved analytics and data visualizations.
- Optional bilingual Arabic/English interface.
- A backend + SQL database + authentication (only when you are ready to learn those concepts).

Built as a practical first real-world project by a BIT student.
