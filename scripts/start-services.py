"""
Etsy Analyzer — Start all services
Run from project root: python scripts/start-services.py

Services started:
  Infrastructure : PostgreSQL (portable), Redis
  Python FastAPI : research :8002, keyword :8003, grader :8004
  Node / NestJS  : auth :3001, competitor :3002
  Next.js        : web :3000
"""
import subprocess, os, sys, time, signal

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PYTHON = sys.executable
PG_BIN    = r"C:\Users\Dell\pgsql\bin"
REDIS_BIN = r"C:\Users\Dell\redis"

NO_WINDOW  = 0x08000000
DETACHED   = 0x00000008

procs: list[tuple[str, subprocess.Popen]] = []

# ── Helpers ────────────────────────────────────────────────────

def env_for(svc_dir: str) -> dict:
    e = os.environ.copy()
    for name in (".env", ".env.local"):
        p = os.path.join(svc_dir, name)
        if os.path.exists(p):
            with open(p) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        e[k.strip().lstrip("﻿")] = v.strip()
            break
    return e

def popen_bg(cmd, cwd, env, log_path):
    with open(log_path, "w") as lf:
        return subprocess.Popen(
            cmd, cwd=cwd, env=env,
            stdout=lf, stderr=lf,
            creationflags=NO_WINDOW,
            shell=isinstance(cmd, str),
        )

# ── Infrastructure ─────────────────────────────────────────────

def start_postgres():
    pg_ready = os.path.join(PG_BIN, "pg_isready.exe")
    r = subprocess.run([pg_ready, "-U", "postgres", "-h", "127.0.0.1", "-p", "5432"],
                       capture_output=True)
    if r.returncode == 0:
        print("  [pg]    PostgreSQL already running")
        return
    data = r"C:\Users\Dell\pgsql\data"
    log  = r"C:\Users\Dell\pgsql\pg2.log"
    with open(log, "a") as lf:
        subprocess.Popen(
            [os.path.join(PG_BIN, "postgres.exe"), "-D", data, "-p", "5432"],
            stdout=lf, stderr=lf, creationflags=DETACHED | NO_WINDOW,
        )
    # Wait up to 8s
    for _ in range(8):
        time.sleep(1)
        if subprocess.run([pg_ready, "-U", "postgres", "-h", "127.0.0.1", "-p", "5432"],
                          capture_output=True).returncode == 0:
            break
    print("  [pg]    PostgreSQL started")

def start_redis():
    cli = os.path.join(REDIS_BIN, "redis-cli.exe")
    r = subprocess.run([cli, "-p", "6379", "ping"], capture_output=True, text=True)
    if r.stdout.strip() == "PONG":
        print("  [redis] Redis already running")
        return
    server = os.path.join(REDIS_BIN, "redis-server.exe")
    log    = os.path.join(REDIS_BIN, "redis.log")
    with open(log, "a") as lf:
        subprocess.Popen([server, "--port", "6379"],
                         stdout=lf, stderr=lf, creationflags=DETACHED | NO_WINDOW)
    time.sleep(2)
    print("  [redis] Redis started")

# ── App services ───────────────────────────────────────────────

def start_python(name: str, port: int, svc_dir: str):
    # Write a simple run.py to avoid uvicorn reload issues
    runner = os.path.join(svc_dir, "_run.py")
    with open(runner, "w") as f:
        f.write(f"""import sys, os
sys.path.insert(0, r\"{svc_dir}\")
os.chdir(r\"{svc_dir}\")
import uvicorn
uvicorn.run("src.main:app", host="0.0.0.0", port={port}, reload=False, log_level="info")
""")
    e = env_for(svc_dir)
    e["PYTHONPATH"] = svc_dir
    log = os.path.join(svc_dir, f"{name}.log")
    p = popen_bg([PYTHON, runner], svc_dir, e, log)
    procs.append((name, p))
    print(f"  [{name:<24}] started  :{port}  PID {p.pid}")

def start_node(name: str, filter_name: str, svc_dir: str):
    e = env_for(svc_dir)
    log = os.path.join(svc_dir, f"{name}.log")
    p = popen_bg(f"pnpm --filter {filter_name} dev", ROOT, e, log)
    procs.append((name, p))
    print(f"  [{name:<24}] started  PID {p.pid}")

# ── Health check ───────────────────────────────────────────────

def wait_for_port(url: str, timeout: int = 45) -> bool:
    import urllib.request
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=3)
            return True
        except Exception:
            time.sleep(2)
    return False

# ── Main ───────────────────────────────────────────────────────

def main():
    print()
    print("=" * 54)
    print("  Etsy Analyzer — Starting all services")
    print("=" * 54)
    print()

    print("[1/3] Infrastructure")
    start_postgres()
    start_redis()
    print()

    print("[2/3] App services")
    svc = os.path.join(ROOT, "services")
    # Python FastAPI services
    start_python("analytics-service", 8001, os.path.join(svc, "analytics-service"))
    time.sleep(0.5)
    start_python("research-service",  8012, os.path.join(svc, "research-service"))
    time.sleep(0.5)
    start_python("keyword-service",   8013, os.path.join(svc, "keyword-service"))
    time.sleep(0.5)
    start_python("grader-service",    8004, os.path.join(svc, "grader-service"))
    time.sleep(0.5)
    # Node / NestJS services
    start_node("auth-service",         "@etsy-analyzer/auth-service",        os.path.join(svc, "auth-service"))
    time.sleep(1)
    start_node("competitor-service",   "@etsy-analyzer/competitor-service",  os.path.join(svc, "competitor-service"))
    time.sleep(0.5)
    start_node("notification-service", "@etsy-analyzer/notification-service",os.path.join(svc, "notification-service"))
    time.sleep(0.5)
    start_node("web",                  "@etsy-analyzer/web",                 os.path.join(ROOT, "apps", "web"))
    print()

    print("[3/3] Waiting for web app…")
    if wait_for_port("http://localhost:3000"):
        print("  Web app is ready!")
    else:
        print("  Web app taking longer than expected — check apps/web/web.log")
    print()

    print("=" * 54)
    print("  App is live: http://localhost:3000")
    print()
    print("  Sign in:")
    print("    Email   : paulcoleltd@gmail.com")
    print("    Password: Etsy2024!")
    print()
    print("  Health checks:")
    print("    http://localhost:3001/health  (auth)")
    print("    http://localhost:8002/health  (research)")
    print("    http://localhost:8003/health  (keyword)")
    print("    http://localhost:8004/health  (grader)")
    print("    http://localhost:3002/health  (competitor)")
    print("=" * 54)
    print()
    print("  Ctrl+C to stop all services")
    print()

    def shutdown(sig, frame):
        print("\n  Stopping all services…")
        for name, p in procs:
            try:
                p.terminate()
                print(f"    stopped {name}")
            except Exception:
                pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        time.sleep(10)
        for name, p in procs:
            if p.poll() is not None:
                print(f"  [WARN] {name} exited (code {p.returncode}) — check its .log file")

if __name__ == "__main__":
    main()
