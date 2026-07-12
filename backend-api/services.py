#from langchain.chat_models import init_chat_model
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

def load_model(model_name: str="gemini-3.5-flash"):
    model = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        api_key=os.getenv("GOOGLE_API_KEY")
    )
    return model

def _extract_text(content) -> str:
    """Normalize LangChain message content to a plain string,
    regardless of whether the provider returned a string or a list of content blocks."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(block.get("text", ""))
        return "".join(parts)
    return str(content)


def generate_chat_response(payload: dict) -> str:
    try:
        model = load_model(payload.get("modelName"))
        page = payload.get("pageData")
        chatInput = payload.get("chatInput")

        prompt = f"""
        You are given a webpage content and user question. Analyze the content and answer the question
        
        Here is the page content:
        
        <page>
            {page}
        </page>

        Here is the question:
        
        <question>
            {chatInput}
        </question>

        Now answer the question based on the page content
        """
        response = model.invoke(prompt)
        return _extract_text(response.content)
    except Exception as e:
        raise Exception(f"Error generating chat response: {str(e)}")

def parse_json(response):
    try:
        # Extract content if response is a message object
        if hasattr(response, "content"):
            text = _extract_text(response.content)
        else:
            text = str(response)
        
        text = text.strip()
        
        # Extract content between markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                if lines[-1].startswith("```"):
                    text = "\n".join(lines[1:-1]).strip()
                else:
                    text = "\n".join(lines[1:]).strip()
        
        # Validate that it is valid JSON
        json.loads(text)
        return text
    except Exception as e:
        raise Exception(f"Error parsing json response: {str(e)}")

def find_all_occurrences(text: str, sentence: str) -> list[dict]:
    offsets = []
    current = 0
    while True:
        index = text.find(sentence, current)
        if index == -1:
            break
        offsets.append({"start": index, "end": index + len(sentence)})
        current = index + len(sentence)
    return offsets

def generate_highlight_response(payload: dict) -> dict:
    try:
        model = load_model(payload.get("modelName"))
        page = payload.get("pageData")
        page_text = page.get("text") if isinstance(page, dict) else page

        if not page_text or not page_text.strip():
            return {"highlights": []}

        prompt = f"""
        Identify the most important sentences on this page.

        Return ONLY valid JSON, no preamble, no markdown, in this exact format:
        {{
            "sentences": ["...", "...", "..."]
        }}

        Return the exact sentences copied verbatim from the page.
        Do not summarize. Do not rewrite.

        <page>
            {page_text}
        </page>
        """
        response = model.invoke(prompt)
        parsed = parse_json(response)
        sentences = json.loads(parsed).get("sentences", [])

        offsets = []
        for sentence in sentences:
            offsets.extend(find_all_occurrences(page_text, sentence))

        return {"highlights": offsets}
    except Exception as e:
        raise Exception(f"Error generating highlight response: {str(e)}")

def generate_question_highlight(payload: dict) -> dict:
    try:
        model = load_model(payload.get("modelName"))
        query = payload.get("query")
        page = payload.get("pageData")
        page_text = page.get("text") if isinstance(page, dict) else page

        if not page_text or not page_text.strip():
            return {"highlights": []}

        prompt = f"""
        Identify the sentences on this page that answers the question.

        Return ONLY valid JSON, no preamble, no markdown, in this exact format:
        {{
            "sentences": ["...", "...", "..."]
        }}

        Return the exact sentences copied verbatim from the page.
        Do not summarize. Do not rewrite.

        <page>
            {page_text}
        </page>

        Here is the question:
        
        <question>
            {query}
        </question>
        """
        response = model.invoke(prompt)
        parsed = parse_json(response)
        sentences = json.loads(parsed).get("sentences", [])

        offsets = []
        for sentence in sentences:
            offsets.extend(find_all_occurrences(page_text, sentence))

        return {"highlights": offsets}
    except Exception as e:
        raise Exception(f"Error generating highlight response: {str(e)}")