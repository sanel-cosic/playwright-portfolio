# Official Playwright image: Node + all three browsers + system deps.
# Keep the tag in sync with the @playwright/test version in package.json.
FROM mcr.microsoft.com/playwright:v1.62.0-noble

WORKDIR /app

# Install dependencies first so Docker caches this layer between code changes
COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .

ENV CI=true
CMD ["npx", "playwright", "test"]
