import os
import sys
import subprocess

def main():
    print("=== CreditDB for Web: データ更新・パイプライン実行開始 ===")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    web_root = os.path.abspath(os.path.join(script_dir, ".."))
    repo_root = os.path.abspath(os.path.join(web_root, ".."))

    # 1. もし harvest_all.py があれば実行（オフライン環境やテスト時はスキップ可能）
    harvest_script = os.path.join(repo_root, "harvest_all.py")
    if os.path.exists(harvest_script) and "--skip-harvest" not in sys.argv:
        print(f"Running harvest script: {harvest_script} ...")
        try:
            subprocess.run([sys.executable, harvest_script], cwd=repo_root, check=True)
        except Exception as e:
            print(f"Harvest script failed or skipped: {e}")

    # 2. prepare_web_data.py を実行して Web 用 DB と version.json を最新化
    prep_script = os.path.join(script_dir, "prepare_web_data.py")
    print(f"Running prepare_web_data script: {prep_script} ...")
    subprocess.run([sys.executable, prep_script], cwd=web_root, check=True)

    print("=== CreditDB for Web: データ更新完了 ===")

if __name__ == "__main__":
    main()
