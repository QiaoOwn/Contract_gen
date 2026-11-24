"""One request through the historical urllib HTTP path; no implicit paid retry."""
import json
import sys
import urllib.error
import urllib.request


def execute(request):
    proxy = request.get("proxy")
    handler = urllib.request.ProxyHandler({"http": proxy, "https": proxy} if proxy else {})
    opener = urllib.request.build_opener(handler)
    data = json.dumps(request["payload"], ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(request["url"], data=data, method="POST", headers={
        "Content-Type": "application/json", "Authorization": "Bearer " + request["key"],
        "Connection": "close",
    })
    try:
        with opener.open(req, timeout=request["timeoutSeconds"]) as response:
            return {"status": response.status, "rawText": response.read().decode("utf-8")}
    except urllib.error.HTTPError as error:
        return {"status": error.code, "rawText": error.read().decode("utf-8", errors="replace")}


if __name__ == "__main__":
    try:
        result = execute(json.load(sys.stdin))
        sys.stdout.write(json.dumps(result, ensure_ascii=True))
    except Exception as error:
        sys.stdout.write(json.dumps({"transportError": type(error).__name__ + ": " + str(error)}))
        sys.exit(2)
