<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 小賀log (Catlog)

This project contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LrqIIEYf7t-lk6OjUMIeI-lUmM7BtwMb

## Run Locally

**Prerequisites:**  Node.js (v20 recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   - Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## Build & Deployment

### Build Locally
To build the application for production:
```bash
npm run build
```
The output will be in the `dist` directory.

### GitHub Actions Deployment
This project is configured with GitHub Actions to automatically deploy to **GitHub Pages**.

1. Push changes to the `main` branch.
2. The workflow in `.github/workflows/deploy.yml` will automatically build and deploy the app.
3. Ensure you have enabled GitHub Pages in your repository settings (Settings -> Pages -> Source: `gh-pages` branch).

## Project Structure
- `src/`: Source code
- `public/`: Static assets
- `.github/workflows/`: CI/CD configurations
