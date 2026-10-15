# -*- coding: utf-8 -*-
"""
Weekly CreditDB Auto-Updater (AniList GraphQL & Bangumi API)
Executes weekly via GitHub Actions (or manually) to:
1. Decompress public/data/creditdb.db.gz into SQLite memory
2. Fetch recent/airing anime and latest scores from AniList API (multi-page)
3. Enriches unevaluated works in DB via direct AniList search
4. Enriches full staff and cast credits via Bangumi API (covering genga, sakkan, director, unit_director, art_dir, etc.)
5. Recomputes Bayesian ratings and cumulative Z excluding unevaluated works (z=0)
6. Updates leaderboards, profiles, and summary tables
7. Re-compresses to public/data/creditdb.db.gz and updates public/data/version.json
"""

import os
import sys
import gzip
import json
import time
import hashlib
import sqlite3
import datetime
import unicodedata
import re
import urllib.parse
import urllib.request
from pathlib import Path
from collections import defaultdict

# Ensure UTF-8 output across Windows and CI environments
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

ANILIST_ENDPOINT = "https://graphql.anilist.co"
BANGUMI_ENDPOINT = "https://api.bgm.tv"
USER_AGENT = "CreditDB-Web-Updater/2.0 (https://github.com/nanbeimerco/CreditDB-Web)"

DEFAULT_ROLE_M = {
    "director": 2.0,
    "series_comp": 2.0,
    "char_design": 2.0,
    "music": 2.0,
    "unit_director": 4.0,
    "sakkan": 4.0,
    "art_dir": 4.0,
    "genga": 6.0,
    "cv": 6.0,
    "all": 6.0,
}

RELATION_MAP = {
    "导演": "director",
    "总导演": "director",
    "副导演": "director",
    "系列构成": "series_comp",
    "脚本": "series_comp",
    "人物设定": "char_design",
    "角色设计": "char_design",
    "副人物设定": "char_design",
    "总作画监督": "sakkan",
    "作画监督": "sakkan",
    "作画监督助理": "sakkan",
    "总作画监督助理": "sakkan",
    "特效作画监督": "sakkan",
    "动作作画监督": "sakkan",
    "原画": "genga",
    "第二原画": "genga",
    "主动画师": "genga",
    "演出": "unit_director",
    "演出助理": "unit_director",
    "助监督": "unit_director",
    "OP・ED 演出": "unit_director",
    "分镜": "storyboard",
    "OP・ED 分镜": "storyboard",
    "分镜协力": "storyboard",
    "音乐": "music",
    "美术监督": "art_dir",
    "美术设计": "art_dir",
    "背景美术": "art_dir",
    "色彩设计": "color_design",
    "色彩指定": "color_design",
    "摄影监督": "photo_dir",
    "摄影": "photo_dir",
    "音响监督": "sound_dir",
    "音响": "sound_dir",
    "动画制作": "studio",
}

def norm(t):
    if not t: return ''
    t = unicodedata.normalize('NFKC', str(t)).lower()
    return re.sub(r'[\s\-_・:：~〜\.\,\!\?！？\(\)（）「」『』【】〈〉\[\]/／]', '', t)

def calculate_tier(rank: int, total: int) -> str:
    if total <= 0 or rank <= 0:
        return "-"
    pct = (rank - 1) / max(1, total)
    if pct <= 0.023:
        return "S+"
    elif pct <= 0.067:
        return "S"
    elif pct <= 0.159:
        return "A+"
    elif pct <= 0.309:
        return "A"
    elif pct <= 0.500:
        return "B+"
    elif pct <= 0.700:
        return "B"
    elif pct <= 0.850:
        return "C"
    else:
        return "D"

def execute_anilist_query(query: str, variables: dict = None, retries: int = 3):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(ANILIST_ENDPOINT, data=payload, headers=headers, method="POST")

    for attempt in range(retries):
        try:
            time.sleep(0.6)
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
            time.sleep(1.0)
    return None

