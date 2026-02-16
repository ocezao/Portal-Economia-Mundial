#!/usr/bin/env python3
import json
import re
import sys
from urllib import request, error


BASE_URL = "https://metabase.cenariointernacional.com.br"
SESSION = "f680170b-a5b5-4b1f-b995-1a75689aff91"
DASHBOARD_ID = 3

FIELD_EVENTS_TS = 448
FIELD_SESSIONS_TS = 452


def api(method: str, path: str, payload=None):
    url = f"{BASE_URL}{path}"
    data = None
    headers = {"X-Metabase-Session": SESSION}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {body}") from exc


def normalize_sql(sql: str, tag: str, col: str) -> str:
    if f"{{{{{tag}}}}}" in sql:
        return sql

    pattern_and = re.compile(
        rf"\s+AND\s+{re.escape(col)}\s*>=\s*NOW\(\)\s*-\s*INTERVAL\s+'90 days'",
        flags=re.IGNORECASE,
    )
    pattern_where = re.compile(
        rf"\s+WHERE\s+{re.escape(col)}\s*>=\s*NOW\(\)\s*-\s*INTERVAL\s+'90 days'",
        flags=re.IGNORECASE,
    )

    out = pattern_and.sub(f" [[AND {{{{{tag}}}}}]]", sql)
    out = pattern_where.sub(f" [[WHERE {{{{{tag}}}}}]]", out)
    return out


def template_tag(tag: str, field_id: int, display_name: str):
    return {
        tag: {
            "id": tag,
            "name": tag,
            "display-name": display_name,
            "type": "dimension",
            "dimension": ["field", field_id, None],
            "widget-type": "date/all-options",
            "required": False,
        }
    }


def main():
    dashboard = api("GET", f"/api/dashboard/{DASHBOARD_ID}")
    dashcards = dashboard.get("dashcards", [])
    if not dashcards:
        raise RuntimeError("Dashboard sem cards.")

    changed_cards = {}

    for dc in dashcards:
        card = dc.get("card") or {}
        card_id = card.get("id")
        if not card_id:
            continue

        dq = card.get("dataset_query") or {}
        stages = dq.get("stages") or []
        if not stages:
            continue

        stage0 = stages[0]
        sql = stage0.get("native")
        if not isinstance(sql, str):
            continue

        is_events = "public.analytics_events" in sql
        is_sessions = "public.analytics_sessions" in sql
        if not is_events and not is_sessions:
            continue

        if is_events:
            tag = "periodo_eventos"
            new_sql = normalize_sql(sql, tag, '"timestamp"')
            tag_def = template_tag(tag, FIELD_EVENTS_TS, "Periodo eventos")
        else:
            tag = "periodo_sessoes"
            new_sql = normalize_sql(sql, tag, "started_at")
            tag_def = template_tag(tag, FIELD_SESSIONS_TS, "Periodo sessoes")

        tags = dict(stage0.get("template-tags") or {})
        tags.update(tag_def)

        card_full = api("GET", f"/api/card/{card_id}")
        card_payload = {
            "name": card_full["name"],
            "description": card_full.get("description"),
            "display": card_full["display"],
            "visualization_settings": card_full.get("visualization_settings") or {},
            "dataset_query": card_full["dataset_query"],
        }
        if "collection_id" in card_full:
            card_payload["collection_id"] = card_full.get("collection_id")

        card_payload["dataset_query"]["stages"][0]["native"] = new_sql
        card_payload["dataset_query"]["stages"][0]["template-tags"] = tags

        api("PUT", f"/api/card/{card_id}", card_payload)
        changed_cards[card_id] = tag

    refreshed = api("GET", f"/api/dashboard/{DASHBOARD_ID}")
    cards_payload = []
    for dc in refreshed.get("dashcards", []):
        card = dc.get("card") or {}
        card_id = card.get("id")
        mapping = []
        if card_id in changed_cards:
            mapping = [
                {
                    "parameter_id": "periodo_global",
                    "target": ["variable", ["template-tag", changed_cards[card_id]]],
                }
            ]
        cards_payload.append(
            {
                "id": dc["id"],
                "card_id": dc["card_id"],
                "row": dc["row"],
                "col": dc["col"],
                "size_x": dc["size_x"],
                "size_y": dc["size_y"],
                "parameter_mappings": mapping,
            }
        )

    api("PUT", f"/api/dashboard/{DASHBOARD_ID}/cards", {"cards": cards_payload})

    print(json.dumps({"updated_cards": len(changed_cards), "card_ids": sorted(changed_cards.keys())}))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
