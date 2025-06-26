"""
Integrations package initialization
"""

# This file makes the integrations directory a Python package
from googleapiclient.discovery import build


class GoogleClient:
    def __init__(self, creds, service_name, version):
        self.creds = creds
        self.service_name = service_name
        self.version = version

    def _build_service(self):
        return build(self.service_name, self.version, credentials=self.creds)