def fetch_recent_anilist_anime(target_years=[2025, 2026], max_pages=3, per_page=50):
    print(f"[AniList] Fetching popular anime for years: {target_years} (up to {max_pages * per_page} per year)...")
    query = """
    query ($year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
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
        for page in range(1, max_pages + 1):
            res = execute_anilist_query(query, {"year": yr, "page": page, "perPage": per_page})
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
                if not res["data"]["Page"].get("pageInfo", {}).get("hasNextPage", False):
                    break
        print(f"  -> Year {yr}: fetched {len(results)} anime entries so far")
    return results

def search_anilist_by_title(title: str):
    terms = [title]
    t_clean = re.sub(r'\(20\d\d\)', '', title).strip()
    if t_clean != title:
        terms.append(t_clean)
    t_clean2 = re.sub(r'第\d+期', '', t_clean).strip()
    if t_clean2 and t_clean2 not in terms:
        terms.append(t_clean2)

    query = """
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title {
          native
          romaji
          english
        }
        seasonYear
        averageScore
        meanScore
      }
    }
    """
    for term in terms:
        if not term: continue
        res = execute_anilist_query(query, {"search": term})
        if res and "data" in res and res["data"] and res["data"].get("Media"):
            m = res["data"]["Media"]
            score = float(m.get("averageScore") or m.get("meanScore") or 0.0)
            if score > 0:
                return m, score
    return None, 0.0

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
                    p_name = p.get("name", "").strip()
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
                    char_name = c.get("name", "").strip()
                    relation = c.get("relation", "配角")
                    actors = c.get("actors", [])
                    for act in actors:
                        actor_name = act.get("name", "").strip()
                        if char_name and actor_name:
                            cast_list.append({
                                "character_name": char_name,
                                "relation": relation,
                                "actor_name": actor_name,
                                "rt": "B",
                                "ct": "B"
                            })
                            break

        return staff_by_role, cast_list
    except Exception as e:
        print(f"[Bangumi] Fetch error for '{title_jp}': {e}")
        return {}, []

def recalculate_leaderboards_and_profiles(conn):
    print("  -> Recalculating leaderboards and profiles excluding Z=0 works...")
    cur = conn.cursor()

    cur.execute("SELECT work_id, year, anilist_raw_score FROM works")
    all_works = cur.fetchall()
    scored_items = {wid: float(sc) for wid, yr, sc in all_works if sc and float(sc) > 0.0}
    item_years = {wid: int(yr or 0) for wid, yr, sc in all_works if sc and float(sc) > 0.0}

    year_to_items = defaultdict(list)
    for wid, yr in item_years.items():
        year_to_items[yr].append(wid)

    work_zscores = {}
    work_devscores = {}

    for wid, b_val in scored_items.items():
        target_year = item_years[wid]
        window_b = []
        for y_offset in range(-3, 4):
            y_check = target_year + y_offset
            for neighbor in year_to_items.get(y_check, []):
                window_b.append(scored_items[neighbor])

        if len(window_b) >= 5:
            mu_t = sum(window_b) / len(window_b)
            var_t = sum((x - mu_t) ** 2 for x in window_b) / len(window_b)
            sigma_t = max(var_t ** 0.5, 1.0)
        else:
            mu_t = sum(scored_items.values()) / len(scored_items)
            var_t = sum((x - mu_t) ** 2 for x in scored_items.values()) / len(scored_items)
            sigma_t = max(var_t ** 0.5, 1.0)

        z = (b_val - mu_t) / sigma_t
        dev = 50.0 + 10.0 * z
        work_zscores[wid] = z
        work_devscores[wid] = dev

    cur.execute("SELECT work_id, title, year, staff_json, characters_json FROM works")
    all_works_data = cur.fetchall()

    staff_overall = defaultdict(list)
    staff_by_role = defaultdict(list)
    rel_weights = {"主角": 1.0, "配角": 0.5, "客串": 0.2, "MAIN": 1.0, "SUPPORTING": 0.5, "BACKGROUND": 0.2}

    for wid, title, yr, s_json, c_json in all_works_data:
        year = int(yr or 0)
        z = work_zscores.get(wid, 0.0)

        if s_json:
            try:
                s_map = json.loads(s_json)
                for role in ["director", "series_comp", "char_design", "unit_director", "sakkan", "music", "art_dir"]:
                    names = s_map.get(role, [])
                    if isinstance(names, str): names = [names]
                    for n in names:
                        name = n.get("name") if isinstance(n, dict) else str(n)
                        name = name.strip() if name else ""
                        if name:
                            rec = {"work_id": wid, "title": title, "year": year, "role": role, "z": z, "w": 1.0}
                            staff_overall[name].append(rec)
                            staff_by_role[(role, name)].append(rec)

                genga_list = s_map.get("genga", [])
                if isinstance(genga_list, list):
                    for idx, g in enumerate(genga_list, start=1):
                        name = g.get("name") if isinstance(g, dict) else str(g)
                        name = name.strip() if name else ""
                        if name:
                            rec = {"work_id": wid, "title": title, "year": year, "role": "genga", "z": z, "w": 1.0}
                            staff_overall[name].append(rec)
                            staff_by_role[("genga", name)].append(rec)
            except: pass

        if c_json:
            try:
                chars = json.loads(c_json)
                seen_actor = set()
                for cr in chars:
                    aname = (cr.get("actor_name") or cr.get("actor") or "").strip()
                    if aname and aname not in seen_actor:
                        seen_actor.add(aname)
                        rel = cr.get("relation", "配角")
                        w = rel_weights.get(rel, 0.5)
                        cname = cr.get("character_name") or ""
                        rec = {"work_id": wid, "title": title, "year": year, "role": "cv", "z": z, "w": w, "top_char": f"{cname} ({rel})"}
                        staff_overall[aname].append(rec)
                        staff_by_role[("cv", aname)].append(rec)
            except: pass

    roles_list = ["all", "director", "series_comp", "char_design", "unit_director", "sakkan", "genga", "music", "art_dir", "cv"]
    lb_update_batch = []

    for rKey in roles_list:
        m_val = DEFAULT_ROLE_M.get(rKey, 6.0)
        candidates = []

        if rKey == "all":
            for name, recs in staff_overall.items():
                eval_recs = [r for r in recs if abs(r["z"]) > 1e-6]
                if eval_recs:
                    w_sum = sum(r["w"] for r in eval_recs)
                    z_sum = sum(r["z"] * r["w"] for r in eval_recs)
                    rating = z_sum / (w_sum + m_val)
                    best = max(eval_recs, key=lambda r: r["z"])
                else:
                    w_sum = 0.0
                    z_sum = 0.0
                    rating = 0.0
                    best = recs[0]

                years = [r["year"] for r in recs if r["year"] > 0]
                first_y = min(years) if years else None
                latest_y = max(years) if years else None

                candidates.append({
                    "role": "all",
                    "name": name,
                    "works_count": len(recs),
                    "rating": rating,
                    "cum_z": z_sum,
                    "first_year": first_y,
                    "latest_year": latest_y,
                    "best_title": best["title"],
                    "best_year": best["year"],
                    "best_z": best["z"],
                    "top_char": None
                })
        else:
            for (role, name), recs in staff_by_role.items():
                if role != rKey: continue
                eval_recs = [r for r in recs if abs(r["z"]) > 1e-6]
                if eval_recs:
                    w_sum = sum(r["w"] for r in eval_recs)
                    z_sum = sum(r["z"] * r["w"] for r in eval_recs)
                    rating = z_sum / (w_sum + m_val)
                    best = max(eval_recs, key=lambda r: r["z"])
                else:
                    w_sum = 0.0
                    z_sum = 0.0
                    rating = 0.0
                    best = recs[0]

                years = [r["year"] for r in recs if r["year"] > 0]
                first_y = min(years) if years else None
                latest_y = max(years) if years else None

                top_char = None
                if role == "cv":
                    for r in recs:
                        if r.get("top_char"):
                            top_char = r["top_char"]
                            if "主角" in top_char or "MAIN" in top_char:
                                break

                candidates.append({
                    "role": role,
                    "name": name,
                    "works_count": len(recs),
                    "rating": rating,
                    "cum_z": z_sum,
                    "first_year": first_y,
                    "latest_year": latest_y,
                    "best_title": best["title"],
                    "best_year": best["year"],
                    "best_z": best["z"],
                    "top_char": top_char
                })

        candidates.sort(key=lambda c: c["rating"], reverse=True)
        tot_c = len(candidates)
        for rk, c in enumerate(candidates, start=1):
            c["rating_rank"] = rk
            c["rating_tier"] = calculate_tier(rk, tot_c)

        candidates.sort(key=lambda c: c["cum_z"], reverse=True)
        for rk, c in enumerate(candidates, start=1):
            c["cum_rank"] = rk
            c["cum_tier"] = calculate_tier(rk, tot_c)

        for c_info in candidates:
            lb_update_batch.append((
                c_info["role"],
                c_info["name"],
                norm(c_info["name"]),
                c_info["works_count"],
                round(c_info["rating"], 3),
                round(c_info["cum_z"], 2),
                c_info["rating_rank"],
                c_info["cum_rank"],
                c_info["rating_tier"],
                c_info["cum_tier"],
                c_info["best_title"],
                c_info["best_year"],
                round(c_info["best_z"], 3),
                c_info["top_char"],
                c_info["first_year"],
                c_info["latest_year"]
            ))

    cur.execute("DELETE FROM leaderboards;")
    cur.executemany("""
        INSERT INTO leaderboards (
            role, name, name_norm, works_count, bayesian_rating, career_cumulative_z,
            rating_rank, cumulative_rank, rating_tier, cumulative_tier,
            best_work_title, best_work_year, best_work_z, top_character,
            first_year, latest_year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, lb_update_batch)

    # Rebuild profiles
    cur.execute("DELETE FROM profiles;")
    cur.execute("SELECT role, COUNT(*) FROM leaderboards GROUP BY role;")
    role_totals = dict(cur.fetchall())

    cur.execute("""
        SELECT role, name, works_count, bayesian_rating, career_cumulative_z,
               rating_rank, cumulative_rank, rating_tier, cumulative_tier,
               first_year, latest_year
        FROM leaderboards
        ORDER BY role, rating_rank;
    """)
    lb_all_rows = cur.fetchall()
    staff_lb_map = defaultdict(dict)
    for r in lb_all_rows:
        role, name, w_count, b_rating, cum_z, r_rank, c_rank, r_tier, c_tier, f_yr, l_yr = r
        staff_lb_map[name][role] = {
            "role": role,
            "works_count": w_count,
            "bayesian_rating": round(b_rating, 3),
            "cumulative_z": round(cum_z, 2),
            "rating_rank": r_rank,
            "cumulative_rank": c_rank,
            "role_total": role_totals.get(role, 0),
            "rating_tier": r_tier,
            "cum_tier": c_tier,
            "first_year": f_yr,
            "latest_year": l_yr
        }

    prof_batch = []
    for name, roles in staff_lb_map.items():
        all_stat = roles.get("all")
        if not all_stat: continue

        sub_roles = [st for r, st in roles.items() if r != "all"]
        sub_roles.sort(key=lambda s: s["works_count"], reverse=True)
        primary_role = sub_roles[0]["role"] if sub_roles else "cv"

        role_stats_list = []
        for st in sub_roles:
            role_stats_list.append({
                "role": st["role"],
                "works_count": st["works_count"],
                "bayesian_rating": st["bayesian_rating"],
                "cumulative_z": st["cumulative_z"],
                "career_cumulative_z": st["cumulative_z"],
                "rating_rank": st["rating_rank"],
                "cumulative_rank": st["cumulative_rank"],
                "role_total": st["role_total"],
                "rating_tier": st["rating_tier"],
                "cum_tier": st["cum_tier"],
                "cumulative_tier": st["cum_tier"]
            })

        raw_recs = staff_overall.get(name, [])
        traj = []
        for rec in raw_recs:
            t_item = {
                "work_id": rec["work_id"],
                "work_title": rec["title"],
                "year": rec["year"],
                "role": rec["role"],
                "z_score": round(rec["z"], 3)
            }
            if "top_char" in rec and rec["top_char"]:
                t_item["character_name"] = rec["top_char"]
            traj.append(t_item)
        traj.sort(key=lambda x: (x["year"], x["work_id"]))

        prof_batch.append((
            name,
            norm(name),
            primary_role,
            all_stat["works_count"],
            all_stat["bayesian_rating"],
            all_stat["rating_tier"],
            all_stat["rating_rank"],
            all_stat["cumulative_z"],
            all_stat["cum_tier"],
            all_stat["cumulative_rank"],
            json.dumps(role_stats_list, ensure_ascii=False),
            json.dumps(traj, ensure_ascii=False),
            all_stat["first_year"],
            all_stat["latest_year"]
        ))

    cur.executemany("""
        INSERT INTO profiles (
            name, name_norm, primary_role, total_works, bayesian_rating,
            overall_rating_tier, overall_rank, career_cumulative_z,
            overall_cum_tier, cumulative_rank, all_role_stats_json,
            career_trajectory_json, first_year, latest_year
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, prof_batch)
    conn.commit()
    print("  -> Leaderboards and profiles recalculation complete.")

    # Resolve staff & cast tiers in works
    print("  -> Resolving staff & cast tiers in works from leaderboards...")
    cur.execute("SELECT role, name, rating_tier, cumulative_tier FROM leaderboards")
    tier_map = {}
    for role, name, r_tier, c_tier in cur.fetchall():
        tier_map[(role, name)] = (r_tier, c_tier)
        if role == "all":
            tier_map[("fallback", name)] = (r_tier, c_tier)

    cur.execute("SELECT work_id, staff_json, characters_json FROM works")
    works = cur.fetchall()
    updates = []
    for wid, s_json, c_json in works:
        changed = False
        new_s_json = s_json
        new_c_json = c_json
        if s_json:
            try:
                s_map = json.loads(s_json)
                for role, staff_list in s_map.items():
                    if isinstance(staff_list, list):
                        for item in staff_list:
                            if isinstance(item, dict):
                                name = item.get("name", "").strip()
                                tiers = tier_map.get((role, name)) or tier_map.get(("fallback", name))
                                if tiers:
                                    r_t, c_t = tiers
                                    if item.get("rt") != r_t or item.get("ct") != c_t:
                                        item["rt"] = r_t
                                        item["ct"] = c_t
                                        changed = True
                if changed:
                    new_s_json = json.dumps(s_map, ensure_ascii=False)
            except: pass
        if c_json:
            try:
                c_list = json.loads(c_json)
                if isinstance(c_list, list):
                    for char in c_list:
                        if isinstance(char, dict):
                            actor_name = char.get("actor_name", "").strip()
                            tiers = tier_map.get(("cv", actor_name)) or tier_map.get(("fallback", actor_name))
                            if tiers:
                                r_t, c_t = tiers
                                if char.get("rt") != r_t or char.get("ct") != c_t:
                                    char["rt"] = r_t
                                    char["ct"] = c_t
                                    changed = True
                    if changed:
                        new_c_json = json.dumps(c_list, ensure_ascii=False)
            except: pass
        if changed:
            updates.append((new_s_json, new_c_json, wid))

    if updates:
        cur.executemany("UPDATE works SET staff_json = ?, characters_json = ? WHERE work_id = ?", updates)
        conn.commit()
        print(f"  -> Resolved staff & cast tiers for {len(updates)} works.")

def main():
    print("===========================================================")
    print("  CreditDB for Web: 週次データ自動更新・同期バッチ (v2.0)")
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

    print("\n[2/5] アニメ最新情報を AniList API より取得中...")
    current_year = datetime.datetime.now().year
    target_years = [current_year - 1, current_year, current_year + 1]

    anime_candidates = fetch_recent_anilist_anime(target_years=target_years, max_pages=3, per_page=50)

    # Also search directly for any unevaluated recent works in DB
    print("\n  [2b] DB内の未評価作品を検索・補完中...")
    cursor.execute("SELECT work_id, title, year FROM works WHERE (anilist_raw_score = 0.0 OR anilist_raw_score IS NULL) AND year >= ? ORDER BY year DESC LIMIT 30", (current_year - 2,))
    uneval_works = cursor.fetchall()
    for wid, title, yr in uneval_works:
        m, sc = search_anilist_by_title(title)
        if sc > 0:
            print(f"  -> スコア補完: {title} ({wid}) - Score: {sc}")
            anime_candidates.append({
                "id": wid,
                "title_ja": title,
                "title_en": m.get("title", {}).get("english") or "",
                "year": yr,
                "score": sc,
                "bangumi_id": int(wid.replace("anime_bgm_", "")) if wid.startswith("anime_bgm_") else None
            })

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

        cursor.execute("SELECT work_id, anilist_raw_score, deviation_score, length(staff_json) FROM works WHERE work_id = ? OR title = ?", (work_id, title_ja))
        row = cursor.fetchone()

        dev_score = round(max(30.0, min(85.0, (float(raw_score) - 65.0) / 9.8 * 10.0 + 50.0)), 1) if raw_score > 0 else 50.0

        if row:
            db_work_id, old_raw, old_dev, staff_len = row
            needs_update = False
            if raw_score > 0 and (old_raw is None or old_raw == 0.0 or abs(old_raw - raw_score) >= 0.5):
                cursor.execute("""
                UPDATE works SET anilist_raw_score = ?, deviation_score = ? WHERE work_id = ?
                """, (raw_score, dev_score, db_work_id))
                needs_update = True
            
            # Enrich staff if existing staff count is too small (< 15 characters in json)
            if staff_len is None or staff_len < 100:
                s_dict, c_list = fetch_bangumi_staff_and_cast(title_ja, subject_id=bangumi_id)
                if s_dict:
                    cursor.execute("UPDATE works SET staff_json = ?, characters_json = ? WHERE work_id = ?",
                                   (json.dumps(s_dict, ensure_ascii=False), json.dumps(c_list, ensure_ascii=False), db_work_id))
                    needs_update = True

            if needs_update:
                updated_count += 1
        else:
            print(f"  [NEW] 新着作品を検知: {title_ja} ({year}) - Score: {raw_score}")
            staff_dict, cast_list = fetch_bangumi_staff_and_cast(title_ja, subject_id=bangumi_id)

            tier = "S+" if dev_score >= 70.0 else "S" if dev_score >= 65.0 else "A" if dev_score >= 58.0 else "B" if dev_score >= 50.0 else "C"
            title_norm = norm(title_ja)
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

    if updated_count > 0 or new_count > 0:
        recalculate_leaderboards_and_profiles(conn)

    print("\n[4/5] サマリー集計 & Gzip 圧縮中...")
    cursor.execute("SELECT COUNT(*) FROM works")
    total_works = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT name) FROM leaderboards WHERE role != 'cv'")
    total_staff = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT name) FROM leaderboards WHERE role = 'cv'")
    total_cv = cursor.fetchone()[0]

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    UPDATE summary SET
        total_works = ?,
        total_staff = ?,
        total_cv = ?,
        updated_at = ?,
        year_max = ?
    """, (total_works, total_staff, total_cv, now_str, current_year))
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
        "version": "1.4.0",
        "updatedAt": now_str,
        "totalWorks": int(total_works),
        "totalStaff": int(total_staff),
        "totalCv": int(total_cv),
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
