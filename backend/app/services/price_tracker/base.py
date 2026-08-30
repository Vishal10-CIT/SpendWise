from abc import ABC, abstractmethod
from typing import Optional
from urllib.parse import urlparse
import ipaddress
import socket
import re


def is_safe_url(url: str) -> bool:
    """
    Validate product URL to protect against SSRF and malicious schemes.
    Only allows http/https schemes and rejects loopback or private addresses.
    """
    if not url or not isinstance(url, str):
        return False

    url = url.strip()
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        hostname_lower = hostname.lower()
        if hostname_lower in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
            return False

        # Block private IP ranges if IP address is passed directly
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                return False
        except ValueError:
            # It's a regular domain name
            pass

        return True
    except Exception:
        return False


def detect_store_source(url: str) -> str:
    """Extract store / platform name from product URL."""
    try:
        parsed = urlparse(url.strip())
        hostname = (parsed.hostname or "").lower()
        if "amazon" in hostname:
            return "Amazon"
        elif "flipkart" in hostname:
            return "Flipkart"
        elif "myntra" in hostname:
            return "Myntra"
        elif "croma" in hostname:
            return "Croma"
        elif "apple" in hostname:
            return "Apple Store"
        elif "bestbuy" in hostname:
            return "Best Buy"
        elif "ebay" in hostname:
            return "eBay"
        elif hostname:
            parts = hostname.replace("www.", "").split(".")
            if len(parts) >= 2:
                return parts[0].capitalize()
        return "Online Store"
    except Exception:
        return "Online Store"


class BasePriceProvider(ABC):
    """Abstract Base Class for price data provider adapters."""

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Check if this adapter supports the given URL."""
        pass

    @abstractmethod
    def fetch_price(self, url: str) -> Optional[float]:
        """
        Safely retrieve the current price from a permitted source.
        Returns float price if retrieved, or None if unavailable.
        Must never bypass site protections or crash.
        """
        pass
