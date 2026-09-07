# -*- coding: utf-8 -*-
"""
Weekly CreditDB Auto-Updater (AniList GraphQL & Bangumi API)
Executes weekly via GitHub Actions (or manually) to:
1. Decompress public/data/creditdb.db.gz into SQLite memory
2. Fetch recent/airing anime and latest scores from AniList API (or Bangumi API fallback)
3. Enrich new titles with staff and cast credits via Bangumi API
4. Update SQLite database (works, summary)
5. Re-compress to public/data/creditdb.db.gz and update public/data/version.json
"""

import os
import sys
import gzip
import json
import time
import hashlib
import sqlite3
import datetime
import urllib.parse
import urllib.request
from pathlib import Path

# Ensure UTF-8 output across Windows and CI environments
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


ANILIST_ENDPOINT = "https://graphql.anilist.co"
BANGUMI_ENDPOINT = "https://api.bgm.tv"
USER_AGENT = "CreditDB-Web-Updater/1.0 (https://github.com/nanbeimerco/CreditDB-Web)"

RELATION_MAP = {
    "导演": "director",
    "总导演": "director",
    "系列构成": "series_comp",
    "脚本": "series_comp",
    "人物设定": "char_design",
    "角色设计": "char_design",
    "总作画监督": "sakkan",
    "作画监督": "sakkan",
    "原画": "genga",
    "演出": "unit_director",
    "分镜": "storyboard",
    "音乐": "music",
    "动画制作": "studio"
}

def execute_anilist_query(query: str, variables: dict = None, retries: int = 2):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(ANILIST_ENDPOINT, data=payload, headers=headers, method="POST")

    for attempt in range(retries):
        try:
            time.sleep(0.7)
            with urllib.request.urlopen(req, timeout=15) as res:
                if res.status == 200:
                    return json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_sec = int(e.headers.get("Retry-After", 5))
                print(f"[AniList] Rate limit reached. Waiting {wait_sec}s...")
                time.sleep(wait_sec)
                continue
            print(f"[AniList] HTTP Error {e.code}: {e.reason}")
            break
        except Exception as e:
            print(f"[AniList] Request failed: {e}")
            break
    return None

def fetch_recent_anilist_anime(target_years=[2025, 2026], per_year_limit=40):
    print(f"[AniList] Fetching popular recent anime for years: {target_years}...")
    query = """
    query ($year: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, seasonYear: $year, sort: [POPULARITY_DESC, SCORE_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          seasonYear
          format
          episodes
          averageScore
          meanScore
          popularity
        }
      }
    }
    """
    results = []
    for yr in target_years:
        res = execute_anilist_query(query, {"year": yr, "perPage": per_year_limit})
        if res and "data" in res and res["data"] and "Page" in res["data"]:
            media_list = res["data"]["Page"].get("media", [])
            for m in media_list:
                results.append({
                    "id": f"anilist_{m['id']}",
                    "title_ja": m.get("title", {}).get("native") or m.get("title", {}).get("romaji", ""),
                    "title_en": m.get("title", {}).get("english") or "",
                    "year": m.get("seasonYear") or yr,
                    "score": float(m.get("averageScore") or m.get("meanScore") or 0.0),
                    "bangumi_id": None
                })
            print(f"  -> Year {yr}: fetched {len(media_list)} anime entries from AniList")
    return results

def fetch_bangumi_calendar_anime():
    print("[Bangumi] Fetching currently airing anime via Calendar API...")
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    req = urllib.request.Request(f"{BANGUMI_ENDPOINT}/calendar", headers=headers)
    results = []
    current_year = datetime.datetime.now().year

    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            if res.status == 200:
                calendar_days = json.loads(res.read().decode("utf-8"))
                for day in calendar_days:
                    for item in day.get("items", []):
                        title_ja = item.get("name") or item.get("name_cn")
                        if not title_ja:
                            continue
                        air_date = item.get("air_date") or ""
                        year = int(air_date[:4]) if len(air_date) >= 4 and air_date[:4].isdigit() else current_year
                        rating = item.get("rating") or {}
                        score_10 = float(rating.get("score") or 0.0)
                        score_100 = round(score_10 * 10.0, 1) if score_10 > 0 else 0.0

                        results.append({
                            "id": f"bgm_{item['id']}",
                            "title_ja": title_ja,
                            "title_en": item.get("name_cn") or "",
                            "year": year,
                            "score": score_100,
                            "bangumi_id": item["id"]
                        })
                print(f"  -> Fetched {len(results)} airing titles from Bangumi Calendar")
    except Exception as e:
        print(f"[Bangumi] Calendar request error: {e}")
    return results

