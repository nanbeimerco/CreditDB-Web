import os
import sys
import gzip
import json
import hashlib
import zipfile
import sqlite3
import shutil

def main():
    print("=== CreditDB for Web: データ準備・圧縮処理開始 ===")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_root = os.path.abspath(os.path.join(script_dir, ".."))
    repo_root = os.path.abspath(os.path.join(web_root, ".."))
    android_root = os.path.join(repo_root, "CreditDB Pro for Android")
    
    public_data_dir = os.path.join(web_root, "public", "data")
    os.makedirs(public_data_dir, exist_ok=True)
    
    # 1. creditdb.zip (または creditdb.db) から SQLite データを読み取り
    android_zip = os.path.join(android_root, "creditdb.zip")
    android_assets_zip = os.path.join(android_root, "app", "src", "main", "assets", "creditdb.zip")
    
    source_zip = android_zip if os.path.exists(android_zip) else android_assets_zip
    if not os.path.exists(source_zip):
        print(f"Error: creditdb.zip not found at {source_zip}")
        sys.exit(1)
        
    print(f"Reading database from: {source_zip} (Read-only)")
    with zipfile.ZipFile(source_zip, "r") as z:
        # DB ファイルを抽出
        db_entries = [f for f in z.namelist() if f.endswith(".db")]
        if not db_entries:
            print("Error: No .db file in zip")
            sys.exit(1)
        db_name = db_entries[0]
        db_bytes = z.read(db_name)
        
    db_uncompressed_size = len(db_bytes)
    print(f"Database extracted in memory. Raw size: {db_uncompressed_size / (1024*1024):.2f} MB")
    
    # 2. SQLite データからメタデータを取得
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp_db:
        tmp_db.write(db_bytes)
        tmp_db_path = tmp_db.name
        
    try:
        conn = sqlite3.connect(tmp_db_path)
        cur = conn.cursor()
        cur.execute("SELECT total_works, total_staff, total_cv, year_min, year_max, updated_at, version, global_mean FROM summary LIMIT 1")
        row = cur.fetchone()
        if row:
            total_works, total_staff, total_cv, year_min, year_max, updated_at, version, global_mean = row
        else:
            total_works, total_staff, total_cv, year_min, year_max, updated_at, version, global_mean = (5452, 22896, 5840, 1950, 2026, "2026-09-07 20:00:00", "1.3.0", 65.0)
        conn.close()
    finally:
        if os.path.exists(tmp_db_path):
            os.remove(tmp_db_path)
            
    # 3. Gzip 圧縮して creditdb.db.gz を生成
    dest_gz = os.path.join(public_data_dir, "creditdb.db.gz")
    print(f"Compressing database to gzip: {dest_gz} ...")
    with gzip.open(dest_gz, "wb", compresslevel=9) as f_out:
        f_out.write(db_bytes)
        
    gz_size = os.path.getsize(dest_gz)
    sha256_hash = hashlib.sha256(db_bytes).hexdigest()
    print(f"Gzip compression complete. Compressed size: {gz_size / (1024*1024):.2f} MB (SHA-256: {sha256_hash[:12]}...)")
    
    # 4. version.json を生成
    version_info = {
        "version": str(version),
        "updatedAt": str(updated_at),
        "totalWorks": int(total_works),
        "totalStaff": int(total_staff),
        "totalCv": int(total_cv),
        "yearMin": int(year_min),
        "yearMax": int(year_max),
        "globalMean": float(global_mean),
        "dbFileName": "creditdb.db.gz",
        "dbSizeCompressed": gz_size,
        "dbSizeUncompressed": db_uncompressed_size,
        "sha256": sha256_hash
    }
    version_path = os.path.join(public_data_dir, "version.json")
    with open(version_path, "w", encoding="utf-8") as f:
        json.dump(version_info, f, ensure_ascii=False, indent=2)
    print(f"Generated {version_path}")
    
    # 5. 辞書 JSON ファイルをコピー
    android_assets_dir = os.path.join(android_root, "app", "src", "main", "assets")
    dict_files = ["character_en_names.json", "staff_en_names.json", "work_covers.json"]
    for fname in dict_files:
        src = os.path.join(android_assets_dir, fname)
        if os.path.exists(src):
            dst = os.path.join(public_data_dir, fname)
            shutil.copy2(src, dst)
            print(f"Copied {fname} -> public/data/{fname} ({os.path.getsize(dst) / 1024:.1f} KB)")
        else:
            print(f"Warning: {src} not found!")
            
    print("\n=== データ準備・圧縮処理が正常に完了しました ===")

if __name__ == "__main__":
    main()
