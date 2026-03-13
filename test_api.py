import requests

url = "http://127.0.0.1:8000/api/review"
data = {
    "code": "def hello():\n  print('World')",
    "language": "python"
}

resp = requests.post(url, json=data)
print("Status Code:", resp.status_code)
print(resp.json())
