import json
from config import URLS_JSON_PATH


def load_urls():
    with open(URLS_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)