import os
import requests
import json
from datetime import datetime
from flask import jsonify

def handler(request):
    # 允许跨域（可选）
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
    }

    # 获取 SerpAPI 密钥
    SERPAPI_KEY = os.getenv('SERPAPI_KEY')
    if not SERPAPI_KEY:
        return jsonify({"error": "SERPAPI_KEY 环境变量未配置"}), 500, headers

    # 读取关键词配置
    try:
        with open('keywords.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        keywords = config.get('keywords', [])
        countries = config.get('countries', [])
    except Exception as e:
        return jsonify({"error": f"读取 keywords.json 失败: {str(e)}"}), 500, headers

    # 限制单次请求数量（避免超时）
    MAX_KEYWORDS = 10
    MAX_COUNTRIES = 3
    keywords = keywords[:MAX_KEYWORDS]
    countries = countries[:MAX_COUNTRIES]

    # 调用 SerpAPI 获取趋势数据
    trends_data = {}
    error_count = 0
    for keyword in keywords:
        for country in countries:
            try:
                params = {
                    "engine": "google_trends",
                    "q": keyword,
                    "geo": country,
                    "api_key": SERPAPI_KEY,
                    "hl": "en",
                    "date": "now 7-d"  # 最近7天数据
                }
                response = requests.get("https://serpapi.com/search", params=params, timeout=10)
                response.raise_for_status()  # 抛出 HTTP 错误
                trends_data[f"{keyword}_{country}"] = response.json()
            except Exception as e:
                error_count += 1
                trends_data[f"{keyword}_{country}"] = {"error": str(e)}

    # 构造返回数据
    result = {
        "meta": {
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_keywords": len(keywords) * len(countries),
            "errors": error_count
        },
        "keywords": trends_data
    }

    return jsonify(result), 200, headers