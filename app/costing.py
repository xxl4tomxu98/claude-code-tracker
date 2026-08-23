"""Teaching-sized cost table. Not Anthropic billing. Numbers exist so analytics has a formula."""

# (input_per_million, output_per_million)
RATES = {
    "claude-haiku": (0.80, 4.00),
    "claude-sonnet": (3.00, 15.00),
    "claude-sonnet-4": (3.00, 15.00),
    "claude-opus": (15.00, 75.00),
}
DEFAULT_RATE = (3.00, 15.00)


def estimate_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    in_rate, out_rate = RATES.get(model.lower(), DEFAULT_RATE)
    cost = (input_tokens / 1_000_000) * in_rate + (output_tokens / 1_000_000) * out_rate
    return round(cost, 6)
