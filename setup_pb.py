#!/usr/bin/env python3
import requests
import json
import time
from pathlib import Path

BASE_URL = "http://localhost:8090"
ADMIN_EMAIL = "admin@herrera.com"
ADMIN_PASSWORD = "12345678"
BASE_DIR = Path(__file__).resolve().parent
PB_DATA_PATH = BASE_DIR / "pb" / "pb_data"

def create_superadmin():
    """Create a superadmin account"""
    try:
        print("[*] Creating superadmin account...")
        response = requests.post(
            f"{BASE_URL}/api/admins",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "passwordConfirm": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            print(f"✓ Superadmin created: {ADMIN_EMAIL}")
            return True
        elif response.status_code == 400 and "already exists" in response.text:
            print(f"✓ Superadmin already exists: {ADMIN_EMAIL}")
            return True
        else:
            print(f"✗ Error creating superadmin: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def authenticate_admin():
    """Authenticate as admin"""
    try:
        print("[*] Authenticating as admin...")
        response = requests.post(
            f"{BASE_URL}/api/admins/auth-with-password",
            json={
                "identity": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Authenticated successfully")
            return data.get("token")
        else:
            print(f"✗ Authentication failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def add_landing_images(token):
    """Add landing images to the collection"""
    images = [
        {
            "title": "Sofá Verde Moderno",
            "image_file": "furniture1.jpg",
            "active": True
        },
        {
            "title": "Silla Minimalista",
            "image_file": "furniture2.jpg",
            "active": True
        },
        {
            "title": "Muebles de Living",
            "image_file": "furniture3.jpg",
            "active": True
        }
    ]
    
    headers = {"Authorization": f"Admin {token}"}
    
    for idx, img in enumerate(images, 1):
        try:
            print(f"[*] Adding image {idx}: {img['title']}...")
            
            # First, create the record
            response = requests.post(
                f"{BASE_URL}/api/collections/landing_images/records",
                headers=headers,
                json={
                    "title": img["title"],
                    "active": img["active"]
                }
            )
            
            if response.status_code == 201:
                record = response.json()
                record_id = record.get("id")
                print(f"✓ Record created: {record_id}")
                
                # Now upload the image file
                image_path = PB_DATA_PATH / img['image_file']

                with open(image_path, 'rb') as f:
                    files = {'image': f}
                    update_response = requests.patch(
                        f"{BASE_URL}/api/collections/landing_images/records/{record_id}",
                        headers={"Authorization": f"Admin {token}"},
                        files=files
                    )
                    
                    if update_response.status_code == 200:
                        print(f"✓ Image uploaded for: {img['title']}")
                    else:
                        print(f"✗ Error uploading image: {update_response.status_code}")
                        print(update_response.text)
            else:
                print(f"✗ Error creating record: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"✗ Error adding image {idx}: {e}")

def main():
    print("=" * 50)
    print("PocketBase Setup Script")
    print("=" * 50)
    print()
    
    # Wait for PocketBase to be ready
    print("[*] Waiting for PocketBase to be ready...")
    for i in range(30):
        try:
            response = requests.get(f"{BASE_URL}/api/health")
            if response.status_code == 200:
                print("✓ PocketBase is ready")
                break
        except:
            pass
        time.sleep(1)
    else:
        print("✗ PocketBase did not start in time")
        return
    
    print()
    
    # Create superadmin
    if not create_superadmin():
        print("✗ Failed to create superadmin")
        return
    
    time.sleep(1)
    
    # Authenticate
    token = authenticate_admin()
    if not token:
        print("✗ Failed to authenticate")
        return
    
    time.sleep(1)
    
    # Add images
    print()
    add_landing_images(token)
    
    print()
    print("=" * 50)
    print("Setup complete!")
    print("=" * 50)
    print()
    print("Credentials:")
    print(f"  Email: {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
    print()
    print("URLs:")
    print(f"  Admin Panel: http://localhost:8090/_/")
    print(f"  Web App Admin: http://localhost:5175")
    print(f"  Web App Public: http://localhost:5174")

if __name__ == "__main__":
    main()
