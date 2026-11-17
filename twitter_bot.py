#!/usr/bin/env python3
"""
Automated Twitter / X Auto-Poster Bot powered by FreeLLMAPI
Converted from index.js to pure Python with 0 npm/Node dependencies.
Connects to local FreeLLMAPI (http://127.0.0.1:31415) with 836M+ free monthly tokens.
"""

import os
import sys
import json
import time
import uuid
import hmac
import hashlib
import base64
import argparse
import urllib.parse
from typing import Optional, Dict, Any, Tuple

# Optional requests import; falls back to urllib
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    import urllib.request
    HAS_REQUESTS = False

# Import freellm client if available in sys.path or parent dirs
for p in [r"C:\Users\acer", os.path.dirname(os.path.abspath(__file__))]:
    if p not in sys.path:
        sys.path.append(p)

try:
    import freellm
except ImportError:
    freellm = None

FREELLM_API_KEY = os.environ.get("FREELLM_API_KEY", "freellmapi-ae58ad08732a078514fe10d377f69115e83afcc08697f84d")
FREELLM_BASE_URL = os.environ.get("FREELLM_BASE_URL", "http://127.0.0.1:31415/v1")

# Fast, reliable models on local FreeLLMAPI
FAST_MODELS = [
    "qwen3.8-27b",
    "glm-4.7-flash",
    "gemini-3.7-flash",
    "deepseek-r1-distill-qwen-32b",
    "llama-3.3-70b"
]

DEFAULT_PROMPT = (
    "generate a recent indian polity today news, advices and question ask on those news; "
    "under 280 characters and should be plain text, you can use emojis and trending hastags"
)


# ==============================================================================
# SECRETS / CREDENTIALS MANAGEMENT
# ==============================================================================

def load_credentials() -> Dict[str, str]:
    """
    Loads Twitter credentials from:
    1. Environment variables
    2. secrets.json in current directory
    3. SECRETS.js if secrets.json does not exist
    """
    creds = {
        "APP_KEY": os.environ.get("TWITTER_APP_KEY", ""),
        "APP_SECRET": os.environ.get("TWITTER_APP_SECRET", ""),
        "ACCESS_TOKEN": os.environ.get("TWITTER_ACCESS_TOKEN", ""),
        "ACCESS_SECRET": os.environ.get("TWITTER_ACCESS_SECRET", "")
    }

    dir_path = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(dir_path, "secrets.json")
    js_path = os.path.join(dir_path, "SECRETS.js")

    # If already set via env
    if all(creds.values()):
        return creds

    # Load from secrets.json
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for k in creds:
                    if not creds[k] and k in data:
                        creds[k] = data[k]
        except Exception as e:
            print(f"[!] Warning reading secrets.json: {e}")

    # Fallback to parsing SECRETS.js
    if not all(creds.values()) and os.path.exists(js_path):
        try:
            with open(js_path, "r", encoding="utf-8") as f:
                content = f.read()
                import re
                for k in ["APP_KEY", "APP_SECRET", "ACCESS_TOKEN", "ACCESS_SECRET"]:
                    match = re.search(rf'const\s+{k}\s*=\s*["\']([^"\']+)["\']', content)
                    if match and not creds[k]:
                        creds[k] = match.group(1)
        except Exception as e:
            print(f"[!] Warning parsing SECRETS.js: {e}")

    return creds


def save_credentials_json(creds: Dict[str, str]):
    """Saves credentials into secrets.json for convenient editing."""
    dir_path = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(dir_path, "secrets.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(creds, f, indent=2)
    print(f"[+] Credentials saved to {json_path}")


# ==============================================================================
# OAUTH 1.0A AUTHENTICATION & TWITTER API v2
# ==============================================================================

def generate_oauth1_header(
    method: str,
    url: str,
    consumer_key: str,
    consumer_secret: str,
    access_token: str,
    access_token_secret: str
) -> str:
    """
    Generates standard RFC 5849 OAuth 1.0a Authorization header.
    JSON POST requests do not include body parameters in the signature base string.
    """
    params = {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": access_token,
        "oauth_version": "1.0"
    }

    # Sort parameters
    sorted_params = sorted(params.items())
    param_pairs = [
        f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(str(v), safe='')}"
        for k, v in sorted_params
    ]
    param_string = "&".join(param_pairs)

    encoded_url = urllib.parse.quote(url, safe="")
    encoded_params = urllib.parse.quote(param_string, safe="")
    base_string = f"{method.upper()}&{encoded_url}&{encoded_params}"

    signing_key = f"{urllib.parse.quote(consumer_secret, safe='')}&{urllib.parse.quote(access_token_secret, safe='')}"

    hashed = hmac.new(signing_key.encode("utf-8"), base_string.encode("utf-8"), hashlib.sha1)
    signature = base64.b64encode(hashed.digest()).decode("utf-8")
    params["oauth_signature"] = signature

    header_parts = [
        f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(str(v), safe="")}"'
        for k, v in sorted(params.items())
    ]
    return "OAuth " + ", ".join(header_parts)


