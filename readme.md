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


### Notes

#### Architecture & Technical Details
This project consists of two main components:
1. **Chrome Extension (Frontend)**:
   - **Popup (`index.html` & `index.js`)**: Provides the UI for entering user queries, choosing models, and displaying status/chat results.
   - **Content Script (`content.js`)**: Runs in the context of the webpage. It uses `@mozilla/readability` to extract clean article text and handles DOM manipulation to highlight key sentences.
   - **Background Script (`background.js`)**: A service worker that acts as a bridge, forwarding API requests from the content script to the local backend and returning responses asynchronously.
   - **Bundling**: Uses `esbuild` to package dependencies like `@mozilla/readability` and compile assets into a loadable `dist/` directory.

2. **FastAPI Server (Backend)**:
   - **Server (`backend-api/app.py` & `api_routes.py`)**: Runs on `http://localhost:8000` to serve API requests from the extension.
   - **Services (`backend-api/services.py`)**: Integrates with Google's Gemini models (such as `gemini-3.5-flash`) using `langchain_google_genai`. It parses the webpage text and extracts relevant sentences for highlighting, or answers user queries in a chat style based on the page context.
