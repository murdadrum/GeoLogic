import os
import json
import re

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key and OpenAI:
            self.client = OpenAI(api_key=self.api_key)
        else:
            print("WARNING: OpenAI API Key not found or package missing. Using Mock LLM.")

    def generate_policy(self, prompt: str) -> dict:
        """
        Generates a policy JSON from a natural language prompt.
        """
        if self.client:
            return self._generate_real(prompt)
        return self._generate_mock(prompt)

    def _generate_real(self, prompt: str) -> dict:
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",  # Or gpt-3.5-turbo
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": """
                    You are a security policy expert for AccessGate AI. Convert the user's request into a valid JSON policy.
                    
                    The policy schema is:
                    {
                        "allowed_countries": ["Two-letter ISO codes"],
                        "vpn_handling": { "mode": "ALLOW" | "STEP_UP" | "DENY", "allow_asn_orgs": [] },
                        "gps_rules": { "max_accuracy_m": number, "max_age_seconds": number }
                    }
                    
                    Return ONLY the JSON.
                    """},
                    {"role": "user", "content": prompt}
                ]
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            return self._generate_mock(prompt) # Fallback

    def _generate_mock(self, prompt: str) -> dict:
        """
        Simple heuristic-based generator for demo purposes without an API key.
        """
        policy = {
            "allowed_countries": ["US", "CA"], # Default
            "vpn_handling": { "mode": "STEP_UP", "allow_asn_orgs": [] },
            "gps_rules": { "max_accuracy_m": 5000 }
        }
        
        prompt_lower = prompt.lower()
        
        # Countries
        countries = []
        if "us" in prompt_lower or "usa" in prompt_lower or "united states" in prompt_lower:
            countries.append("US")
        if "canada" in prompt_lower or "ca" in prompt_lower:
            countries.append("CA")
        if "uk" in prompt_lower or "united kingdom" in prompt_lower:
            countries.append("GB")
        if "mexico" in prompt_lower or "mx" in prompt_lower:
            countries.append("MX")
        if "germany" in prompt_lower or "de" in prompt_lower:
            countries.append("DE")
            
        if countries:
            policy["allowed_countries"] = countries
            
        # VPN
        if "block vpn" in prompt_lower or "deny vpn" in prompt_lower:
            policy["vpn_handling"]["mode"] = "DENY"
        elif "allow vpn" in prompt_lower:
            policy["vpn_handling"]["mode"] = "ALLOW"
            
        # Accuracy
        # Extract number if "accuracy" is mentioned
        if "accuracy" in prompt_lower:
            match = re.search(r"(\d+)", prompt_lower)
            if match:
                policy["gps_rules"]["max_accuracy_m"] = int(match.group(1))

        return policy

    def explain_decision(self, decision: str, reason_codes: list, evidence: dict) -> str:
        """
        Generates a user-friendly explanation for the decision.
        """
        if self.client:
           return self._explain_real(decision, reason_codes, evidence)
        return self._explain_mock(decision, reason_codes)

    def _explain_real(self, decision: str, reason_codes: list, evidence: dict) -> str:
        try:
             response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are AccessGate AI. Explain the access decision to the user in a short, friendly, helpful sentence. Do not mention JSON fields directly."},
                    {"role": "user", "content": f"Decision: {decision}. Reasons: {reason_codes}. Evidence: {evidence}"}
                ]
            )
             return response.choices[0].message.content
        except Exception:
            return self._explain_mock(decision, reason_codes)

    def _explain_mock(self, decision: str, reason_codes: list) -> str:
        if decision == "ALLOW":
            return "Your location and network status have been verified successfully."
        elif decision == "STEP_UP":
            reasons = ", ".join(reason_codes).replace("_", " ").lower()
            return f"We noticed potential risks ({reasons}). Please verify your identity."
        else: # DENY
            reasons = ", ".join(reason_codes).replace("_", " ").lower()
            return f"Access denied due to security policy ({reasons})."

llm_service = LLMService()
