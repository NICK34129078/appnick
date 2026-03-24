import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../data/models/scan_result.dart';

class AuthService {
  AuthService(this._auth, this._db);

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;

  Future<UserCredential> signIn(String email, String password) {
    return _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential> signUp(String email, String password, String fullName) async {
    final credential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
    await _db.collection('users').doc(credential.user?.uid).set({
      'fullName': fullName,
      'email': email,
      'createdAt': FieldValue.serverTimestamp(),
      'gdprConsentVersion': null,
    });
    return credential;
  }
}

class FaceDetectionService {
  final FaceDetector _detector = FaceDetector(
    options: FaceDetectorOptions(
      performanceMode: FaceDetectorMode.accurate,
      enableContours: true,
      enableLandmarks: true,
    ),
  );

  Future<List<Face>> detect(InputImage image) => _detector.processImage(image);

  Future<void> dispose() => _detector.close();
}

class AnalysisProxyService {
  AnalysisProxyService(this._dio, this.baseUrl);

  final Dio _dio;
  final String baseUrl;

  Future<ScanResult> analyzeScan(Uint8List bytes) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '$baseUrl/analysis/scan',
      data: FormData.fromMap({
        'image': MultipartFile.fromBytes(bytes, filename: 'scan.jpg'),
      }),
    );
    return ScanResult.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<String> askChat(String message) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '$baseUrl/chat',
      data: <String, dynamic>{'message': message},
    );
    return (response.data ?? <String, dynamic>{})['reply'] as String? ?? '';
  }
}

class ScanRepository {
  ScanRepository(this._db);

  final FirebaseFirestore _db;

  Future<void> saveResult(String uid, ScanResult result) {
    return _db.collection('users').doc(uid).collection('scans').add(result.toJson());
  }
}

class SubscriptionService {
  Future<void> configure(String apiKey, String appUserId) async {
    await Purchases.configure(PurchasesConfiguration(apiKey)..appUserID = appUserId);
  }

  Future<CustomerInfo> getCustomerInfo() => Purchases.getCustomerInfo();
}

class ReminderService {
  ReminderService(this._notifications);

  final FlutterLocalNotificationsPlugin _notifications;

  Future<void> initialize() async {
    const settings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );
    await _notifications.initialize(settings);
  }
}

class PrivacyService {
  PrivacyService(this._db, this._auth);

  final FirebaseFirestore _db;
  final FirebaseAuth _auth;

  Future<void> saveGdprConsent(String version) async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    await _db.collection('users').doc(uid).set(
      {'gdprConsentVersion': version, 'gdprConsentAt': FieldValue.serverTimestamp()},
      SetOptions(merge: true),
    );
  }

  Future<void> deleteUserData() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;
    final scans = await _db.collection('users').doc(uid).collection('scans').get();
    for (final item in scans.docs) {
      await item.reference.delete();
    }
    await _db.collection('users').doc(uid).delete();
    await _auth.currentUser?.delete();
  }
}

Future<List<CameraDescription>> loadDeviceCameras() => availableCameras();
