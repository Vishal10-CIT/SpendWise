from typing import Optional, Dict
from app.services.price_tracker.base import BasePriceProvider


class MockPriceProvider(BasePriceProvider):
    """
    Test and demonstration provider.
    Allows injecting deterministic price responses for automated test suites.
    """

    def __init__(self):
        self._price_registry: Dict[str, Optional[float]] = {}

    def set_mock_price(self, url_or_keyword: str, price: Optional[float]):
        self._price_registry[url_or_keyword.lower()] = price

    def clear_mock_prices(self):
        self._price_registry.clear()

    def can_handle(self, url: str) -> bool:
        url_lower = url.lower()
        return "mock" in url_lower or "test" in url_lower or any(k in url_lower for k in self._price_registry)

    def fetch_price(self, url: str) -> Optional[float]:
        url_lower = url.lower()
        for key, price in self._price_registry.items():
            if key in url_lower:
                return price
        # Default mock price if url has mock/test and no explicit registry hit
        if "mock" in url_lower or "test" in url_lower:
            return 19999.0
        return None
