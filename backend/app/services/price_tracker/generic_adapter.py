import logging
from typing import Optional
from app.services.price_tracker.base import BasePriceProvider

logger = logging.getLogger(__name__)


class GenericStoreAdapter(BasePriceProvider):
    """Fallback adapter for generic e-commerce platforms."""

    def can_handle(self, url: str) -> bool:
        return True

    def fetch_price(self, url: str) -> Optional[float]:
        logger.info(f"Generic adapter checking price for URL: {url}")
        return None