def send_tweet_to_twitter(tweet_text: str, creds: Dict[str, str]) -> Tuple[bool, Dict[str, Any]]:
    """
    Posts a tweet to Twitter API v2: POST https://api.twitter.com/2/tweets
    Returns (success, response_dict).
    """
    url = "https://api.twitter.com/2/tweets"
    auth_header = generate_oauth1_header(
        method="POST",
        url=url,
        consumer_key=creds["APP_KEY"],
        consumer_secret=creds["APP_SECRET"],
        access_token=creds["ACCESS_TOKEN"],
        access_token_secret=creds["ACCESS_SECRET"]
    )

    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json",
        "User-Agent": "TwitterAutoPosterBot/2.0"
    }
    payload = json.dumps({"text": tweet_text}).encode("utf-8")

    if HAS_REQUESTS:
        try:
            resp = requests.post(url, headers=headers, data=payload, timeout=20)
            status_code = resp.status_code
            try:
                res_data = resp.json()
            except Exception:
                res_data = {"raw_text": resp.text}

            if status_code in [200, 201]:
                return True, res_data
            else:
                return False, {"status_code": status_code, "error": res_data}
        except Exception as e:
            return False, {"error": str(e)}
    else:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return True, data
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_body)
            except Exception:
                err_json = {"raw": err_body}
            return False, {"status_code": e.code, "error": err_json}
        except Exception as e:
            return False, {"error": str(e)}


# ==============================================================================
# FREELLMAPI TWEET GENERATION
# ==============================================================================

