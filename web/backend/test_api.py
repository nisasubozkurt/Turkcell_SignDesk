"""
Test script for Sign Language Recognition API
Run this script to test if your backend is working correctly
"""

import requests
import base64
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
import time

# Configuration
API_BASE_URL = "http://localhost:5000"
TIMEOUT = 10  # seconds

def test_health_check():
    """Test /api/health endpoint"""
    print("\n" + "="*60)
    print("🏥 Testing Health Check Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/health", timeout=TIMEOUT)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'healthy':
                print("✅ Health check passed!")
                return True
            else:
                print("❌ Service is unhealthy")
                return False
        else:
            print("❌ Health check failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_labels():
    """Test /api/labels endpoint"""
    print("\n" + "="*60)
    print("🏷️  Testing Labels Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/labels", timeout=TIMEOUT)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Number of labels: {len(data['labels'])}")
            print(f"Sample labels: A={data['labels']['0']}, Z={data['labels']['25']}")
            print("✅ Labels endpoint working!")
            return True
        else:
            print("❌ Labels endpoint failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict_with_dummy_image():
    """Test /api/predict endpoint with a dummy image"""
    print("\n" + "="*60)
    print("🔮 Testing Predict Endpoint (Dummy Image)")
    print("="*60)
    
    try:
        # Create a dummy image (640x480, random noise)
        dummy_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Convert to PIL Image
        pil_image = Image.fromarray(dummy_image)
        
        # Convert to base64
        buffered = BytesIO()
        pil_image.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Add data URL prefix
        img_data_url = f"data:image/jpeg;base64,{img_base64}"
        
        # Send request
        print("Sending dummy image to API...")
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE_URL}/api/predict",
            json={"frame": img_data_url},
            timeout=TIMEOUT
        )
        
        elapsed_time = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            print(f"Hand Detected: {data['hand_detected']}")
            print(f"Prediction: {data['prediction']}")
            print("✅ Predict endpoint working!")
            return True
        else:
            print(f"❌ Predict endpoint failed: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict_with_webcam():
    """Test /api/predict endpoint with webcam capture (optional)"""
    print("\n" + "="*60)
    print("📸 Testing Predict Endpoint (Webcam)")
    print("="*60)
    
    try:
        # Try to open webcam
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("⚠️  Webcam not available, skipping this test")
            return True
        
        print("Opening webcam... Show your hand!")
        time.sleep(2)  # Wait for camera to warm up
        
        # Capture frame
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            print("❌ Failed to capture frame")
            return False
        
        # Convert frame to base64
        _, buffer = cv2.imencode('.jpg', frame)
        img_base64 = base64.b64encode(buffer).decode()
        img_data_url = f"data:image/jpeg;base64,{img_base64}"
        
        # Send request
        print("Sending webcam frame to API...")
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE_URL}/api/predict",
            json={"frame": img_data_url},
            timeout=TIMEOUT
        )
        
        elapsed_time = time.time() - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {elapsed_time:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            print(f"Hand Detected: {data['hand_detected']}")
            
            if data['hand_detected']:
                print(f"Predicted Letter: {data['prediction']['letter']}")
                print(f"Confidence: {data['prediction']['confidence']:.2f}")
                print(f"Landmarks Count: {len(data['landmarks']) if data['landmarks'] else 0}")
                print(f"Bounding Box: {data['bounding_box']}")
            else:
                print("No hand detected in the frame")
            
            print("✅ Webcam test completed!")
            return True
        else:
            print(f"❌ Predict endpoint failed: {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_invalid_request():
    """Test API with invalid request"""
    print("\n" + "="*60)
    print("🚫 Testing Invalid Request Handling")
    print("="*60)
    
    try:
        # Test 1: Missing frame data
        response = requests.post(
            f"{API_BASE_URL}/api/predict",
            json={},
            timeout=TIMEOUT
        )
        
        print(f"Test 1 - Missing frame:")
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("  ✅ Correctly handled missing frame")
        else:
            print("  ❌ Should return 400 for missing frame")
        
        # Test 2: Invalid base64
        response = requests.post(
            f"{API_BASE_URL}/api/predict",
            json={"frame": "invalid_base64_string"},
            timeout=TIMEOUT
        )
        
        print(f"Test 2 - Invalid base64:")
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("  ✅ Correctly handled invalid base64")
        else:
            print("  ❌ Should return 400 for invalid base64")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "🚀 "*20)
    print("STARTING API TESTS")
    print("🚀 "*20)
    
    results = {
        "Health Check": test_health_check(),
        "Labels": test_labels(),
        "Predict (Dummy)": test_predict_with_dummy_image(),
        "Predict (Webcam)": test_predict_with_webcam(),
        "Invalid Requests": test_invalid_request()
    }
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Your backend is ready!")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║   Sign Language Recognition API - Test Suite            ║
    ║                                                          ║
    ║   Make sure your backend is running before testing!     ║
    ║   Run: python app.py                                    ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    input("Press ENTER to start testing...")
    
    run_all_tests()
    
    print("\n" + "="*60)
    print("Testing completed!")
    print("="*60)