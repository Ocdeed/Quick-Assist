# In api/mpesa_service.py

import requests 
import base64
from datetime import datetime
import os

from django.conf import settings 

def get_mpesa_access_token():
    """
    Get access token from M-Pesa Daraja API.
    """
    consumer_key = os.getenv('MPESA_CONSUMER_KEY')
    consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
    
    if not consumer_key or not consumer_secret:
        raise Exception("M-Pesa credentials not configured.")
        
    api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    # The credentials need to be Base64 encoded
    credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    headers = {"Authorization": f"Basic {credentials}"}
    
    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status() # Raise an exception for bad status codes
        return response.json().get("access_token")
    except requests.exceptions.RequestException as e:
        # Handle exceptions like connection errors, timeouts, etc.
        raise Exception(f"Failed to get M-Pesa token: {e}")

def initiate_stk_push(phone_number, amount, account_reference, transaction_desc, callback_url):
    """
    Initiate STK Push for M-Pesa payment.
    """
    access_token = get_mpesa_access_token()
    if not access_token:
        raise Exception("Cannot initiate STK push without access token.")

    api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Format phone number to Safaricom's standard (e.g., 254712345678)
    if phone_number.startswith('+'):
        phone_number = phone_number[1:]
    if phone_number.startswith('0'):
        phone_number = '254' + phone_number[1:]

    # Timestamp format required by M-Pesa
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    shortcode = os.getenv('MPESA_SHORTCODE')
    passkey = os.getenv('MPESA_PASSKEY')
    
    # Generate the password required for the STK Push
    password_data = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(password_data.encode()).decode()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline", # Or "CustomerBuyGoodsOnline"
        "Amount": str(int(amount)), # Must be an integer string
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": account_reference, # e.g., Booking ID
        "TransactionDesc": transaction_desc, # e.g., "Payment for booking"
    }
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to initiate STK push: {e}")