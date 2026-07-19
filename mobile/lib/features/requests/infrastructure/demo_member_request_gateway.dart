import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request_gateway.dart';

final class DemoMemberRequestGateway implements MemberRequestGateway {
  DemoMemberRequestGateway() : _requests = _seedRequests();

  final List<MemberRequestDetail> _requests;
  var _nextRequestNumber = 4;
  var _nextMessageNumber = 10;

  @override
  Future<List<MemberRequest>> loadRequests() async {
    return List.unmodifiable(_requests.map((detail) => detail.request));
  }

  @override
  Future<MemberRequestLookup> findRequest(String id) async {
    final detail = _find(id);
    return detail == null
        ? const MemberRequestNotFound()
        : MemberRequestFound(detail);
  }

  @override
  Future<MemberRequestCreationResult> createRequest(
    NewMemberRequestDraft draft,
  ) async {
    final sequence = _nextRequestNumber++;
    final id = 'demo-request-${sequence.toString().padLeft(4, '0')}';
    final createdOn = DateTime.utc(2026, 7, 19, 12);
    final attachmentName = draft.attachmentDisplayName?.trim();
    final detail = MemberRequestDetail(
      request: MemberRequest(
        id: id,
        reference: 'DEMO-REQ-${sequence.toString().padLeft(4, '0')}',
        subject: draft.subject.trim(),
        categoryLabel: _categoryLabel(draft.category),
        createdOn: createdOn,
        status: MemberRequestStatus.inProgress,
        targetDisclosure:
            'Délai indicatif fictif : 5 jours. Aucune politique SLA réelle n’est appliquée.',
      ),
      description: draft.description.trim(),
      sharedMessages: [
        SharedRequestMessage(
          id: 'demo-message-${_nextMessageNumber++}',
          author: SharedRequestMessageAuthor.member,
          body: draft.description.trim(),
          sentAt: createdOn,
        ),
      ],
      attachmentMetadata: attachmentName == null || attachmentName.isEmpty
          ? const []
          : [RequestAttachmentMetadata(displayName: attachmentName)],
    );
    _requests.insert(0, detail);
    return MemberRequestCreated(detail);
  }

  @override
  Future<SharedRequestMessageResult> addSharedMessage({
    required String requestId,
    required String body,
  }) async {
    final index = _requests.indexWhere(
      (detail) => detail.request.id == requestId,
    );
    if (index < 0) {
      return const SharedRequestMessageRequestNotFound();
    }

    final current = _requests[index];
    final message = SharedRequestMessage(
      id: 'demo-message-${_nextMessageNumber++}',
      author: SharedRequestMessageAuthor.member,
      body: body.trim(),
      sentAt: DateTime.utc(2026, 7, 19, 12, _nextMessageNumber),
    );
    final updated = MemberRequestDetail(
      request: current.request,
      description: current.description,
      sharedMessages: List.unmodifiable([...current.sharedMessages, message]),
      attachmentMetadata: current.attachmentMetadata,
    );
    _requests[index] = updated;
    return SharedRequestMessageAdded(updated);
  }

  MemberRequestDetail? _find(String id) {
    for (final detail in _requests) {
      if (detail.request.id == id) {
        return detail;
      }
    }
    return null;
  }

  static String _categoryLabel(MemberRequestCategory category) {
    return switch (category) {
      MemberRequestCategory.generalInformation => 'Information générale',
      MemberRequestCategory.memberData => 'Données du membre',
      MemberRequestCategory.documentHelp => 'Assistance documentaire',
    };
  }

  static List<MemberRequestDetail> _seedRequests() {
    return [
      MemberRequestDetail(
        request: MemberRequest(
          id: 'demo-request-0003',
          reference: 'DEMO-REQ-0003',
          subject: 'Mise à jour des informations de contact',
          categoryLabel: 'Données du membre',
          createdOn: DateTime.utc(2026, 7, 16),
          status: MemberRequestStatus.awaitingMember,
          targetDisclosure:
              'Délai indicatif fictif : réponse attendue avant le 22 juillet 2026.',
        ),
        description:
            'Je souhaite vérifier la procédure fictive de mise à jour de mes coordonnées.',
        sharedMessages: [
          SharedRequestMessage(
            id: 'demo-message-1',
            author: SharedRequestMessageAuthor.member,
            body:
                'Je souhaite vérifier la procédure fictive de mise à jour de mes coordonnées.',
            sentAt: DateTime.utc(2026, 7, 16, 9, 20),
          ),
          SharedRequestMessage(
            id: 'demo-message-2',
            author: SharedRequestMessageAuthor.cnpm,
            body:
                'Réponse de démonstration : merci de confirmer le canal de contact souhaité.',
            sentAt: DateTime.utc(2026, 7, 17, 10, 5),
          ),
        ],
        attachmentMetadata: const [],
      ),
      MemberRequestDetail(
        request: MemberRequest(
          id: 'demo-request-0002',
          reference: 'DEMO-REQ-0002',
          subject: 'Question sur un document du portail',
          categoryLabel: 'Assistance documentaire',
          createdOn: DateTime.utc(2026, 7, 9),
          status: MemberRequestStatus.inProgress,
          targetDisclosure:
              'Délai indicatif fictif : traitement sous 5 jours ouvrés.',
        ),
        description:
            'Je cherche une information de démonstration sur un document du portail.',
        sharedMessages: [
          SharedRequestMessage(
            id: 'demo-message-3',
            author: SharedRequestMessageAuthor.member,
            body:
                'Je cherche une information de démonstration sur un document du portail.',
            sentAt: DateTime.utc(2026, 7, 9, 14, 30),
          ),
        ],
        attachmentMetadata: const [],
      ),
      MemberRequestDetail(
        request: MemberRequest(
          id: 'demo-request-0001',
          reference: 'DEMO-REQ-0001',
          subject: 'Correction de la raison sociale',
          categoryLabel: 'Données du membre',
          createdOn: DateTime.utc(2026, 6, 28),
          status: MemberRequestStatus.resolved,
          targetDisclosure: 'Scénario fictif clôturé le 2 juillet 2026.',
        ),
        description: 'Cette requête fictive illustre une correction terminée.',
        sharedMessages: [
          SharedRequestMessage(
            id: 'demo-message-4',
            author: SharedRequestMessageAuthor.member,
            body: 'Cette requête fictive illustre une correction terminée.',
            sentAt: DateTime.utc(2026, 6, 28, 8, 15),
          ),
          SharedRequestMessage(
            id: 'demo-message-5',
            author: SharedRequestMessageAuthor.cnpm,
            body:
                'Réponse de démonstration : la vérification fictive est terminée.',
            sentAt: DateTime.utc(2026, 7, 2, 16, 40),
          ),
        ],
        attachmentMetadata: const [],
      ),
    ];
  }
}
