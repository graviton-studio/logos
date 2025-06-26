from datetime import datetime


def format_date_for_google(date_input):
    if isinstance(date_input, datetime):
        return date_input.strftime("%Y/%m/%d")
    elif isinstance(date_input, str):
        # Assume user passes valid Gmail-style string
        return date_input
    return None


def build_query(**kwargs):
    query_parts = []

    for key, value in kwargs.items():
        if not value:
            continue

        # Map Pythonic keys to Gmail query keys
        if key == "from_":
            key = "from"
        elif key == "to":
            key = "to"
        elif key == "subject":
            key = "subject"
        elif key == "after":
            key = "after"
        elif key == "before":
            key = "before"
        elif key == "newer_than":
            key = "newer_than"
        elif key == "older_than":
            key = "older_than"

        # Format dates if needed
        if key in ["after", "before"]:
            value = format_date_for_google(value)

        # Special cases
        if key == "text":
            query_parts.append(value)
        elif key == "or_":
            query_parts.append(" OR ".join(value))
        elif key == "and_":
            query_parts.append(" AND ".join(value))
        elif key == "exclude":
            for item in value:
                query_parts.append(f"-{item}")
        else:
            query_parts.append(f'{key}:"{value}"')

    return " ".join(query_parts)
