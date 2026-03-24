import 'package:facetrack_ai/src/data/models/scan_result.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('scan result serializes and deserializes', () {
    const input = ScanResult(
      score: 78,
      hydration: 0.82,
      texture: 0.74,
      tone: 0.79,
      summary: 'Stable and improving',
      createdAtIso: '2026-03-24T10:00:00.000Z',
    );

    final json = input.toJson();
    final output = ScanResult.fromJson(json);

    expect(output.score, 78);
    expect(output.summary, 'Stable and improving');
    expect(output.hydration, closeTo(0.82, 0.001));
  });
}
