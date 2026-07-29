# Stargazer Project Memory & Rules

## Project Scope
A personal, distraction-free stargazing dashboard and astronomy portal built with HTML/JS (Vanilla CSS) on the frontend and FastAPI on the backend, deployed on Google Cloud Run.

## Critical Learnings & Setup
- **Gemini API Key**: The project uses Google Gemini (`gemini-2.5-flash`) via the OpenAI-compatible endpoint. The API key is `AIzaSyBFk-cgp077syyorSgZ75WL8A0v2rQ_W64`. This is configured on the Google Cloud Run service `stargazer-api` in `us-central1` and in the local gitignored `.env` file.
- **Rule-Based Fallbacks**: If the AI key is ever disabled, the backend falls back to rule-based analysis. The rule-based engine generates dynamic `seeing_explanation`, `fallback_message`, and `event_of_the_night` so the dashboard's "Observer's Briefing" card always displays rich, customized forecasts.
- **Observing Window Scheduler**: The "Plan My Night" scheduler starts dynamically from the current hour if stargazing occurs after 8:00 PM (20). All subsequent slots chain sequentially from the end of the previous slot.
- **CI/CD Security Scan**: Always keep scratch/temporary python scripts out of the `api/` directory (e.g. do not commit `expand_*.py` files) to prevent **Bandit Security Scan** failures. Suppress expected SQL injection warnings for public SIMBAD TAP queries in `main.py` using `# nosec B608`.
