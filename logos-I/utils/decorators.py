from functools import wraps
from fastapi.concurrency import run_in_threadpool
import inspect


def async_threadpool(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        if inspect.iscoroutinefunction(func):
            # If the function is already async, just await it
            return await func(*args, **kwargs)
        else:
            # If it's a regular function, run it in the threadpool
            return await run_in_threadpool(lambda: func(*args, **kwargs))

    return wrapper
