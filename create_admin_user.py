#!/usr/bin/env python
"""
Quick script to create an admin user for the Quick Assist platform.
Run this script to create an admin user that can access admin endpoints.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickassist_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def create_admin_user():
    print("=== Quick Assist Admin User Creator ===\n")
    
    username = input("Enter admin username: ").strip()
    if not username:
        print("Username is required!")
        return
    
    email = input("Enter admin email: ").strip()
    if not email:
        print("Email is required!")
        return
    
    password = input("Enter admin password: ").strip()
    if not password:
        print("Password is required!")
        return
    
    try:
        with transaction.atomic():
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                print(f"\nUser '{username}' already exists!")
                promote = input("Do you want to promote them to admin? (y/n): ").strip().lower()
                if promote == 'y':
                    user = User.objects.get(username=username)
                    user.user_type = 'ADMIN'
                    user.is_staff = True
                    user.is_superuser = True
                    user.is_active = True
                    user.save()
                    print(f"✅ Successfully promoted '{username}' to admin!")
                else:
                    print("Operation cancelled.")
                return
            
            # Create new admin user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                user_type='ADMIN',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            
            print(f"\n✅ Successfully created admin user: '{username}'")
            print("This user can now access admin endpoints!")
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")

if __name__ == "__main__":
    create_admin_user()