def generate_tweet_content(topic: str = DEFAULT_PROMPT, preferred_model: Optional[str] = None) -> str:
    """
    Generates a tweet using FreeLLMAPI with automatic model fallback.
    Ensures length <= 280 characters and clean formatting.
    """
    system_instruction = (
        "You are an expert social media manager and Twitter/X content creator. "
        "Generate a high-engagement, factual, concise tweet under 280 characters. "
        "Rules:\n"
        "1. Output ONLY the plain tweet text. Do NOT include markdown code blocks, quotes, or preamble.\n"
        "2. Include 2-3 trending hashtags and relevant emojis.\n"
        "3. Keep the total length strictly under 275 characters so it easily fits within Twitter's 280-char limit."
    )

    models_to_try = [preferred_model] if preferred_model else []
    models_to_try.extend([m for m in FAST_MODELS if m not in models_to_try])

    headers = {
        "Authorization": f"Bearer {FREELLM_API_KEY}",
        "Content-Type": "application/json"
    }

    last_error = None
    for model_name in models_to_try:
        print(f"[*] Trying model: {model_name}...")
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": topic}
            ],
            "max_tokens": 120,
            "temperature": 0.7
        }

        try:
            if HAS_REQUESTS:
                resp = requests.post(f"{FREELLM_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=15)
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"].strip()
                    cleaned = clean_tweet_text(text)
                    print(f"[✓] Generated via {model_name} ({len(cleaned)} chars)")
                    return cleaned
                else:
                    last_error = f"HTTP {resp.status_code}: {resp.text[:100]}"
            else:
                req = urllib.request.Request(
                    f"{FREELLM_BASE_URL}/chat/completions",
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    text = data["choices"][0]["message"]["content"].strip()
                    cleaned = clean_tweet_text(text)
                    print(f"[✓] Generated via {model_name} ({len(cleaned)} chars)")
                    return cleaned
        except Exception as e:
            last_error = str(e)
            print(f"    [-] Model {model_name} failed: {e}. Trying fallback...")

    raise RuntimeError(f"All FreeLLMAPI models failed. Last error: {last_error}")


def clean_tweet_text(text: str) -> str:
    """Cleans up LLM output to ensure it fits nicely in a Twitter post."""
    # Strip wrapping quotes if LLM added them
    text = text.strip()
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        text = text[1:-1].strip()

    # Remove any markdown code block fences
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join([line for line in lines if not line.startswith("```")]).strip()

    # Truncate if exceeds 280 characters
    if len(text) > 280:
        words = text[:275].rsplit(" ", 1)
        text = words[0] if len(words) > 1 else text[:275]

    return text


# ==============================================================================
# MAIN BOT WORKFLOW
# ==============================================================================

def run_bot(dry_run: bool = False, topic: Optional[str] = None, model: Optional[str] = None):
    """Executes a single cycle of the Twitter Auto-Poster."""
    print("=" * 65)
    print("        AI TWITTER / X AUTO-POSTER BOT (FreeLLMAPI Edition)")
    print("=" * 65)

    creds = load_credentials()

    # Check credentials if live posting
    if not dry_run:
        missing = [k for k, v in creds.items() if not v or "your_" in v.lower()]
        if missing:
            print(f"[!] ERROR: Missing Twitter credentials: {', '.join(missing)}")
            print("[!] Please edit secrets.json or SECRETS.js with your Twitter Developer API keys.")
            print("[!] Or run with --dry-run to test tweet generation without posting.")
            return

    # Step 1: Generate Tweet using AI
    prompt = topic or DEFAULT_PROMPT
    print(f"[*] Prompt: {prompt[:60]}...")
    print("[*] Generating tweet via FreeLLMAPI...")
    tweet_text = generate_tweet_content(topic=prompt, preferred_model=model)

    print("\n" + "-" * 50)
    print("GENERATED TWEET:")
    print(tweet_text)
    print(f"Length: {len(tweet_text)} / 280 characters")
    print("-" * 50 + "\n")

    # Step 2: Post to Twitter
    if dry_run:
        print("[*] [DRY RUN MODE] Tweet was NOT sent to Twitter.")
        print("[*] To post live, run without --dry-run.")
        return

    print("[*] Sending tweet to Twitter / X API v2...")
    success, res = send_tweet_to_twitter(tweet_text, creds)

    if success:
        tweet_id = res.get("data", {}).get("id", "Unknown")
        print("\n" + "=" * 50)
        print(" [SUCCESS] TWEET POSTED SUCCESSFULLY!")
        print(f" Tweet ID: {tweet_id}")
        if tweet_id != "Unknown":
            print(f" URL: https://x.com/i/status/{tweet_id}")
        print("=" * 50 + "\n")
    else:
        print("\n" + "!" * 50)
        print(" [FAILED] Error sending tweet:")
        print(json.dumps(res, indent=2))
        print("!" * 50)
        print("\nTroubleshooting Tips:")
        print(" 1. Ensure Twitter App has 'Read and Write' permissions in the Developer Portal.")
        print(" 2. If you changed permissions to Read/Write, you must REGENERATE the Access Token and Secret.")
        print(" 3. Verify App Key, App Secret, Access Token, and Access Secret in secrets.json.\n")


def main():
    parser = argparse.ArgumentParser(description="Twitter Auto-Poster Bot powered by FreeLLMAPI")
    parser.add_argument("--dry-run", "-d", action="store_true", help="Generate tweet without posting to Twitter")
    parser.add_argument("--topic", "-t", type=str, default=None, help="Custom prompt / topic for the tweet")
    parser.add_argument("--model", "-m", type=str, default=None, help="Preferred FreeLLMAPI model (e.g. qwen3.8-27b)")
    parser.add_argument("--interval", "-i", type=int, default=0, help="Recurring interval in minutes (0 = single run)")
    parser.add_argument("--init-secrets", action="store_true", help="Create secrets.json from SECRETS.js")

    args = parser.parse_args()

    if args.init_secrets:
        creds = load_credentials()
        save_credentials_json(creds)
        return

    if args.interval > 0:
        print(f"[*] Starting recurring auto-poster every {args.interval} minutes. Press Ctrl+C to stop.")
        while True:
            try:
                run_bot(dry_run=args.dry_run, topic=args.topic, model=args.model)
                print(f"[*] Sleeping for {args.interval} minutes...")
                time.sleep(args.interval * 60)
            except KeyboardInterrupt:
                print("\n[*] Stopped by user.")
                break
            except Exception as e:
                print(f"[!] Error in cycle: {e}")
                time.sleep(60)
    else:
        run_bot(dry_run=args.dry_run, topic=args.topic, model=args.model)


if __name__ == "__main__":
    main()
