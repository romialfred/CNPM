import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/core/domain/member_content_failure.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/demo_member_request_gateway.dart';
import 'package:cnpm_mobile/features/requests/infrastructure/unavailable_member_request_gateway.dart';

void main() {
  test(
    'MOB-012 crée une requête fictive visible dans la même session',
    () async {
      final gateway = DemoMemberRequestGateway();

      final result = await gateway.createRequest(
        const NewMemberRequestDraft(
          category: MemberRequestCategory.generalInformation,
          subject: 'Question fictive de test',
          description:
              'Description entièrement fictive assez longue pour le scénario.',
          attachmentDisplayName: 'preuve-demo.txt',
        ),
      );

      expect(result, isA<MemberRequestCreated>());
      final created = (result as MemberRequestCreated).detail;
      expect(created.request.id, 'demo-request-0004');
      expect(created.request.reference, 'DEMO-REQ-0004');
      expect(created.request.createdOn, DateTime.utc(2026, 7, 19, 12));
      expect(created.request.targetDisclosure, contains('fictif'));
      expect(created.attachmentMetadata.single.displayName, 'preuve-demo.txt');
      expect(
        created.sharedMessages.single.author,
        SharedRequestMessageAuthor.member,
      );
      expect((await gateway.loadRequests()).first.id, created.request.id);
    },
  );

  test('MOB-013 ajoute uniquement un message partagé', () async {
    final gateway = DemoMemberRequestGateway();

    final result = await gateway.addSharedMessage(
      requestId: 'demo-request-0003',
      body: 'Réponse membre fictive.',
    );

    expect(result, isA<SharedRequestMessageAdded>());
    final detail = (result as SharedRequestMessageAdded).detail;
    expect(detail.sharedMessages.last.body, 'Réponse membre fictive.');
    expect(
      detail.sharedMessages.last.author,
      SharedRequestMessageAuthor.member,
    );
  });

  test('le profil HTTP requêtes reste fermé faute de contrats typés', () async {
    const gateway = UnavailableMemberRequestGateway();

    await expectLater(
      Future<List<MemberRequest>>.sync(gateway.loadRequests),
      throwsA(isA<MemberContentFailure>()),
    );
    expect(
      await gateway.findRequest('request-id'),
      isA<MemberRequestUnavailable>(),
    );
    expect(
      await gateway.createRequest(
        const NewMemberRequestDraft(
          category: MemberRequestCategory.memberData,
          subject: 'Objet fictif',
          description: 'Description fictive suffisamment longue.',
          attachmentDisplayName: null,
        ),
      ),
      isA<MemberRequestCreationUnavailable>(),
    );
    expect(
      await gateway.addSharedMessage(
        requestId: 'request-id',
        body: 'Message fictif.',
      ),
      isA<SharedRequestMessageUnavailable>(),
    );
  });
}
