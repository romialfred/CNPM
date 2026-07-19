import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:cnpm_mobile/app/mobile_app_shell.dart';
import 'package:cnpm_mobile/core/presentation/cnpm_formatters.dart';
import 'package:cnpm_mobile/design_system/cnpm_theme.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_content_state.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_notice.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_status_badge.dart';
import 'package:cnpm_mobile/design_system/widgets/cnpm_sync_status.dart';
import 'package:cnpm_mobile/features/requests/application/add_shared_request_message.dart';
import 'package:cnpm_mobile/features/requests/application/load_member_request.dart';
import 'package:cnpm_mobile/features/requests/domain/member_request.dart';
import 'package:cnpm_mobile/features/requests/presentation/member_request_conversation_controller.dart';

class MemberRequestConversationScreen extends StatefulWidget {
  const MemberRequestConversationScreen({
    required this.requestId,
    required this.loadMemberRequest,
    required this.addSharedRequestMessage,
    required this.isDemo,
    required this.onSignOut,
    super.key,
  });

  final String requestId;
  final LoadMemberRequest loadMemberRequest;
  final AddSharedRequestMessage addSharedRequestMessage;
  final bool isDemo;
  final VoidCallback onSignOut;

  @override
  State<MemberRequestConversationScreen> createState() =>
      _MemberRequestConversationScreenState();
}

class _MemberRequestConversationScreenState
    extends State<MemberRequestConversationScreen> {
  late final MemberRequestConversationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = MemberRequestConversationController(
      requestId: widget.requestId,
      loadMemberRequest: widget.loadMemberRequest,
      addSharedRequestMessage: widget.addSharedRequestMessage,
    );
    _controller.ensureLoaded();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      title: 'Détail de la requête',
      selectedIndex: 3,
      onSignOut: widget.onSignOut,
      leading: IconButton(
        tooltip: 'Retour à la liste des requêtes',
        onPressed: () => context.go('/requests'),
        icon: const Icon(Icons.arrow_back),
      ),
      body: ListenableBuilder(
        listenable: _controller,
        builder: (context, child) {
          return ListView(
            key: const Key('member-request-conversation'),
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            children: [
              Semantics(
                header: true,
                child: Text(
                  'Conversation membre',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: CnpmColors.brandBlueDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                'Seuls les échanges explicitement partagés avec le membre apparaissent ici.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: CnpmColors.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x5),
              switch (_controller.phase) {
                RequestConversationPhase.idle ||
                RequestConversationPhase.loading => const CnpmLoadingState(
                  label: 'Chargement de la conversation partagée',
                ),
                RequestConversationPhase.failure => CnpmErrorState(
                  onRetry: _controller.reload,
                  title: 'Conversation indisponible',
                  message:
                      'La conversation n’a pas pu être chargée. Réessayez sans renvoyer de message.',
                ),
                RequestConversationPhase.notFound => const _ConversationState(
                  icon: Icons.forum_outlined,
                  title: 'Requête introuvable',
                  message:
                      'Cette référence n’est pas disponible pour la session membre.',
                ),
                RequestConversationPhase.unavailable => _ConversationState(
                  icon: Icons.cloud_off_outlined,
                  title: 'Conversation non connectée',
                  message: _controller.reason ?? 'Service indisponible.',
                ),
                RequestConversationPhase.ready => _ConversationContent(
                  controller: _controller,
                  isDemo: widget.isDemo,
                ),
              },
            ],
          );
        },
      ),
    );
  }
}

class _ConversationContent extends StatelessWidget {
  const _ConversationContent({required this.controller, required this.isDemo});

  final MemberRequestConversationController controller;
  final bool isDemo;

  @override
  Widget build(BuildContext context) {
    final detail = controller.detail!;
    final request = detail.request;
    final (statusLabel, statusTone) = _statusView(request.status);
    final isResolved = request.status == MemberRequestStatus.resolved;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isDemo) ...[
          const CnpmNotice(
            message:
                'Scénario entièrement fictif : aucune requête ni réponse n’est transmise à la CNPM.',
          ),
          const SizedBox(height: CnpmSpacing.x4),
        ],
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CnpmSpacing.x4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  spacing: CnpmSpacing.x3,
                  runSpacing: CnpmSpacing.x2,
                  alignment: WrapAlignment.spaceBetween,
                  children: [
                    Text(
                      request.reference,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: CnpmColors.brandBlue,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    CnpmStatusBadge(label: statusLabel, tone: statusTone),
                  ],
                ),
                const SizedBox(height: CnpmSpacing.x3),
                Text(
                  request.subject,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                _Definition(label: 'Catégorie', value: request.categoryLabel),
                const SizedBox(height: CnpmSpacing.x3),
                _Definition(
                  label: 'Créée le',
                  value: formatFrenchDate(request.createdOn),
                ),
                const SizedBox(height: CnpmSpacing.x3),
                _Definition(
                  label: 'Indication de délai',
                  value: request.targetDisclosure,
                ),
                const SizedBox(height: CnpmSpacing.x3),
                _Definition(
                  label: 'Description initiale',
                  value: detail.description,
                ),
              ],
            ),
          ),
        ),
        if (detail.attachmentMetadata.isNotEmpty) ...[
          const SizedBox(height: CnpmSpacing.x6),
          const _SectionTitle(title: 'Métadonnées de pièce déclarées'),
          const SizedBox(height: CnpmSpacing.x3),
          for (final attachment in detail.attachmentMetadata)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(CnpmSpacing.x4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.description_outlined,
                      color: CnpmColors.brandBlue,
                    ),
                    const SizedBox(width: CnpmSpacing.x3),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            attachment.displayName,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: CnpmSpacing.x1),
                          Text(
                            'Métadonnée fictive uniquement : aucun fichier téléversé, stocké ou analysé.',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: CnpmColors.textSecondary,
                                  height: 1.4,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
        const SizedBox(height: CnpmSpacing.x6),
        const _SectionTitle(title: 'Conversation partagée'),
        const SizedBox(height: CnpmSpacing.x2),
        Text(
          'Les notes de traitement internes ne font pas partie de cette projection.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: CnpmColors.textSecondary,
            height: 1.4,
          ),
        ),
        const SizedBox(height: CnpmSpacing.x3),
        for (final message in detail.sharedMessages) ...[
          _SharedMessageCard(message: message),
          const SizedBox(height: CnpmSpacing.x3),
        ],
        if (isResolved)
          const CnpmNotice(
            message:
                'Cette requête fictive est résolue. Aucun nouveau message ne peut être ajouté dans cet écran.',
          )
        else
          _SharedReplyForm(controller: controller),
        if (isDemo) ...[
          const SizedBox(height: CnpmSpacing.x5),
          const CnpmSyncStatus.demo(),
        ],
      ],
    );
  }
}

