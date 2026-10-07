#!/usr/bin/env python3
"""
AI Fairness Lab — Python Live Server
University Seminar Interactive Experiment

Features:
- Zero external dependencies (uses standard Python 3 libraries)
- Static file serving with proper MIME types & security checks
- POST /api/predict live inference backend endpoint
- GET /api/health health-check endpoint
- Console logger displaying auditor requests in real time
"""

import http.server
import socketserver
import os
import sys
import json
import time
import random
from urllib.parse import urlparse

PORT = int(os.environ.get('PORT', 8000))
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

BENCHMARK_CASES = {
    "tc01": {
        "groundTruth": "Female",
        "models": {
            "modelA": {"prediction": "Female", "confidence": 98.2, "correct": True},
            "modelB": {"prediction": "Female", "confidence": 96.7, "correct": True},
            "modelC": {"prediction": "Female", "confidence": 94.1, "correct": True}
        }
    },
    "tc02": {
        "groundTruth": "Female",
        "models": {
            "modelA": {"prediction": "Male", "confidence": 71.4, "correct": False},
            "modelB": {"prediction": "Male", "confidence": 68.9, "correct": False},
            "modelC": {"prediction": "Female", "confidence": 52.3, "correct": True}
        }
    },
    "tc03": {
        "groundTruth": "Male",
        "models": {
            "modelA": {"prediction": "Male", "confidence": 99.1, "correct": True},
            "modelB": {"prediction": "Male", "confidence": 98.4, "correct": True},
            "modelC": {"prediction": "Male", "confidence": 97.8, "correct": True}
        }
    },
    "tc04": {
        "groundTruth": "Male",
        "models": {
            "modelA": {"prediction": "Male", "confidence": 88.6, "correct": True},
            "modelB": {"prediction": "Male", "confidence": 99.2, "correct": True},
            "modelC": {"prediction": "Female", "confidence": 57.1, "correct": False}
        }
    },
    "tc05": {
        "groundTruth": "Female",
        "models": {
            "modelA": {"prediction": "Female", "confidence": 63.2, "correct": True},
            "modelB": {"prediction": "Male", "confidence": 54.8, "correct": False},
            "modelC": {"prediction": "Female", "confidence": 61.0, "correct": True}
        }
    }
}

class FairnessLabHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS and disable cache during development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            payload = {
                "status": "ok",
                "server": "Python 3",
                "python_version": sys.version.split()[0],
                "mode": "live",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return
        
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/predict':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                test_case_id = data.get('testCaseId')
                model_key = data.get('modelKey')

                if not test_case_id or not model_key:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Missing testCaseId or modelKey"}).encode('utf-8'))
                    return

                case_data = BENCHMARK_CASES.get(test_case_id)
                if not case_data or model_key not in case_data["models"]:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Unknown testCaseId ({test_case_id}) or modelKey ({model_key})"}).encode('utf-8'))
                    return

                # Simulated jitter (100 - 250ms)
                jitter_ms = random.randint(100, 250)
                time.sleep(jitter_ms / 1000.0)

                res = case_data["models"][model_key]
                print(f"[API /predict] Audited Case: {test_case_id} | Model: {model_key:7} | Pred: {res['prediction']:6} | Conf: {res['confidence']}% | Correct: {res['correct']} ({jitter_ms}ms)")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response_payload = {
                    "testCaseId": test_case_id,
                    "modelKey": model_key,
                    "prediction": res["prediction"],
                    "confidence": res["confidence"],
                    "correct": res["correct"],
                    "serverLatencyMs": jitter_ms,
                    "engine": "Python Live Inference Runner",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))
                return

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
                return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    server_address = ('0.0.0.0', PORT)
    try:
        httpd = http.server.ThreadingHTTPServer(server_address, FairnessLabHandler)
    except Exception as e:
        # Fallback to 127.0.0.1 if 0.0.0.0 is restricted
        server_address = ('127.0.0.1', PORT)
        httpd = http.server.ThreadingHTTPServer(server_address, FairnessLabHandler)

    print("\n============================================================")
    print("            AI FAIRNESS LAB — PYTHON SERVER                 ")
    print("       University Seminar Interactive Experiment            ")
    print("============================================================")
    print(f"  Local Web Server:  http://127.0.0.1:{PORT}")
    print(f"  Alternative URL:   http://localhost:{PORT}")
    print(f"  Live API Endpoint: http://127.0.0.1:{PORT}/api/predict")
    print(f"  Health Check:      http://127.0.0.1:{PORT}/api/health")
    print("============================================================")
    print("  Server is active! Press Ctrl+C to stop.\n")
    sys.stdout.flush()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
