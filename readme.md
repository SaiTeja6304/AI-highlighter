# Browser Extension
Extension that can highlight text on a webpage based on the user's question. Also can ask questions about the webpage and get answers from the LLM.

## Backend API
API that can generate highlights or answer questions from the webpage based on the user's question.

## How to run the backend API
1. Navigate to the backend-api directory: `cd backend-api`
2. Activate the virtual environment: `source .venv/Scripts/activate`
3. Run the server: `uvicorn app:app --reload`

## Pushing Extension
- When changes made to js or json files, run: npm run build
- When loading the extension on browser, load the dist/
- Make sure to reload the extension and test webpage

### Initial NPM steps
- In the folder, run npm init -y
- Then run npm install to install libraries, so mozilla readability
    - npm install @mozilla/readability
    - npm install --save-dev esbuild
    - npm install --save-dev shx
- Then run: npm run build to build the extension, it generates dist/ folder
