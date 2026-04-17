class FormIdGenerator {
  /// Generates a unique formID: {prefix}-{yyyyMMdd}-{HHmmss}{ms}
  static String generate(String prefix) {
    final now = DateTime.now();
    final date =
        '${now.year}${_pad(now.month)}${_pad(now.day)}';
    final time =
        '${_pad(now.hour)}${_pad(now.minute)}${_pad(now.second)}${now.millisecond.toString().padLeft(3, '0')}';
    return '${prefix.isNotEmpty ? '$prefix-' : ''}$date-$time';
  }

  static String _pad(int n) => n.toString().padLeft(2, '0');
}
