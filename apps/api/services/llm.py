import os
import json
import re
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

class LLMService:
    def __init__(self):
        self.client = None
        self.api_key = self._resolve_api_key()
        if self.api_key and OpenAI:
            self.client = OpenAI(api_key=self.api_key)

    def _resolve_api_key(self) -> str | None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            return api_key

        env_path = Path(__file__).resolve().parents[1] / ".env"
        if not env_path.exists():
            return None

        for raw_line in env_path.read_text().splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() != "OPENAI_API_KEY":
                continue
            cleaned_value = value.strip().strip('"').strip("'")
            if cleaned_value:
                os.environ["OPENAI_API_KEY"] = cleaned_value
                return cleaned_value
        return None

    def _ensure_client(self) -> OpenAI:
        if OpenAI is None:
            raise RuntimeError("openai package is not installed in the API environment.")
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is missing. Set it in apps/api/.env or your shell environment.")
        if self.client is None:
            self.client = OpenAI(api_key=self.api_key)
        return self.client

    def generate_policy(self, prompt: str) -> dict:
        """
        Generates a policy JSON from a natural language prompt.
        """
        return self._generate_real(prompt)

    def _extract_country_codes(self, prompt: str, verbs: tuple[str, ...]) -> list[str]:
        if not prompt:
            return []

        codes: list[str] = []
        seen: set[str] = set()
        pattern = re.compile(rf"\b(?:{'|'.join(verbs)})\b([^.;\n]*)", re.IGNORECASE)
        for match in pattern.finditer(prompt):
            segment = re.split(
                r"\b(?:allow|permit|deny|block|forbid|disallow)\b",
                match.group(1),
                maxsplit=1,
                flags=re.IGNORECASE,
            )[0]
            for raw_code in re.findall(r"\b[A-Za-z]{2}\b", segment):
                code = raw_code.upper()
                if code not in seen:
                    seen.add(code)
                    codes.append(code)
        return codes

    def _normalize_policy(self, policy: dict, prompt: str) -> dict:
        if not isinstance(policy, dict):
            policy = {}

        allowed = [
            str(code).upper()
            for code in policy.get("allowed_countries", [])
            if isinstance(code, str) and len(code) == 2
        ]
        denied = [
            str(code).upper()
            for code in policy.get("denied_countries", [])
            if isinstance(code, str) and len(code) == 2
        ]

        allow_from_prompt = self._extract_country_codes(prompt, ("allow", "permit"))
        deny_from_prompt = self._extract_country_codes(prompt, ("deny", "block", "forbid", "disallow"))

        for code in allow_from_prompt:
            if code not in allowed:
                allowed.append(code)
        for code in deny_from_prompt:
            if code not in denied:
                denied.append(code)

        denied_set = set(denied)
        allowed = [code for code in allowed if code not in denied_set]

        vpn_handling = policy.get("vpn_handling", {})
        if not isinstance(vpn_handling, dict):
            vpn_handling = {}
        vpn_mode = str(vpn_handling.get("mode", "STEP_UP")).upper()
        if vpn_mode not in {"ALLOW", "STEP_UP", "DENY"}:
            vpn_mode = "STEP_UP"
        allow_asn_orgs = vpn_handling.get("allow_asn_orgs", [])
        if not isinstance(allow_asn_orgs, list):
            allow_asn_orgs = []

        gps_rules = policy.get("gps_rules", {})
        if not isinstance(gps_rules, dict):
            gps_rules = {}
        decision_scores = policy.get("decision_scores", {})
        if not isinstance(decision_scores, dict):
            decision_scores = {}

        def _score(value: object, fallback: float) -> float:
            try:
                return float(value)  # type: ignore[arg-type]
            except (TypeError, ValueError):
                return fallback

        return {
            "allowed_countries": allowed,
            "denied_countries": denied,
            "vpn_handling": {
                "mode": vpn_mode,
                "allow_asn_orgs": allow_asn_orgs,
            },
            "gps_rules": {
                "max_accuracy_m": gps_rules.get("max_accuracy_m", 0),
                "max_age_seconds": gps_rules.get("max_age_seconds", 0),
            },
            "decision_scores": {
                "ALLOW": _score(decision_scores.get("ALLOW"), 0.9),
                "STEP_UP": _score(decision_scores.get("STEP_UP"), 0.5),
                "DENY": _score(decision_scores.get("DENY"), 0.1),
            },
        }

    def _generate_real(self, prompt: str) -> dict:
        try:
            client = self._ensure_client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": """
                    You are a security policy expert for GeoLogic. Convert the user's request into a valid JSON policy.
                    
                    The policy schema is:
                    {
                        "allowed_countries": ["Two-letter ISO codes"],
                        "denied_countries": ["Two-letter ISO codes"],
                        "vpn_handling": { "mode": "ALLOW" | "STEP_UP" | "DENY", "allow_asn_orgs": [] },
                        "gps_rules": { "max_accuracy_m": number, "max_age_seconds": number },
                        "decision_scores": { "ALLOW": number, "STEP_UP": number, "DENY": number }
                    }
                    
                    Return ONLY the JSON.
                    """},
                    {"role": "user", "content": prompt}
                ]
            )
            content = response.choices[0].message.content
            if not content:
                raise RuntimeError("OpenAI returned an empty response for policy generation.")
            return self._normalize_policy(json.loads(content), prompt)
        except Exception as e:
            raise RuntimeError(f"OpenAI policy generation failed: {e}") from e

    def explain_decision(self, decision: str, reason_codes: list, evidence: dict) -> str:
        """
        Generates a user-friendly explanation for the decision.
        """
        return self._explain_real(decision, reason_codes, evidence)

    def _explain_real(self, decision: str, reason_codes: list, evidence: dict) -> str:
        try:
            client = self._ensure_client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are GeoLogic. Explain the access decision to the user in a short, friendly, helpful sentence. Do not mention JSON fields directly."},
                    {"role": "user", "content": f"Decision: {decision}. Reasons: {reason_codes}. Evidence: {evidence}"}
                ]
            )
            content = response.choices[0].message.content
            if not content:
                raise RuntimeError("OpenAI returned an empty response for explanation.")
            return content
        except Exception as e:
            raise RuntimeError(f"OpenAI explanation failed: {e}") from e

llm_service = LLMService()
