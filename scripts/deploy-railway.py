#!/usr/bin/env python3
"""
Railway deployment script for etsy-analyzer monorepo.

Usage:
    RAILWAY_TOKEN=<your_token> python scripts/deploy-railway.py

Or pass token as first argument:
    python scripts/deploy-railway.py <your_token>
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

# ─── Config ────────────────────────────────────────────────────────────────────

REPO = "paulcoleltd/etsy-analyzer"
BRANCH = "main"
PROJECT_NAME = "etsy-analyzer"
RAILWAY_API = "https://backboard.railway.app/graphql/v2"

# Services to deploy on Railway
SERVICES = [
    {
        "name": "auth-service",
        "dockerfilePath": "services/auth-service/Dockerfile",
        "port": 3001,
        "healthcheck": "/health",
    },
    {
        "name": "competitor-service",
        "dockerfilePath": "services/competitor-service/Dockerfile",
        "port": 3002,
        "healthcheck": "/health",
    },
    {
        "name": "notification-service",
        "dockerfilePath": "services/notification-service/Dockerfile",
        "port": 3003,
        "healthcheck": "/health",
    },
    {
        "name": "research-service",
        "dockerfilePath": "services/research-service/Dockerfile",
        "port": 8000,
        "healthcheck": "/health",
    },
    {
        "name": "keyword-service",
        "dockerfilePath": "services/keyword-service/Dockerfile",
        "port": 8000,
        "healthcheck": "/health",
    },
    {
        "name": "analytics-service",
        "dockerfilePath": "services/analytics-service/Dockerfile",
        "port": 8000,
        "healthcheck": "/health",
    },
    {
        "name": "grader-service",
        "dockerfilePath": "services/grader-service/Dockerfile",
        "port": 8000,
        "healthcheck": "/health",
    },
    {
        "name": "data-pipeline",
        "dockerfilePath": "services/data-pipeline/Dockerfile",
        "port": None,   # Worker — no HTTP port
        "healthcheck": None,
    },
]

# ─── Helpers ───────────────────────────────────────────────────────────────────

def gql(token: str, query: str, variables: dict = None) -> dict:
    """Execute a Railway GraphQL request."""
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        RAILWAY_API,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body}") from e

    if "errors" in data:
        raise RuntimeError(f"GraphQL errors: {json.dumps(data['errors'], indent=2)}")
    return data["data"]


def load_env(path: str) -> dict[str, str]:
    """Load .env file, skip comments and empty lines."""
    env = {}
    try:
        for line in Path(path).read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return env


def log(msg: str, *, ok: bool = True):
    prefix = "✅" if ok else "⚠️ "
    print(f"  {prefix} {msg}")


# ─── Railway API operations ─────────────────────────────────────────────────────

def get_or_create_project(token: str) -> tuple[str, str]:
    """Return (projectId, environmentId) — creates project if it doesn't exist."""
    # List existing projects
    data = gql(token, """
        query { me { projects { edges { node { id name environments { edges { node { id name } } } } } } } }
    """)
    for edge in data["me"]["projects"]["edges"]:
        if edge["node"]["name"] == PROJECT_NAME:
            proj = edge["node"]
            env_id = proj["environments"]["edges"][0]["node"]["id"]
            log(f"Reusing existing project '{PROJECT_NAME}' ({proj['id']})")
            return proj["id"], env_id

    # Create new project
    data = gql(token, """
        mutation($name: String!) {
            projectCreate(input: { name: $name }) {
                id
                environments { edges { node { id name } } }
            }
        }
    """, {"name": PROJECT_NAME})
    proj = data["projectCreate"]
    env_id = proj["environments"]["edges"][0]["node"]["id"]
    log(f"Created project '{PROJECT_NAME}' ({proj['id']})")
    return proj["id"], env_id


def create_service(token: str, project_id: str, service_name: str) -> str:
    """Create a Railway service and return its ID."""
    # Check if service already exists
    data = gql(token, """
        query($projectId: String!) {
            project(id: $projectId) {
                services { edges { node { id name } } }
            }
        }
    """, {"projectId": project_id})
    for edge in data["project"]["services"]["edges"]:
        if edge["node"]["name"] == service_name:
            svc_id = edge["node"]["id"]
            log(f"Reusing existing service '{service_name}' ({svc_id})")
            return svc_id

    data = gql(token, """
        mutation($input: ServiceCreateInput!) {
            serviceCreate(input: $input) { id name }
        }
    """, {"input": {"projectId": project_id, "name": service_name}})
    svc_id = data["serviceCreate"]["id"]
    log(f"Created service '{service_name}' ({svc_id})")
    return svc_id


def connect_github(token: str, service_id: str, env_id: str,
                   dockerfile_path: str) -> None:
    """Connect service to GitHub repo and set Dockerfile path."""
    gql(token, """
        mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
            serviceInstanceUpdate(
                serviceId: $serviceId
                environmentId: $environmentId
                input: $input
            )
        }
    """, {
        "serviceId": service_id,
        "environmentId": env_id,
        "input": {
            "source": {
                "repo": REPO,
                "branch": BRANCH,
            },
            "buildConfig": {
                "dockerfilePath": dockerfile_path,
                "watchPatterns": ["services/**", "packages/**"],
            },
            "rootDirectory": ".",
        },
    })
    log(f"Linked to GitHub {REPO} (dockerfile: {dockerfile_path})")