def fetch_bangumi_staff_and_cast(title_jp: str, subject_id: int = None):
    headers = {
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json"
    }
    try:
        if not subject_id:
            search_url = f"{BANGUMI_ENDPOINT}/v0/search/subjects?limit=1"
            payload = json.dumps({"keyword": title_jp, "filter": {"type": [2]}}).encode("utf-8")
            req = urllib.request.Request(search_url, data=payload, headers=headers, method="POST")
            time.sleep(0.3)
            with urllib.request.urlopen(req, timeout=12) as res:
                if res.status != 200:
                    return {}, []
                data = json.loads(res.read().decode("utf-8"))
                items = data.get("data", [])
                if not items:
                    return {}, []
                subject_id = items[0].get("id")

        if not subject_id:
            return {}, []

        # 1. Fetch Staff (Persons)
        persons_url = f"{BANGUMI_ENDPOINT}/v0/subjects/{subject_id}/persons"
        req = urllib.request.Request(persons_url, headers=headers, method="GET")
        time.sleep(0.3)
        staff_by_role = {}
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status == 200:
                persons = json.loads(res.read().decode("utf-8"))
                for p in persons:
                    r_name = p.get("relation", "")
                    p_name = p.get("name", "")
                    role_key = RELATION_MAP.get(r_name)
                    if role_key and p_name:
                        existing = staff_by_role.setdefault(role_key, [])
                        if not any(x["name"] == p_name for x in existing):
                            existing.append({"name": p_name, "rt": "B", "ct": "B"})

        # 2. Fetch Characters & Cast
        chars_url = f"{BANGUMI_ENDPOINT}/v0/subjects/{subject_id}/characters"
        req = urllib.request.Request(chars_url, headers=headers, method="GET")
        time.sleep(0.3)
        cast_list = []
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status == 200:
                characters = json.loads(res.read().decode("utf-8"))
                for c in characters:
                    char_name = c.get("name", "")
                    relation = c.get("relation", "配角")
                    actors = c.get("actors", [])
                    actor_name = ""
                    for act in actors:
                        if act.get("name"):
                            actor_name = act.get("name")
                            break
                    if char_name and actor_name:
                        cast_list.append({
                            "character_name": char_name,
                            "relation": relation,
                            "actor_name": actor_name,
                            "rt": "B",
                            "ct": "B"
                        })

        return staff_by_role, cast_list
    except Exception as e:
        print(f"[Bangumi] Fetch error for '{title_jp}': {e}")
        return {}, []