class _SharedReplyForm extends StatefulWidget {
  const _SharedReplyForm({required this.controller});

  final MemberRequestConversationController controller;

  @override
  State<_SharedReplyForm> createState() => _SharedReplyFormState();
}

class _SharedReplyFormState extends State<_SharedReplyForm> {
  final _formKey = GlobalKey<FormState>();
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }
    final sent = await widget.controller.send(_messageController.text);
    if (sent && mounted) {
      _messageController.clear();
      FocusScope.of(context).unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(
            header: true,
            child: Text(
              'Ajouter une réponse partagée',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: CnpmSpacing.x3),
          TextFormField(
            key: const Key('shared-reply-field'),
            controller: _messageController,
            minLines: 3,
            maxLines: 6,
            maxLength: 1000,
            enabled: !widget.controller.isSending,
            decoration: const InputDecoration(
              labelText: 'Réponse fictive *',
              alignLabelWithHint: true,
              helperText: 'Visible dans la conversation membre partagée.',
            ),
            validator: (value) {
              final body = value?.trim() ?? '';
              if (body.isEmpty) {
                return 'Saisissez une réponse.';
              }
              if (body.length < 2) {
                return 'Saisissez au moins 2 caractères.';
              }
              return null;
            },
          ),
          if (widget.controller.sendError != null) ...[
            const SizedBox(height: CnpmSpacing.x3),
            CnpmNotice(
              tone: CnpmNoticeTone.error,
              message: widget.controller.sendError!,
            ),
          ],
          const SizedBox(height: CnpmSpacing.x3),
          ElevatedButton.icon(
            key: const Key('send-shared-reply'),
            onPressed: widget.controller.isSending ? null : _submit,
            icon: widget.controller.isSending
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send_outlined),
            label: Text(
              widget.controller.isSending
                  ? 'Ajout en cours…'
                  : 'Ajouter la réponse fictive',
            ),
          ),
        ],
      ),
    );
  }
}

class _SharedMessageCard extends StatelessWidget {
  const _SharedMessageCard({required this.message});

  final SharedRequestMessage message;

  @override
  Widget build(BuildContext context) {
    final isMember = message.author == SharedRequestMessageAuthor.member;
    final authorLabel = isMember ? 'Vous' : 'CNPM — réponse de démonstration';
    return Semantics(
      container: true,
      label:
          '$authorLabel, ${formatFrenchDate(message.sentAt)} : ${message.body}',
      child: Card(
        color: isMember ? CnpmColors.brandBlue50 : CnpmColors.surface,
        child: Padding(
          padding: const EdgeInsets.all(CnpmSpacing.x4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                authorLabel,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: CnpmColors.brandBlue,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: CnpmSpacing.x1),
              Text(
                formatFrenchDate(message.sentAt),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: CnpmColors.textMuted),
              ),
              const SizedBox(height: CnpmSpacing.x2),
              Text(
                message.body,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(height: 1.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConversationState extends StatelessWidget {
  const _ConversationState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CnpmSpacing.x6),
        child: Column(
          children: [
            Icon(icon, color: CnpmColors.brandBlue, size: CnpmSpacing.x8),
            const SizedBox(height: CnpmSpacing.x3),
            Semantics(
              header: true,
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: CnpmSpacing.x2),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: CnpmColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: CnpmSpacing.x4),
            OutlinedButton.icon(
              onPressed: () => context.go('/requests'),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Retour aux requêtes'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Definition extends StatelessWidget {
  const _Definition({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: CnpmColors.textSecondary),
        ),
        const SizedBox(height: CnpmSpacing.x1),
        Text(value, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        title,
        style: Theme.of(
          context,
        ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

(String, CnpmStatusTone) _statusView(MemberRequestStatus status) {
  return switch (status) {
    MemberRequestStatus.inProgress => ('En cours', CnpmStatusTone.info),
    MemberRequestStatus.awaitingMember => (
      'Votre réponse attendue',
      CnpmStatusTone.warning,
    ),
    MemberRequestStatus.resolved => ('Résolue', CnpmStatusTone.success),
  };
}