def set_variables(token: str, project_id: str, env_id: str,
                  service_id: str, variables: dict[str, str]) -> None:
    """Upsert environment variables for a service."""
    for key, value in variables.items():
        if not value or value.startswith("your_") or value.startswith("sk_test_..."):
            continue   # Skip placeholder values
        gql(token, """
            mutation($input: VariableUpsertInput!) {
                variableUpsert(input: $input)
            }
        """, {
            "input": {
                "projectId": project_id,
                "environmentId": env_id,
                "serviceId": service_id,
                "name": key,
                "value": value,
            }
        })
    log(f"Set {len(variables)} environment variables")


def trigger_deployment(token: str, service_id: str, env_id: str) -> str:
    """Trigger a deployment and return the deployment ID."""
    data = gql(token, """
        mutation($serviceId: String!, $environmentId: String!) {
            serviceInstanceRedeploy(
                serviceId: $serviceId
                environmentId: $environmentId
            )
        }
    """, {"serviceId": service_id, "environmentId": env_id})
    log("Deployment triggered")
    return service_id


def add_postgres(token: str, project_id: str, env_id: str) -> str:
    """Add a managed PostgreSQL plugin."""
    data = gql(token, """
        mutation($input: PluginCreateInput!) {
            pluginCreate(input: $input) { id name }
        }
    """, {
        "input": {
            "projectId": project_id,
            "name": "postgresql",
            "friendlyName": "Postgres",
        }
    })
    plugin_id = data["pluginCreate"]["id"]
    log(f"Created Postgres plugin ({plugin_id})")
    return plugin_id


def add_redis(token: str, project_id: str, env_id: str) -> str:
    """Add a managed Redis plugin."""
    data = gql(token, """
        mutation($input: PluginCreateInput!) {
            pluginCreate(input: $input) { id name }
        }
    """, {
        "input": {
            "projectId": project_id,
            "name": "redis",
            "friendlyName": "Redis",
        }
    })
    plugin_id = data["pluginCreate"]["id"]
    log(f"Created Redis plugin ({plugin_id})")
    return plugin_id


# ─── Main ───────────────────────────────────────────────────────────────────────

def main():
    # ── Token ──────────────────────────────────────────────────────────────────
    token = os.environ.get("RAILWAY_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else "")
    if not token:
        print("❌  RAILWAY_TOKEN not set.")
        print("   Get yours at: https://railway.app/account/tokens")
        print("   Then run:  RAILWAY_TOKEN=<token> python scripts/deploy-railway.py")
        sys.exit(1)

    # ── Load env vars from .env (one directory up from scripts/) ───────────────
    root = Path(__file__).parent.parent
    env_vars = load_env(str(root / ".env"))
    # Prefer .env.local values (they override .env)
    env_vars.update(load_env(str(root / ".env.local")))

    print(f"\n🚀  Deploying etsy-analyzer to Railway")
    print(f"    Repo  : {REPO}  ({BRANCH})")
    print(f"    Loaded {len(env_vars)} env vars from .env\n")

    # ── Project ────────────────────────────────────────────────────────────────
    project_id, env_id = get_or_create_project(token)

    # ── Managed infrastructure ─────────────────────────────────────────────────
    print("\n📦  Infrastructure plugins")
    try:
        add_postgres(token, project_id, env_id)
    except Exception as e:
        log(f"Postgres already exists or error: {e}", ok=False)

    try:
        add_redis(token, project_id, env_id)
    except Exception as e:
        log(f"Redis already exists or error: {e}", ok=False)

    # ── Services ───────────────────────────────────────────────────────────────
    deployed = []
    for svc in SERVICES:
        name = svc["name"]
        print(f"\n🔧  Service: {name}")

        svc_id = create_service(token, project_id, name)

        connect_github(token, svc_id, env_id, svc["dockerfilePath"])

        # Build per-service env vars (shared + service-specific overrides)
        svc_env = dict(env_vars)
        svc_env["PORT"] = str(svc["port"]) if svc["port"] else "8000"
        svc_env["NODE_ENV"] = "production"

        # data-pipeline specific
        if name == "data-pipeline":
            svc_env["DATA_PIPELINE_MODE"] = "worker"

        set_variables(token, project_id, env_id, svc_id, svc_env)
        trigger_deployment(token, svc_id, env_id)
        deployed.append({"name": name, "id": svc_id})
        time.sleep(0.5)   # Gentle rate limiting

    # ── Summary ────────────────────────────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"✅  {len(deployed)} services queued for deployment\n")
    print(f"   Dashboard: https://railway.app/project/{project_id}")
    print()
    print("   Services:")
    for s in deployed:
        print(f"     • {s['name']:<25}  id: {s['id']}")

    print(f"""
📝  Next steps:
   1. Open the dashboard link above
   2. Add missing secrets (Stripe, Etsy API, etc.) in Railway's Variables UI
   3. After Postgres provisions, Railway injects DATABASE_URL automatically
   4. The web app (apps/web) has vercel.json — deploy it with:
         cd apps/web && vercel --prod
""")


if __name__ == "__main__":
    main()