def main():
    print("===========================================================")
    print("  CreditDB for Web: 週次データ自動更新・同期バッチ")
    print("===========================================================")

    script_dir = Path(__file__).resolve().parent
    web_root = script_dir.parent
    public_data_dir = web_root / "public" / "data"
    gz_db_path = public_data_dir / "creditdb.db.gz"
    version_json_path = public_data_dir / "version.json"

    if not gz_db_path.exists():
        print(f"[ERROR] {gz_db_path} が見つかりません。")
        sys.exit(1)

    print(f"[1/5] 既存データベースを展開中: {gz_db_path.name}...")
    with gzip.open(gz_db_path, "rb") as f_in:
        db_bytes = f_in.read()

    conn = sqlite3.connect(":memory:")
    conn.deserialize(db_bytes)
    cursor = conn.cursor()

    cursor.execute("SELECT total_works, total_staff, total_cv, global_mean FROM summary LIMIT 1")
    prev_summary = cursor.fetchone() or (5452, 22896, 5840, 65.0)
    print(f"  -> 現在登録数: {prev_summary[0]} 作品 / 平均スコア: {prev_summary[3]:.1f}")

    print("\n[2/5] アニメ最新情報を取得中...")
    current_year = datetime.datetime.now().year
    target_years = [current_year - 1, current_year]

    # Try AniList first
    anime_candidates = fetch_recent_anilist_anime(target_years=target_years, per_year_limit=40)

    # If AniList is unavailable or returned no entries, fallback to Bangumi Calendar
    if not anime_candidates:
        print("  -> AniList が一時停止中またはデータが空のため、Bangumi カレンダーAPIに切り替えます。")
        anime_candidates = fetch_bangumi_calendar_anime()

    print(f"  -> 合計 {len(anime_candidates)} 作品の候補を精査します。")

    updated_count = 0
    new_count = 0

    print("\n[3/5] データベースレコードを照合・更新中...")
    for anime in anime_candidates:
        work_id = anime["id"]
        title_ja = anime["title_ja"]
        title_en = anime["title_en"]
        year = anime["year"]
        raw_score = anime["score"]
        bangumi_id = anime.get("bangumi_id")

        if not title_ja:
            continue

        cursor.execute("SELECT work_id, anilist_raw_score, deviation_score FROM works WHERE work_id = ? OR title = ?", (work_id, title_ja))
        row = cursor.fetchone()

        dev_score = round(max(30.0, min(85.0, (float(raw_score) - 65.0) / 9.8 * 10.0 + 50.0)), 1) if raw_score > 0 else 50.0

        if row:
            db_work_id, old_raw, old_dev = row
            if raw_score > 0 and abs(old_raw - raw_score) >= 0.5:
                cursor.execute("""
                UPDATE works SET anilist_raw_score = ?, deviation_score = ? WHERE work_id = ?
                """, (raw_score, dev_score, db_work_id))
                updated_count += 1
        else:
            print(f"  [NEW] 新着作品を検知: {title_ja} ({year}) - Score: {raw_score}")
            staff_dict, cast_list = fetch_bangumi_staff_and_cast(title_ja, subject_id=bangumi_id)

            tier = "S+" if dev_score >= 70.0 else "S" if dev_score >= 65.0 else "A" if dev_score >= 58.0 else "B" if dev_score >= 50.0 else "C"
            title_norm = title_ja.lower().replace(" ", "").replace("　", "")
            staff_json = json.dumps(staff_dict, ensure_ascii=False)
            chars_json = json.dumps(cast_list, ensure_ascii=False)

            cursor.execute("""
            INSERT INTO works (
                work_id, title, title_en, title_norm, year, anilist_raw_score, raw_score_rank,
                debiased_b_i, true_z_score, deviation_score, z_score_rank, predicted_z_score,
                predicted_score, pred_score_rank, residual, performance_verdict, tier,
                percentile, staff_json, characters_json, search_text_norm
            ) VALUES (?, ?, ?, ?, ?, ?, 9999, 0.0, 0.0, ?, 9999, 0.0, ?, 9999, 0.0, 'NEW', ?, 50.0, ?, ?, ?)
            """, (
                work_id, title_ja, title_en, title_norm, year, raw_score,
                dev_score, raw_score, tier, staff_json, chars_json, title_norm
            ))
            new_count += 1

    conn.commit()
    print(f"  -> 更新完了: スコア改定 {updated_count} 作品 / 新規登録 {new_count} 作品")

    print("\n[4/5] サマリー集計 & Gzip 圧縮中...")
    cursor.execute("SELECT COUNT(*) FROM works")
    total_works = cursor.fetchone()[0]

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    UPDATE summary SET
        total_works = ?,
        updated_at = ?,
        year_max = ?
    """, (total_works, now_str, current_year))
    conn.commit()

    cursor.execute("VACUUM")
    new_db_bytes = conn.serialize()
    conn.close()

    with gzip.open(gz_db_path, "wb", compresslevel=9) as f_out:
        f_out.write(new_db_bytes)

    gz_size = os.path.getsize(gz_db_path)
    sha256_hash = hashlib.sha256(new_db_bytes).hexdigest()
    print(f"  -> Gzip圧縮完了: {gz_size / (1024*1024):.2f} MB (SHA-256: {sha256_hash[:12]}...)")

    version_info = {
        "version": "1.3.1",
        "updatedAt": now_str,
        "totalWorks": int(total_works),
        "totalStaff": int(prev_summary[1]),
        "totalCv": int(prev_summary[2]),
        "yearMin": 1950,
        "yearMax": int(current_year),
        "globalMean": float(prev_summary[3]),
        "dbFileName": "creditdb.db.gz",
        "dbSizeCompressed": gz_size,
        "dbSizeUncompressed": len(new_db_bytes),
        "sha256": sha256_hash
    }
    with open(version_json_path, "w", encoding="utf-8") as f:
        json.dump(version_info, f, ensure_ascii=False, indent=2)

    print(f"[5/5] version.json を最新化しました: {version_json_path.name}")
    print("===========================================================")
    print("  週次自動更新が正常に完了しました！")
    print("===========================================================")

if __name__ == "__main__":
    main()
