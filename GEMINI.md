# GEMINI.md for Magentic Project

## Project Overview

This project, "Magentic," is a Python library designed to provide a high-level, flexible, and robust interface for interacting with Google's Gemini series of large language models. It simplifies making both simple and complex API calls by offering features like asynchronous operations, streaming, parallel execution, and built-in retry logic.

The library supports multiple backends (Google AI Gemini API and Vertex AI) and provides utilities for seamless integration of tool-use and function-calling via schema conversion. It appears to have a potential UI component, "Magentic-UI".

**Technology Stack**: Python, Google AI Gemini API, Google Cloud Vertex AI

## Development Commands

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# It is recommended to use a virtual environment
python -m venv .venv
source .venv/bin/activate
```

### Running Tests
```bash
# Run unit tests
pytest
```

## Architecture Overview

### Inferred Project Structure

```
/
├── magentic/
│   ├── __init__.py
│   ├── gemini.py           # Contains the core Gemini class integration
│   ├── legacy_gemini.py    # Contains the older GeminiModel class
│   └── utils/
│       └── schema.py       # Contains schema conversion utilities
├── tests/
│   ├── test_gemini.py
│   └── test_schema.py
├── examples/
│   ├── simple_call.py
│   └── parallel_calls.py
├── README.md
└── requirements.txt
```

### Key Components

1.  **`Gemini` Class (The Primary Interface)**
    -   Inherits from a `BaseLlm`, suggesting it's part of a larger framework that can support different LLMs.
    -   Provides asynchronous methods (`generate_content_async`, `connect`) for non-blocking I/O.
    -   Supports both unary and streaming responses.
    -   Features a `connect` method for establishing a persistent, bi-directional "live" connection for interactive chat sessions.
    -   Intelligently selects the API backend (`Vertex AI` vs. `Gemini API`) and adjusts request parameters accordingly.
    -   Includes built-in tracking headers for identifying usage from the library.

2.  **`GeminiModel` Class (Legacy/Alternative Interface)**
    -   A simpler, concrete implementation for calling the Gemini API.
    -   Includes a decorator-based, blocking `retry` mechanism for handling transient errors.
    -   Provides a `call_parallel` method that uses a `ThreadPoolExecutor` to execute multiple LLM prompts concurrently, with timeout and retry logic.
    -   Supports request distribution across multiple GCP regions for improved availability.

3.  **Schema Conversion Utilities (`gemini_to_json_schema`, `_to_gemini_schema`)**
    -   A set of crucial helper functions for function calling (tool use).
    -   `gemini_to_json_schema`: Converts a native Gemini `Schema` object into a standard JSON Schema dictionary. This allows developers to work with a familiar format.
    -   `_to_gemini_schema`: Converts a JSON Schema or OpenAPI schema dictionary back into the Gemini `Schema` object required by the API for defining tools.

4.  **Factory Function (`gemini_llm`)**
    -   A simple convenience function that returns a pre-configured instance of the `Gemini` class (e.g., `gemini-1.5-flash`), simplifying initialization for common use cases.

## Business Logic & Core Functionality

### Dual Backend Support

The library abstracts away the differences between two primary Google LLM backends:

-   **Vertex AI (`GoogleLLMVariant.VERTEX_AI`)**: The enterprise-grade platform. The library uses this backend when the client is configured for Vertex, allowing for features like request labeling. The `v1beta1` API version is used.
-   **Gemini API (`GoogleLLMVariant.GEMINI_API`)**: The more direct, API-key-based service (e.g., from Google AI Studio). The library automatically strips unsupported features like `labels` and `display_name` from requests when using this backend. The `v1alpha` API version is used to support API key authentication.

The selection is handled automatically by the `_api_backend` property based on the API client's configuration.

### Asynchronous and Streaming Operations

The `generate_content_async` method in the `Gemini` class is the core of its I/O model.
-   When `stream=False`, it makes a single asynchronous call and yields one `LlmResponse`.
-   When `stream=True`, it initiates a streaming connection and yields a series of `LlmResponse` chunks as they are received from the model, enabling real-time, token-by-token output. It correctly handles partial messages and aggregates them into a final complete message.

### Parallel Processing

The `GeminiModel.call_parallel` method provides a powerful way to batch-process multiple prompts. It creates a thread pool where each prompt is processed in its own thread. This method includes error handling, a timeout for each thread, and a retry mechanism for failed or timed-out prompts, making it resilient for large-scale data processing tasks.

## API and Function Definitions

-   **`Gemini.generate_content_async(llm_request, stream)`**: The main method for sending prompts. It handles both streaming and non-streaming responses.
-   **`Gemini.connect(llm_request)`**: Establishes a live, interactive connection to the model.
-   **`GeminiModel.call(prompt, parser_func)`**: A synchronous method to send a single prompt with retry logic.
-   **`GeminiModel.call_parallel(prompts, ...)`**: A synchronous method that executes multiple prompts in parallel.
-   **`gemini_llm()`**: A factory function that returns a default `Gemini` model instance.
-   **`gemini_to_json_schema(schema)` / `_to_gemini_schema(dict)`**: Utility functions for converting tool schemas between Gemini and JSON formats.

## Development Guidelines

### Code Style

-   Follow PEP 8 for Python code.
-   Use type hints for all function signatures and variables.
-   Keep functions focused on a single responsibility.

### Example Usage Patterns

#### Simple Unary Call (Async)
```python
import asyncio
from magentic.gemini import Gemini, LlmRequest

async def main():
    gemini_client = Gemini(model="gemini-1.5-flash")
    request = LlmRequest.from_text("Explain the importance of bees.")
    async for response in gemini_client.generate_content_async(request):
        print(response.text)

asyncio.run(main())
```

#### Streaming Call (Async)
```python
import asyncio
from magentic.gemini import Gemini, LlmRequest

async def main():
    gemini_client = Gemini(model="gemini-1.5-flash")
    request = LlmRequest.from_text("Write a short story about a robot who discovers music.")
    async for response_chunk in gemini_client.generate_content_async(request, stream=True):
        if response_chunk.text:
            print(response_chunk.text, end="")

asyncio.run(main())
```

#### Parallel Calls (Sync)
```python
from magentic.legacy_gemini import GeminiModel

def process_reviews():
    model = GeminiModel(model_name="gemini-2.0-flash-001")
    prompts = [
        "Summarize: 'This product is amazing, I love it!'",
        "Summarize: 'It broke after one day, terrible quality.'",
        "Summarize: 'It's okay, not great but not bad either.'"
    ]
    results = model.call_parallel(prompts)
    for summary in results:
        print(summary)

process_reviews()
```
