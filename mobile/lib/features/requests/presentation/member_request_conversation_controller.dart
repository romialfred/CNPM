import 'package:flutter/foundation.dart';

import 'package:cnpm_mobile/features/requests/application/add_shared_request_message.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';

enum RequestConversationPhase {
  idle,
  loading,
  ready,
  notFound,
  unavailable,
  failure,
}

final class MemberRequestConversationController extends ChangeNotifier {
  MemberRequestConversationController({
    required String requestId,
    required LoadMemberRequest loadMemberRequest,
    required AddSharedRequestMessage addSharedRequestMessage,
  }) : _requestId = requestId,
       _loadMemberRequest = loadMemberRequest,
       _addSharedRequestMessage = addSharedRequestMessage;

  final String _requestId;
  final LoadMemberRequest _loadMemberRequest;
  final AddSharedRequestMessage _addSharedRequestMessage;

  RequestConversationPhase _phase = RequestConversationPhase.idle;
  RequestConversationPhase get phase => _phase;

  MemberRequestDetail? _detail;
  MemberRequestDetail? get detail => _detail;

  String? _reason;
  String? get reason => _reason;

  bool _isSending = false;
  bool get isSending => _isSending;

  String? _sendError;
  String? get sendError => _sendError;

  var _isDisposed = false;

  Future<void> ensureLoaded() async {
    if (_phase != RequestConversationPhase.idle) {
      return;
    }
    await reload();
  }

  Future<void> reload() async {
    _phase = RequestConversationPhase.loading;
    _reason = null;
    _notifySafely();
    try {
      final lookup = await _loadMemberRequest(_requestId);
      switch (lookup) {
        case MemberRequestFound(:final detail):
          _detail = detail;
          _phase = RequestConversationPhase.ready;
        case MemberRequestNotFound():
          _detail = null;
          _phase = RequestConversationPhase.notFound;
        case MemberRequestUnavailable(:final reason):
          _detail = null;
          _reason = reason;
          _phase = RequestConversationPhase.unavailable;
      }
    } catch (_) {
      _detail = null;
      _phase = RequestConversationPhase.failure;
    }
    _notifySafely();
  }

  Future<bool> send(String body) async {
    if (_isSending || _phase != RequestConversationPhase.ready) {
      return false;
    }
    _isSending = true;
    _sendError = null;
    _notifySafely();
    try {
      final result = await _addSharedRequestMessage(
        requestId: _requestId,
        body: body.trim(),
      );
      switch (result) {
        case SharedRequestMessageAdded(:final detail):
          _detail = detail;
          return true;
        case SharedRequestMessageRequestNotFound():
          _phase = RequestConversationPhase.notFound;
          _detail = null;
        case SharedRequestMessageUnavailable(:final reason):
          _sendError = reason;
      }
    } catch (_) {
      _sendError =
          'La réponse fictive n’a pas pu être ajoutée. Le texte est conservé.';
    } finally {
      _isSending = false;
      _notifySafely();
    }
    return false;
  }

  void _notifySafely() {
    if (!_isDisposed) {
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }
}
