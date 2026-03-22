#!/usr/bin/env python
# -*- coding: utf-8 -*-
import requests
import json
import time
import sys
from pathlib import Path

BASE_URL = "http://localhost:8090"
ADMIN_EMAIL = "admin@herrera.com"
ADMIN_PASSWORD = "12345678"
BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "pb" / "pb_schema.json"
PB_DATA_PATH = BASE_DIR / "pb" / "pb_data"

def log(msg):
    """Print with encoding fix"""
    try:
        print(msg)
    except:
        print(msg.encode('utf-8', 'ignore').decode('utf-8'))

def create_superadmin():
    """Create superadmin if doesn't exist"""
    try:
        log("[*] Checking superadmin...")
        response = requests.post(
            f"{BASE_URL}/api/admins",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "passwordConfirm": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            log("[+] Superadmin created successfully")
            return True
        elif response.status_code == 400:
            log("[+] Superadmin already exists")
            return True
        else:
            log(f"[-] Error creating superadmin: {response.status_code}")
            return False
    except Exception as e:
        log(f"[-] Error: {str(e)}")
        return False

def authenticate_admin():
    """Get auth token"""
    try:
        log("[*] Authenticating admin...")
        response = requests.post(
            f"{BASE_URL}/api/admins/auth-with-password",
            json={
                "identity": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        
        if response.status_code == 200:
            token = response.json().get("token")
            log("[+] Authentication successful")
            return token
        else:
            log(f"[-] Auth failed: {response.status_code}")
            return None
    except Exception as e:
        log(f"[-] Error: {str(e)}")
        return None

def import_schema(token):
    """Import schema collections"""
    try:
        log("[*] Importing schema...")
        
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema = json.load(f)
        
        headers = {"Authorization": f"Admin {token}"}
        
        # Import each collection
        for collection in schema:
            try:
                response = requests.post(
                    f"{BASE_URL}/api/collections",
                    headers=headers,
                    json=collection
                )
                
                if response.status_code == 201:
                    log(f"[+] Collection created: {collection['name']}")
                elif response.status_code == 400 and "already exists" in response.text:
                    log(f"[+] Collection already exists: {collection['name']}")
                else:
                    log(f"[!] Warning for {collection['name']}: {response.status_code}")
                    
            except Exception as e:
                log(f"[!] Error importing {collection['name']}: {str(e)}")
        
        return True
    except Exception as e:
        log(f"[-] Error importing schema: {str(e)}")
        return False

def add_landing_images(token):
    """Add 3 furniture images"""
    try:
        log("[*] Adding landing images...")
        
        images_data = [
            {
                "title": "Sofa Verde Moderno",
                "filename": "furniture1.jpg",
                "order": 1
            },
            {
                "title": "Silla Minimalista",
                "filename": "furniture2.jpg", 
                "order": 2
            },
            {
                "title": "Muebles de Living",
                "filename": "furniture3.jpg",
                "order": 3
            }
        ]
        
        headers = {"Authorization": f"Admin {token}"}
        for idx, img_data in enumerate(images_data, 1):
            try:
                image_path = PB_DATA_PATH / img_data['filename']
                
                # Create record with image file
                with open(image_path, 'rb') as f:
                    files = {'image': f}
                    data = {
                        'title': img_data['title'],
                        'order': img_data['order'],
                        'active': 'true'
                    }
                    
                    response = requests.post(
                        f"{BASE_URL}/api/collections/landing_images/records",
                        headers=headers,
                        files=files,
                        data=data
                    )
                
                if response.status_code == 201:
                    log(f"[+] Image {idx} added: {img_data['title']}")
                else:
                    log(f"[-] Error adding image {idx}: {response.status_code}")
                    log(f"    Response: {response.text[:200]}")
                    
            except FileNotFoundError:
                log(f"[-] Image file not found: {image_path}")
            except Exception as e:
                log(f"[-] Error adding image {idx}: {str(e)}")
        
        return True
    except Exception as e:
        log(f"[-] Error in add_landing_images: {str(e)}")
        return False

def add_otros_category(token):
    """Add 'Otros' category"""
    try:
        log("[*] Adding 'Otros' category...")
        
        headers = {"Authorization": f"Admin {token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/collections/categories/records",
            headers=headers,
            json={
                "name": "Otros",
                "description": "Otros muebles"
            }
        )
        
        if response.status_code == 201:
            log("[+] Category 'Otros' added")
        elif response.status_code == 400:
            log("[+] Category 'Otros' already exists")
        else:
            log(f"[!] Warning adding category: {response.status_code}")
            
        return True
    except Exception as e:
        log(f"[-] Error adding category: {str(e)}")
        return False

def main():
    log("="*60)
    log("PocketBase Setup Script v2")
    log("="*60)
    log("")
    
    # Wait for PocketBase
    log("[*] Waiting for PocketBase...")
    for i in range(30):
        try:
            response = requests.get(f"{BASE_URL}/api/health")
            if response.status_code == 200:
                log("[+] PocketBase is online")
                break
        except:
            pass
        time.sleep(1)
    else:
        log("[-] PocketBase did not start")
        return
    
    time.sleep(1)
    log("")
    
    # Create superadmin
    if not create_superadmin():
        log("[-] Failed to create superadmin")
        return
    
    time.sleep(1)
    
    # Authenticate
    token = authenticate_admin()
    if not token:
        log("[-] Failed to authenticate")
        return
    
    time.sleep(1)
    log("")
    
    # Import schema
    if not import_schema(token):
        log("[-] Failed to import schema")
    
    time.sleep(1)
    log("")
    
    # Add images
    if not add_landing_images(token):
        log("[-] Failed to add images")
    
    time.sleep(1)
    log("")
    
    # Add Otros category
    if not add_otros_category(token):
        log("[-] Failed to add category")
    
    log("")
    log("="*60)
    log("Setup Complete!")
    log("="*60)
    log("")
    log("Superadmin:")
    log(f"  Email: {ADMIN_EMAIL}")
    log(f"  Password: {ADMIN_PASSWORD}")
    log("")
    log("URLs:")
    log("  PocketBase Admin: http://localhost:8090/_/")
    log("  Admin Panel: http://localhost:5175")
    log("  Web Public: http://localhost:5174")
    log("")

if __name__ == "__main__":
    main()
