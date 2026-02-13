import requests
import os

url = "https://images.seeklogo.com/logo-png/36/1/pedidosya-logo-png_seeklogo-363652.png"
path = "/Users/ronyvivas/Desktop/Rony/Pagina febrero 1/assets/pedidosya-logo.png"

try:
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        print(f"Downloaded logo to {path}")
    else:
        print(f"Failed to download. Status: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
