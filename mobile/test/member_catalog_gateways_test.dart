import 'package:flutter_test/flutter_test.dart';

import 'package:cnpm_mobile/features/documents/domain/member_document.dart';
import 'package:cnpm_mobile/features/documents/infrastructure/demo_member_document_gateway.dart';
import 'package:cnpm_mobile/features/documents/infrastructure/unavailable_member_document_gateway.dart';
import 'package:cnpm_mobile/features/notifications/domain/member_notification.dart';
import 'package:cnpm_mobile/features/notifications/infrastructure/demo_member_notification_gateway.dart';
import 'package:cnpm_mobile/features/notifications/infrastructure/unavailable_member_notification_gateway.dart';

void main() {
  test('MOB-014 transporte uniquement des métadonnées fictives', () async {
    final result = await const DemoMemberDocumentGateway().loadDocuments();

    expect(result, isA<MemberDocumentsAvailable>());
    final documents = (result as MemberDocumentsAvailable).documents;
    expect(documents, hasLength(3));
    expect(
      documents.every((item) => item.id.startsWith('demo-document-')),
      isTrue,
    );
    expect(
      documents.every((item) => item.reference.startsWith('DEMO-DOC-')),
      isTrue,
    );
    expect(
      documents.every((item) => item.availabilityDisclosure.isNotEmpty),
      isTrue,
    );
  });

  test('MOB-015 ne modélise ni canal livré ni état lu/non-lu', () async {
    final result = await const DemoMemberNotificationGateway()
        .loadNotifications();

    expect(result, isA<MemberNotificationsAvailable>());
    final notifications =
        (result as MemberNotificationsAvailable).notifications;
    expect(notifications, hasLength(3));
    expect(
      notifications.every((item) => item.id.startsWith('demo-notification-')),
      isTrue,
    );
    expect(
      notifications.every((item) => item.sourceDisclosure.isNotEmpty),
      isTrue,
    );
  });

  test('les profils HTTP restent fermés faute de collections typées', () async {
    final documents = await const UnavailableMemberDocumentGateway()
        .loadDocuments();
    final notifications = await const UnavailableMemberNotificationGateway()
        .loadNotifications();

    expect(documents, isA<MemberDocumentsUnavailable>());
    expect(notifications, isA<MemberNotificationsUnavailable>());
  });
}
