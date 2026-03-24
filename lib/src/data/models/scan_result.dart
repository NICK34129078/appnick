class ScanResult {
  const ScanResult({
    required this.score,
    required this.hydration,
    required this.texture,
    required this.tone,
    required this.summary,
    required this.createdAtIso,
  });

  final int score;
  final double hydration;
  final double texture;
  final double tone;
  final String summary;
  final String createdAtIso;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'score': score,
      'hydration': hydration,
      'texture': texture,
      'tone': tone,
      'summary': summary,
      'createdAtIso': createdAtIso,
    };
  }

  factory ScanResult.fromJson(Map<String, dynamic> json) {
    return ScanResult(
      score: (json['score'] as num).toInt(),
      hydration: (json['hydration'] as num).toDouble(),
      texture: (json['texture'] as num).toDouble(),
      tone: (json['tone'] as num).toDouble(),
      summary: json['summary'] as String,
      createdAtIso: json['createdAtIso'] as String,
    );
  }
}
